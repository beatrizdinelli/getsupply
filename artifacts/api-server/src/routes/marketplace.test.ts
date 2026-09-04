import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { eq } from "drizzle-orm";
import {
  buyersTable,
  db,
  evaluationsTable,
  pool,
  proposalsTable,
  rfqsTable,
} from "@workspace/db";

const seedCategories = ["Rótulos", "Potes", "Caixas", "Sacos"];

let server: Server;
let baseUrl: string;
let cookie = "";
let buyerId: number | undefined;
let rfqId: number | undefined;
let proposalId: number | undefined;
let evaluationId: number | undefined;
let buyerIdsBeforeSession: number[] = [];

async function request(
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; body: unknown }> {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  if (init.body) headers.set("content-type", "application/json");

  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";", 1)[0] ?? "";

  return { response, body: await response.json() };
}

function numericId(id: string, prefix: string): number {
  assert.match(id, new RegExp(`^${prefix}-\\d+$`));
  return Number(id.slice(prefix.length + 1));
}

async function assertSeedDataAvailable(): Promise<void> {
  const result = await pool.query<{ nome: string }>(
    "select nome from categoria where nome = any($1::text[]) order by nome",
    [seedCategories],
  );
  assert.deepEqual(
    result.rows.map(({ nome }) => nome),
    [...seedCategories].sort(),
    "as quatro categorias seed devem continuar disponíveis",
  );
}

before(async () => {
  process.env.SESSION_SECRET ??= "marketplace-integration-test-secret";
  const { default: app } = await import("../app");
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address();
  assert(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}/api`;
});

after(async () => {
  if (evaluationId) {
    await db.delete(evaluationsTable).where(eq(evaluationsTable.id, evaluationId));
  }
  if (proposalId) {
    await db.delete(proposalsTable).where(eq(proposalsTable.id, proposalId));
  }
  if (rfqId) {
    await db.delete(rfqsTable).where(eq(rfqsTable.id, rfqId));
  }
  if (buyerId) {
    await db.delete(buyersTable).where(eq(buyersTable.id, buyerId));
  }
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await pool.end();
});

test("persiste e relê RFQ, proposta e avaliação sem alterar os seeds", async () => {
  await assertSeedDataAvailable();
  buyerIdsBeforeSession = (
    await db.select({ id: buyersTable.id }).from(buyersTable)
  ).map(({ id }) => id);

  const session = await request("/sessions/buyer", { method: "POST" });
  assert.equal(session.response.status, 201);
  assert.ok(cookie);
  const buyersAfterSession = await db
    .select({ id: buyersTable.id })
    .from(buyersTable);
  buyerId = buyersAfterSession
    .map(({ id }) => id)
    .find((id) => !buyerIdsBeforeSession.includes(id));
  assert.ok(buyerId, "a sessão deve persistir um novo comprador");

  const invalidRfq = await request("/rfqs", {
    method: "POST",
    body: JSON.stringify({
      title: "RFQ inválida",
      category: "Caixas",
      specification: "Teste",
      quantity: "zero",
      deadline: "data-inválida",
      region: "São Paulo - SP",
    }),
  });
  assert.equal(invalidRfq.response.status, 400);

  const rfqPayload = {
    title: `RFQ integração ${Date.now()}`,
    category: "Caixas",
    specification: "Caixa kraft 20x15x10cm, impressão em uma cor",
    quantity: "2.500 unidades",
    deadline: "2030-12-20",
    region: "São Paulo - SP",
  };
  const createdRfq = await request("/rfqs", {
    method: "POST",
    body: JSON.stringify(rfqPayload),
  });
  assert.equal(createdRfq.response.status, 201);
  const rfq = createdRfq.body as { id: string };
  rfqId = numericId(rfq.id, "rfq");

  const reloadedRfq = await request(`/rfqs/${rfq.id}`);
  assert.equal(reloadedRfq.response.status, 200);
  assert.deepEqual(reloadedRfq.body, createdRfq.body);

  const invalidProposal = await request(`/rfqs/${rfq.id}/proposals`, {
    method: "POST",
    body: JSON.stringify({
      supplierName: "",
      price: -1,
      leadTime: "amanhã",
      moq: "nenhum",
    }),
  });
  assert.equal(invalidProposal.response.status, 400);

  const createdProposal = await request(`/rfqs/${rfq.id}/proposals`, {
    method: "POST",
    body: JSON.stringify({
      supplierName: "Fornecedor do teste de integração",
      price: 3.45,
      leadTime: "2030-12-10",
      moq: "1.000 un.",
      note: "Frete incluso",
    }),
  });
  assert.equal(createdProposal.response.status, 201);
  const proposal = createdProposal.body as { id: string };
  proposalId = numericId(proposal.id, "proposal");

  const reloadedProposals = await request(`/rfqs/${rfq.id}/proposals`);
  assert.equal(reloadedProposals.response.status, 200);
  assert.deepEqual(reloadedProposals.body, [createdProposal.body]);

  const invalidEvaluation = await request(
    `/proposals/${proposal.id}/evaluations`,
    {
      method: "POST",
      body: JSON.stringify({ score: 6, comment: "Nota fora da escala" }),
    },
  );
  assert.equal(invalidEvaluation.response.status, 400);

  const createdEvaluation = await request(
    `/proposals/${proposal.id}/evaluations`,
    {
      method: "POST",
      body: JSON.stringify({ score: 5, comment: "Persistência confirmada" }),
    },
  );
  assert.equal(createdEvaluation.response.status, 201);
  const evaluation = createdEvaluation.body as { id: string };
  evaluationId = numericId(evaluation.id, "evaluation");

  const reloadedEvaluations = await request(
    `/proposals/${proposal.id}/evaluations`,
  );
  assert.equal(reloadedEvaluations.response.status, 200);
  assert.deepEqual(reloadedEvaluations.body, [createdEvaluation.body]);

  await assertSeedDataAvailable();
});