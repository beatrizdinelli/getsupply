import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { Server } from "node:http";
import { eq, inArray } from "drizzle-orm";
import Stripe from "stripe";
import {
  buyersTable,
  categoriesTable,
  db,
  pool,
  proposalsTable,
  rfqsTable,
} from "@workspace/db";

const webhookSecret = "whsec_test_getsupply";
let server: Server;
let baseUrl: string;
let buyerId: number | undefined;
let rfqId: number | undefined;
let proposalIds: number[] = [];

before(async () => {
  process.env.NODE_ENV = "test";
  process.env.STRIPE_SECRET_KEY = "sk_test_getsupply";
  process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
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
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  await pool.end();
});

function postWebhook(payload: string, signature: string) {
  return fetch(`${baseUrl}/stripe/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": signature },
    body: payload,
  });
}

test("webhook com chaves de ambiente confirma o pagamento e recusa as demais propostas", async () => {
  [{ id: buyerId }] = await db
    .insert(buyersTable)
    .values({ name: "Comprador webhook", email: `webhook-${Date.now()}@test.local` })
    .returning({ id: buyersTable.id });
  const [category] = await db.select().from(categoriesTable).limit(1);
  assert.ok(category, "precisa de ao menos uma categoria seed");
  [{ id: rfqId }] = await db
    .insert(rfqsTable)
    .values({
      buyerId: buyerId!,
      categoryId: category.id,
      technicalSpecification: "Teste webhook",
      quantity: 100,
      desiredDeadline: "2030-12-01",
      deliveryRegion: "Sudeste",
    })
    .returning({ id: rfqsTable.id });
  const proposals = await db
    .insert(proposalsTable)
    .values(
      ["Pago", "Outro"].map((name) => ({
        rfqId: rfqId!,
        supplierName: `Fornecedor ${name}`,
        price: "100.00",
        deliveryDeadline: "2030-11-01",
        proposedMoq: 100,
      })),
    )
    .returning({ id: proposalsTable.id });
  proposalIds = proposals.map(({ id }) => id);
  const [paid, other] = proposalIds;

  const payload = JSON.stringify({
    id: "evt_test",
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${Date.now()}`,
        object: "checkout.session",
        payment_status: "paid",
        payment_intent: "pi_test",
        metadata: { proposalId: String(paid), rfqId: String(rfqId) },
      },
    },
  });

  const forged = await postWebhook(payload, "t=1,v1=assinatura-falsa");
  assert.equal(forged.status, 400);
  const [untouched] = await db
    .select({ status: proposalsTable.status })
    .from(proposalsTable)
    .where(eq(proposalsTable.id, paid));
  assert.equal(untouched?.status, "enviada");

  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
  const accepted = await postWebhook(payload, signature);
  assert.equal(accepted.status, 200);

  const rows = await db
    .select({ id: proposalsTable.id, status: proposalsTable.status })
    .from(proposalsTable)
    .where(inArray(proposalsTable.id, proposalIds));
  const status = Object.fromEntries(rows.map((row) => [row.id, row.status]));
  assert.equal(status[paid], "aceita");
  assert.equal(status[other], "recusada");
  const [rfq] = await db
    .select({ status: rfqsTable.status })
    .from(rfqsTable)
    .where(eq(rfqsTable.id, rfqId!));
  assert.equal(rfq?.status, "fechado");
});
