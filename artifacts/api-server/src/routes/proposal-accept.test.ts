import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { eq, inArray } from "drizzle-orm";
import {
  buyersTable,
  categoriesTable,
  db,
  pool,
  proposalsTable,
  rfqsTable,
} from "@workspace/db";

const buyerClerkId = `accept-buyer-${Date.now()}`;
let server: Server;
let baseUrl: string;
let buyerId: number | undefined;
let rfqId: number | undefined;
let proposalIds: number[] = [];

before(async () => {
  process.env.NODE_ENV = "test";
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.REPLIT_CONNECTORS_HOSTNAME;
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
  if (proposalIds.length) {
    await db.delete(proposalsTable).where(inArray(proposalsTable.id, proposalIds));
  }
  if (rfqId) await db.delete(rfqsTable).where(eq(rfqsTable.id, rfqId));
  if (buyerId) await db.delete(buyersTable).where(eq(buyersTable.id, buyerId));
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await pool.end();
});

function accept(proposalId: number, clerkUserId = buyerClerkId) {
  return fetch(`${baseUrl}/proposals/proposal-${proposalId}/accept`, {
    method: "POST",
    headers: { "x-test-clerk-user-id": clerkUserId },
  });
}

test("sem Stripe, o comprador aceita uma proposta e a RFQ é fechada", async () => {
  [{ id: buyerId }] = await db
    .insert(buyersTable)
    .values({
      clerkUserId: buyerClerkId,
      name: "Comprador aceite",
      email: `${buyerClerkId}@test.local`,
    })
    .returning({ id: buyersTable.id });
  const [category] = await db.select().from(categoriesTable).limit(1);
  assert.ok(category, "precisa de ao menos uma categoria seed");
  [{ id: rfqId }] = await db
    .insert(rfqsTable)
    .values({
      buyerId: buyerId!,
      categoryId: category.id,
      technicalSpecification: "Teste aceite",
      quantity: 100,
      desiredDeadline: "2030-12-01",
      deliveryRegion: "Sudeste",
      status: "proposta_recebida",
    })
    .returning({ id: rfqsTable.id });
  proposalIds = (
    await db
      .insert(proposalsTable)
      .values(
        ["Escolhido", "Outro"].map((name) => ({
          rfqId: rfqId!,
          supplierName: `Fornecedor ${name}`,
          price: "100.00",
          deliveryDeadline: "2030-11-01",
          proposedMoq: 100,
        })),
      )
      .returning({ id: proposalsTable.id })
  ).map(({ id }) => id);
  const [chosen, other] = proposalIds;

  assert.equal((await accept(chosen, "outro-comprador-aceite")).status, 404);

  process.env.STRIPE_SECRET_KEY = "sk_test_configurado";
  try {
    assert.equal((await accept(chosen)).status, 409, "com Stripe exige checkout");
  } finally {
    delete process.env.STRIPE_SECRET_KEY;
  }

  const accepted = await accept(chosen);
  assert.equal(accepted.status, 200);
  assert.equal(((await accepted.json()) as { status: string }).status, "accepted");

  const rows = await db
    .select({ id: proposalsTable.id, status: proposalsTable.status })
    .from(proposalsTable)
    .where(inArray(proposalsTable.id, proposalIds));
  const status = Object.fromEntries(rows.map((row) => [row.id, row.status]));
  assert.equal(status[chosen], "aceita");
  assert.equal(status[other], "recusada");
  const [rfq] = await db
    .select({ status: rfqsTable.status })
    .from(rfqsTable)
    .where(eq(rfqsTable.id, rfqId!));
  assert.equal(rfq?.status, "fechado");

  assert.equal((await accept(other)).status, 409, "a RFQ já tem proposta aceita");
  assert.equal((await accept(chosen)).status, 409);
});
