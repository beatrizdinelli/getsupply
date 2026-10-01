import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { eq } from "drizzle-orm";
import {
  buyersTable,
  categoriesTable,
  db,
  evaluationsTable,
  pool,
  proposalsTable,
  rfqsTable,
  supplierCategoriesTable,
  suppliersTable,
} from "@workspace/db";

let server: Server;
let baseUrl: string;

let buyerId: number;
let categoryId: number;
let supplierId: number;
let unratedSupplierId: number;
let rfqId: number;
let proposalId: number;
let evaluationId: number | undefined;

function fakeCnpj(seed: number): string {
  const digits = String(seed).padStart(12, "0").slice(-12);
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-00`;
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
      name: "Comprador teste diretório",
      email: `diretorio-${Date.now()}@teste.local`,
    })
    .returning({ id: buyersTable.id });
  buyerId = buyer.id;

  const [caixas] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.name, "Caixas"))
    .limit(1);
  assert.ok(caixas, "a categoria seed Caixas deve existir");
  categoryId = caixas.id;

  const [supplier] = await db
    .insert(suppliersTable)
    .values({
      clerkUserId: "test-supplier-diretorio",
      companyName: "Fornecedor Diretório Teste",
      cnpj: fakeCnpj(Date.now()),
      cnpjVerified: true,
      region: "São Paulo - SP",
      productionCapacity: "10 mil unidades",
      standardMoq: 200,
    })
    .returning({ id: suppliersTable.id });
  supplierId = supplier.id;
  await db
    .insert(supplierCategoriesTable)
    .values({ supplierId, categoryId });

  const [unrated] = await db
    .insert(suppliersTable)
    .values({
      clerkUserId: "test-supplier-diretorio-sem-avaliacao",
      companyName: "Fornecedor Sem Avaliação Teste",
      cnpj: fakeCnpj(Date.now() + 1),
      region: "Rio de Janeiro - RJ",
    })
    .returning({ id: suppliersTable.id });
  unratedSupplierId = unrated.id;

  const [rfq] = await db
    .insert(rfqsTable)
    .values({
      buyerId,
      categoryId,
      technicalSpecification: "RFQ de teste do diretório de fornecedores",
      quantity: 1000,
      desiredDeadline: "2030-12-01",
      deliveryRegion: "São Paulo - SP",
    })
    .returning({ id: rfqsTable.id });
  rfqId = rfq.id;

  const [proposal] = await db
    .insert(proposalsTable)
    .values({
      rfqId,
      supplierId,
      supplierName: "Fornecedor Diretório Teste",
      price: "99.90",
      deliveryDeadline: "2030-12-10",
      proposedMoq: 200,
    })
    .returning({ id: proposalsTable.id });
  proposalId = proposal.id;

  const [evaluation] = await db
    .insert(evaluationsTable)
    .values({ proposalId, score: 4 })
    .returning({ id: evaluationsTable.id });
  evaluationId = evaluation.id;
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
  if (supplierId) {
    await db
      .delete(supplierCategoriesTable)
      .where(eq(supplierCategoriesTable.supplierId, supplierId));
    await db.delete(suppliersTable).where(eq(suppliersTable.id, supplierId));
  }
  if (unratedSupplierId) {
    await db.delete(suppliersTable).where(eq(suppliersTable.id, unratedSupplierId));
  }
  if (buyerId) {
    await db.delete(buyersTable).where(eq(buyersTable.id, buyerId));
  }
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await pool.end();
});

test("GET /suppliers é público e traz categorias, verificação e avaliação", async () => {
  const response = await fetch(`${baseUrl}/suppliers`);
  assert.equal(response.status, 200);
  const body = (await response.json()) as Array<{
    id: string;
    companyName: string;
    categories: string[];
    verified: boolean;
    moq: number | null;
    rating: number;
    reviewCount: number;
  }>;

  const listed = body.find((s) => s.id === `supplier-${supplierId}`);
  assert.ok(listed, "o fornecedor de teste deve aparecer na listagem pública");
  assert.deepEqual(listed?.categories, ["Caixas"]);
  assert.equal(listed?.verified, true);
  assert.equal(listed?.moq, 200);
  assert.equal(listed?.rating, 4);
  assert.equal(listed?.reviewCount, 1);

  const unrated = body.find((s) => s.id === `supplier-${unratedSupplierId}`);
  assert.ok(unrated, "o fornecedor sem avaliação também deve aparecer");
  assert.deepEqual(unrated?.categories, []);
  assert.equal(unrated?.rating, 0);
  assert.equal(unrated?.reviewCount, 0);
});

test("GET /suppliers/:id retorna o fornecedor e 404 para inexistente", async () => {
  const result = await fetch(`${baseUrl}/suppliers/supplier-${supplierId}`);
  assert.equal(result.status, 200);
  const body = (await result.json()) as { companyName: string; region: string };
  assert.equal(body.companyName, "Fornecedor Diretório Teste");
  assert.equal(body.region, "São Paulo - SP");

  const missing = await fetch(`${baseUrl}/suppliers/supplier-999999999`);
  assert.equal(missing.status, 404);

  const invalid = await fetch(`${baseUrl}/suppliers/not-a-number`);
  assert.equal(invalid.status, 400);
});
