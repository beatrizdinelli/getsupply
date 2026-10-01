import Stripe from "stripe";
import { and, eq, ne } from "drizzle-orm";
import { db, proposalsTable, rfqsTable, suppliersTable } from "@workspace/db";
import { getStripeSync, stripeEnvCredentials } from "./stripe-client";

export class InvalidStripeWebhookError extends Error {}

async function confirmProposalPayment(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.payment_status !== "paid") return;
  const proposalId = Number(session.metadata?.proposalId);
  if (!Number.isInteger(proposalId) || proposalId <= 0) return;

  const [proposal] = await db
    .select({
      id: proposalsTable.id,
      rfqId: proposalsTable.rfqId,
    })
    .from(proposalsTable)
    .where(eq(proposalsTable.id, proposalId))
    .limit(1);
  if (!proposal) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await db.transaction(async (tx) => {
    await tx
      .update(proposalsTable)
      .set({
        status: "aceita",
        decisionDate: new Date(),
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: paymentIntentId ?? null,
      })
      .where(eq(proposalsTable.id, proposal.id));
    await tx
      .update(proposalsTable)
      .set({
        status: "recusada",
        decisionDate: new Date(),
        rejectionReason: "Outra proposta foi aceita e paga.",
      })
      .where(
        and(
          eq(proposalsTable.rfqId, proposal.rfqId),
          ne(proposalsTable.id, proposal.id),
        ),
      );
    await tx
      .update(rfqsTable)
      .set({ status: "fechado" })
      .where(eq(rfqsTable.id, proposal.rfqId));
  });
}

async function refreshConnectedAccount(account: Stripe.Account): Promise<void> {
  const supplierId = Number(account.metadata?.supplierId);
  if (!Number.isInteger(supplierId) || supplierId <= 0) return;
  await db
    .update(suppliersTable)
    .set({
      stripeAccountId: account.id,
      stripeOnboardingComplete:
        account.details_submitted && account.payouts_enabled,
    })
    .where(eq(suppliersTable.id, supplierId));
}

export async function processStripeWebhook(
  payload: Buffer,
  signature: string,
): Promise<void> {
  if (!Buffer.isBuffer(payload)) {
    throw new Error("O webhook Stripe precisa receber o corpo bruto.");
  }

  let event: Stripe.Event;
  const envCredentials = stripeEnvCredentials();
  if (envCredentials) {
    if (!envCredentials.webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET não está configurada.");
    }
    try {
      event = Stripe.webhooks.constructEvent(
        payload,
        signature,
        envCredentials.webhookSecret,
      );
    } catch (cause) {
      throw new InvalidStripeWebhookError(
        cause instanceof Error ? cause.message : "Assinatura Stripe inválida.",
      );
    }
  } else {
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
    event = JSON.parse(payload.toString("utf8")) as Stripe.Event;
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    await confirmProposalPayment(event.data.object);
  } else if (event.type === "account.updated") {
    await refreshConnectedAccount(event.data.object);
  }
}