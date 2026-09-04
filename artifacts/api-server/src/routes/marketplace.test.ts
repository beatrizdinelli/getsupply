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
let buyerBCookie = "";
let buyerId: number | undefined;
let buyerBId: number | undefined;
let rfqId: number | undefined;
let buyerBRfqId: number | undefined;
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

async function requestAsBuyerB(
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; body: unknown }> {
  const headers = new Headers(init.headers);
  if (buyerBCookie) headers.set("cookie", buyerBCookie);
  if (init.body) headers.set("content-type", "application/json");

  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) buyerBCookie = setCookie.split(";", 1)[0] ?? "";

  return { response, body: await response.json() };
}

async function anonymousRequest(
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; body: unknown }> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("content-type", "application/json");
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
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
  if (buyerBRfqId) {
    await db.delete(rfqsTable).where(eq(rfqsTable.id, buyerBRfqId));
  }
  if (buyerId) {
    await db.delete(buyersTable).where(eq(buyersTable.id, buyerId));
  }
  if (buyerBId) {
    await db.delete(buyersTable).where(eq(buyersTable.id, buyerBId));
  }
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await pool.end();
});

test("persiste e relê RFQ, proposta e avaliação sem alterar os seeds", async () => {
  await assertSeedDataAvailable();
  for (const path of ["/rfqs", "/rfqs/rfq-1", "/rfqs/rfq-1/proposals", "/proposals/proposal-1/evaluations"]) {
    const result = await anonymousRequest(path);
    assert.equal(result.response.status, 401, `${path} deve exigir sessão`);
  }

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

  const buyerBSession = await requestAsBuyerB("/sessions/buyer", { method: "POST" });
  assert.equal(buyerBSession.response.status, 201);
  assert.ok(buyerBCookie);
  const buyersAfterBothSessions = await db
    .select({ id: buyersTable.id })
    .from(buyersTable);
  buyerBId = buyersAfterBothSessions
    .map(({ id }) => id)
    .find((id) => id !== buyerId && !buyerIdsBeforeSession.includes(id));
  assert.ok(buyerBId, "a segunda sessão deve persistir outro comprador");

  const emptyBuyerBList = await requestAsBuyerB("/rfqs");
  assert.equal(emptyBuyerBList.response.status, 200);
  assert.deepEqual(emptyBuyerBList.body, []);

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
    body: JSON.stringify({ ...rfqPayload, buyerId: buyerBId }),
  });
  assert.equal(createdRfq.response.status, 201);
  const rfq = createdRfq.body as { id: string };
  rfqId = numericId(rfq.id, "rfq");
  const [persistedBuyerARfq] = await db
    .select({ buyerId: rfqsTable.buyerId })
    .from(rfqsTable)
    .where(eq(rfqsTable.id, rfqId))
    .limit(1);
  assert.equal(persistedBuyerARfq?.buyerId, buyerId);

  const buyerBRfq = await requestAsBuyerB("/rfqs", {
    method: "POST",
    body: JSON.stringify({
      ...rfqPayload,
      title: `RFQ comprador B ${Date.now()}`,
      buyerId,
    }),
  });
  assert.equal(buyerBRfq.response.status, 201);
  buyerBRfqId = numericId((buyerBRfq.body as { id: string }).id, "rfq");
  const [persistedBuyerBRfq] = await db
    .select({ buyerId: rfqsTable.buyerId })
    .from(rfqsTable)
    .where(eq(rfqsTable.id, buyerBRfqId))
    .limit(1);
  assert.equal(persistedBuyerBRfq?.buyerId, buyerBId);

  const buyerBList = await requestAsBuyerB("/rfqs");
  assert.equal(buyerBList.response.status, 200);
  assert.deepEqual(
    (buyerBList.body as Array<{ id: string }>).map(({ id }) => id),
    [`rfq-${buyerBRfqId}`],
  );

  const hiddenRfq = await requestAsBuyerB(`/rfqs/${rfq.id}`);
  assert.equal(hiddenRfq.response.status, 404);
  const hiddenProposals = await requestAsBuyerB(`/rfqs/${rfq.id}/proposals`);
  assert.equal(hiddenProposals.response.status, 404);

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

  const hiddenProposalCreation = await requestAsBuyerB(`/rfqs/${rfq.id}/proposals`, {
    method: "POST",
    body: JSON.stringify({
      supplierName: "Fornecedor indevido",
      price: 1,
      leadTime: "2030-12-10",
      moq: "1 un.",
    }),
  });
  assert.equal(hiddenProposalCreation.response.status, 404);

  const hiddenEvaluations = await requestAsBuyerB(
    `/proposals/${proposal.id}/evaluations`,
  );
  assert.equal(hiddenEvaluations.response.status, 404);

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

  const hiddenEvaluationCreation = await requestAsBuyerB(
    `/proposals/${proposal.id}/evaluations`,
    {
      method: "POST",
      body: JSON.stringify({ score: 1, comment: "Acesso indevido" }),
    },
  );
  assert.equal(hiddenEvaluationCreation.response.status, 404);

  const reloadedEvaluations = await request(
    `/proposals/${proposal.id}/evaluations`,
  );
  assert.equal(reloadedEvaluations.response.status, 200);
  assert.deepEqual(reloadedEvaluations.body, [createdEvaluation.body]);

  await assertSeedDataAvailable();
});