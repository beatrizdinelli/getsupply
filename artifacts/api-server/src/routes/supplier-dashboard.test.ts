import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { eq } from "drizzle-orm";
import {
  buyersTable,
  categoriesTable,
  db,
  pool,
  proposalsTable,
  rfqsTable,
  supplierCategoriesTable,
  suppliersTable,
} from "@workspace/db";

let server: Server;
let baseUrl: string;

let buyerId: number;
let categoryCaixasId: number;
let categoryRotulosId: number;
let supplierCaixasId: number;
let supplierRotulosId: number;
let rfqCaixasId: number;
let rfqRotulosId: number;
let proposalId: number | undefined;

function fakeCnpj(seed: number): string {
  const digits = String(seed).padStart(12, "0").slice(-12);
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-00`;
}

async function requestAs(
  clerkUserId: string,
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; body: unknown }> {
  const headers = new Headers(init.headers);
  headers.set("x-test-clerk-user-id", clerkUserId);
  if (init.body) headers.set("content-type", "application/json");
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  return { response, body: await response.json() };
}

before(async () => {
  process.env.NODE_ENV = "test";
  const { default: app } = await import("../app");
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const address = server.address();
  assert(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}/api`;

  const [buyer] = await db
    .insert(buyersTable)
    .values({
      name: "Comprador teste painel",
      email: `painel-${Date.now()}@teste.local`,
    })
    .returning({ id: buyersTable.id });
  buyerId = buyer.id;

  const [caixas] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.name, "Caixas"))
    .limit(1);
  const [rotulos] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.name, "Rótulos"))
    .limit(1);
  assert.ok(caixas && rotulos, "as categorias seed Caixas e Rótulos devem existir");
  categoryCaixasId = caixas.id;
  categoryRotulosId = rotulos.id;

  const [supplierA] = await db
    .insert(suppliersTable)
    .values({
      clerkUserId: "test-supplier-caixas",
      companyName: "Fornecedor de Caixas Teste",
      cnpj: fakeCnpj(Date.now()),
      region: "São Paulo - SP",
    })
    .returning({ id: suppliersTable.id });
  supplierCaixasId = supplierA.id;
  await db
    .insert(supplierCategoriesTable)
    .values({ supplierId: supplierCaixasId, categoryId: categoryCaixasId });

  const [supplierB] = await db
    .insert(suppliersTable)
    .values({
      clerkUserId: "test-supplier-rotulos",
      companyName: "Fornecedor de Rótulos Teste",
      cnpj: fakeCnpj(Date.now() + 1),
      region: "São Paulo - SP",
    })
    .returning({ id: suppliersTable.id });
  supplierRotulosId = supplierB.id;
  await db
    .insert(supplierCategoriesTable)
    .values({ supplierId: supplierRotulosId, categoryId: categoryRotulosId });

  const [rfqCaixas] = await db
    .insert(rfqsTable)
    .values({
      buyerId,
      categoryId: categoryCaixasId,
      technicalSpecification: "Caixa de teste do painel do fornecedor",
      quantity: 1000,
      desiredDeadline: "2030-12-01",
      deliveryRegion: "São Paulo - SP",
    })
    .returning({ id: rfqsTable.id });
  rfqCaixasId = rfqCaixas.id;

  const [rfqRotulos] = await db
    .insert(rfqsTable)
    .values({
      buyerId,
      categoryId: categoryRotulosId,
      technicalSpecification: "Rótulo de teste do painel do fornecedor",
      quantity: 5000,
      desiredDeadline: "2030-12-01",
      deliveryRegion: "São Paulo - SP",
    })
    .returning({ id: rfqsTable.id });
  rfqRotulosId = rfqRotulos.id;
});

after(async () => {
  if (proposalId) {
    await db.delete(proposalsTable).where(eq(proposalsTable.id, proposalId));
  }
  if (rfqCaixasId) {
    await db.delete(rfqsTable).where(eq(rfqsTable.id, rfqCaixasId));
  }
  if (rfqRotulosId) {
    await db.delete(rfqsTable).where(eq(rfqsTable.id, rfqRotulosId));
  }
  if (supplierCaixasId) {
    await db
      .delete(supplierCategoriesTable)
      .where(eq(supplierCategoriesTable.supplierId, supplierCaixasId));
    await db.delete(suppliersTable).where(eq(suppliersTable.id, supplierCaixasId));
  }
  if (supplierRotulosId) {
    await db
      .delete(supplierCategoriesTable)
      .where(eq(supplierCategoriesTable.supplierId, supplierRotulosId));
    await db.delete(suppliersTable).where(eq(suppliersTable.id, supplierRotulosId));
  }
  if (buyerId) {
    await db.delete(buyersTable).where(eq(buyersTable.id, buyerId));
  }
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await pool.end();
});

test("GET /suppliers/me exige sessão e cadastro de fornecedor", async () => {
  const anon = await fetch(`${baseUrl}/suppliers/me`);
  assert.equal(anon.status, 401);

  const notRegistered = await requestAs(
    "test-supplier-unregistered",
    "/suppliers/me",
  );
  assert.equal(notRegistered.response.status, 404);
});

test("GET /suppliers/me retorna o perfil com categorias", async () => {
  const result = await requestAs("test-supplier-caixas", "/suppliers/me");
  assert.equal(result.response.status, 200);
  const body = result.body as { company: string; categories: string };
  assert.equal(body.company, "Fornecedor de Caixas Teste");
  assert.equal(body.categories, "Caixas");
});

test("PATCH /suppliers/me atualiza região, capacidade, MOQ e categorias", async () => {
  const result = await requestAs("test-supplier-caixas", "/suppliers/me", {
    method: "PATCH",
    body: JSON.stringify({
      region: "Rio de Janeiro - RJ",
      capacity: "10 mil unidades",
      moq: "500",
      categories: "Caixas, Sacos",
    }),
  });
  assert.equal(result.response.status, 200);
  const body = result.body as {
    region: string;
    capacity: string;
    moq: number;
    categories: string;
  };
  assert.equal(body.region, "Rio de Janeiro - RJ");
  assert.equal(body.capacity, "10 mil unidades");
  assert.equal(body.moq, 500);
  assert.deepEqual(body.categories.split(", ").sort(), ["Caixas", "Sacos"]);

  const revert = await requestAs("test-supplier-caixas", "/suppliers/me", {
    method: "PATCH",
    body: JSON.stringify({ categories: "Caixas" }),
  });
  assert.equal(revert.response.status, 200);
});

test("GET /suppliers/me/rfqs só retorna pedidos da categoria do fornecedor", async () => {
  const caixasInbox = await requestAs("test-supplier-caixas", "/suppliers/me/rfqs");
  assert.equal(caixasInbox.response.status, 200);
  const caixasIds = (caixasInbox.body as Array<{ id: string }>).map((r) => r.id);
  assert.ok(caixasIds.includes(`rfq-${rfqCaixasId}`));
  assert.ok(!caixasIds.includes(`rfq-${rfqRotulosId}`));

  const rotulosInbox = await requestAs(
    "test-supplier-rotulos",
    "/suppliers/me/rfqs",
  );
  assert.equal(rotulosInbox.response.status, 200);
  const rotulosIds = (rotulosInbox.body as Array<{ id: string }>).map(
    (r) => r.id,
  );
  assert.ok(rotulosIds.includes(`rfq-${rfqRotulosId}`));
  assert.ok(!rotulosIds.includes(`rfq-${rfqCaixasId}`));
});

test("POST proposals rejeita categoria diferente, aceita a correta e bloqueia duplicata", async () => {
  const mismatch = await requestAs(
    "test-supplier-rotulos",
    `/suppliers/me/rfqs/rfq-${rfqCaixasId}/proposals`,
    {
      method: "POST",
      body: JSON.stringify({ price: 10, leadTime: "2030-12-15", moq: "100" }),
    },
  );
  assert.equal(mismatch.response.status, 403);

  const created = await requestAs(
    "test-supplier-caixas",
    `/suppliers/me/rfqs/rfq-${rfqCaixasId}/proposals`,
    {
      method: "POST",
      body: JSON.stringify({
        price: 12.5,
        leadTime: "2030-12-15",
        moq: "200",
        note: "Entrega inclusa",
      }),
    },
  );
  assert.equal(created.response.status, 201);
  const proposal = created.body as { id: string; status: string };
  proposalId = Number(proposal.id.replace("proposal-", ""));
  assert.equal(proposal.status, "sent");

  const duplicate = await requestAs(
    "test-supplier-caixas",
    `/suppliers/me/rfqs/rfq-${rfqCaixasId}/proposals`,
    {
      method: "POST",
      body: JSON.stringify({ price: 15, leadTime: "2030-12-20", moq: "300" }),
    },
  );
  assert.equal(duplicate.response.status, 409);

  const inboxAfter = await requestAs("test-supplier-caixas", "/suppliers/me/rfqs");
  const rfqEntry = (
    inboxAfter.body as Array<{ id: string; myProposal: { id: string } | null }>
  ).find((r) => r.id === `rfq-${rfqCaixasId}`);
  assert.equal(rfqEntry?.myProposal?.id, proposal.id);
});
