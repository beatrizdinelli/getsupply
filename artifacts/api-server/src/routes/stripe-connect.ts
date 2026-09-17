import { Router, type IRouter, type Request } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  proposalsTable,
  rfqsTable,
  suppliersTable,
} from "@workspace/db";
import { getClerkUserId, requireBuyer } from "../lib/require-buyer";
import { getUncachableStripeClient } from "../lib/stripe-client";
import { getClerkProxyHost } from "../middlewares/clerkProxyMiddleware";

const router: IRouter = Router();
const platformFeePercent = 10;

function publicBaseUrl(req: Request): string {
  const protocolHeader = req.headers["x-forwarded-proto"];
  const protocol = Array.isArray(protocolHeader)
    ? protocolHeader[0]
    : protocolHeader?.split(",")[0]?.trim();
  const host = getClerkProxyHost(req);
  if (!host) throw new Error("Não foi possível identificar o domínio público.");
  return `${protocol || "https"}://${host}`;
}

function positiveInteger(value: string): number | null {
  const normalized = value.replace(/\D/g, "");
  const number = Number(normalized);
  return Number.isInteger(number) && number > 0 ? number : null;
}

router.post("/suppliers/register", async (req, res): Promise<void> => {
  const clerkUserId = getClerkUserId(req);
  if (!clerkUserId) {
    res.status(401).json({ error: "Entre para cadastrar seu fornecedor." });
    return;
  }

  const companyName =
    typeof req.body?.company === "string" ? req.body.company.trim() : "";
  const cnpj = typeof req.body?.cnpj === "string" ? req.body.cnpj.trim() : "";
  const region =
    typeof req.body?.region === "string" ? req.body.region.trim() : "";
  const standardMoq = positiveInteger(String(req.body?.moq ?? ""));
  const productionCapacity =
    typeof req.body?.capacity === "string" ? req.body.capacity.trim() : null;
  if (!companyName || !cnpj || !region) {
    res.status(400).json({ error: "Empresa, CNPJ e região são obrigatórios." });
    return;
  }

  const [owned] = await db
    .select()
    .from(suppliersTable)
    .where(eq(suppliersTable.clerkUserId, clerkUserId))
    .limit(1);
  if (owned) {
    res.json({ id: `supplier-${owned.id}`, registered: true });
    return;
  }

  const [cnpjOwner] = await db
    .select({ id: suppliersTable.id, clerkUserId: suppliersTable.clerkUserId })
    .from(suppliersTable)
    .where(eq(suppliersTable.cnpj, cnpj))
    .limit(1);
  if (cnpjOwner) {
    res.status(409).json({
      error: cnpjOwner.clerkUserId
        ? "Este CNPJ já possui uma conta."
        : "Este CNPJ já está no catálogo e precisa ser validado pela GetSupply.",
    });
    return;
  }

  const [supplier] = await db
    .insert(suppliersTable)
    .values({
      clerkUserId,
      companyName,
      cnpj,
      region,
      standardMoq,
      productionCapacity,
    })
    .returning({ id: suppliersTable.id });
  res.status(201).json({ id: `supplier-${supplier.id}`, registered: true });
});

router.post(
  "/suppliers/connect/onboarding",
  async (req, res): Promise<void> => {
    const clerkUserId = getClerkUserId(req);
    if (!clerkUserId) {
      res.status(401).json({ error: "Entre para configurar os recebimentos." });
      return;
    }
    const [supplier] = await db
      .select()
      .from(suppliersTable)
      .where(eq(suppliersTable.clerkUserId, clerkUserId))
      .limit(1);
    if (!supplier) {
      res.status(404).json({ error: "Cadastre o fornecedor primeiro." });
      return;
    }

    const stripe = await getUncachableStripeClient();
    let accountId = supplier.stripeAccountId;
    if (!accountId) {
      let account;
      try {
        account = await stripe.accounts.create({
          type: "express",
          country: "BR",
          business_type: "company",
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: { supplierId: String(supplier.id) },
        });
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "";
        if (message.includes("signed up for Connect")) {
          res.status(409).json({
            error:
              "Ative o Stripe Connect na conta da GetSupply antes de cadastrar recebimentos.",
          });
          return;
        }
        throw cause;
      }
      accountId = account.id;
      await db
        .update(suppliersTable)
        .set({ stripeAccountId: account.id })
        .where(eq(suppliersTable.id, supplier.id));
    }

    const baseUrl = publicBaseUrl(req);
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/supplier/apply?stripe=refresh`,
      return_url: `${baseUrl}/supplier/apply?stripe=return`,
      type: "account_onboarding",
    });
    res.json({ url: accountLink.url });
  },
);

router.get("/suppliers/connect/status", async (req, res): Promise<void> => {
  const clerkUserId = getClerkUserId(req);
  if (!clerkUserId) {
    res.status(401).json({ error: "Entre para consultar os recebimentos." });
    return;
  }
  const [supplier] = await db
    .select()
    .from(suppliersTable)
    .where(eq(suppliersTable.clerkUserId, clerkUserId))
    .limit(1);
  if (!supplier?.stripeAccountId) {
    res.json({ connected: false, detailsSubmitted: false });
    return;
  }

  const stripe = await getUncachableStripeClient();
  const account = await stripe.accounts.retrieve(supplier.stripeAccountId);
  const connected = account.details_submitted && account.payouts_enabled;
  await db
    .update(suppliersTable)
    .set({ stripeOnboardingComplete: connected })
    .where(eq(suppliersTable.id, supplier.id));
  res.json({
    connected,
    detailsSubmitted: account.details_submitted,
  });
});

router.post(
  "/proposals/:proposalId/checkout",
  async (req, res): Promise<void> => {
    const buyerId = await requireBuyer(req, res);
    if (!buyerId) return;
    const proposalId = positiveInteger(req.params.proposalId ?? "");
    if (!proposalId) {
      res.status(400).json({ error: "Proposta inválida." });
      return;
    }

    const [record] = await db
      .select({
        proposal: proposalsTable,
        supplier: suppliersTable,
      })
      .from(proposalsTable)
      .innerJoin(rfqsTable, eq(proposalsTable.rfqId, rfqsTable.id))
      .leftJoin(
        suppliersTable,
        eq(proposalsTable.supplierId, suppliersTable.id),
      )
      .where(
        and(
          eq(proposalsTable.id, proposalId),
          eq(rfqsTable.buyerId, buyerId),
        ),
      )
      .limit(1);
    if (!record) {
      res.status(404).json({ error: "Proposta não encontrada." });
      return;
    }
    if (record.proposal.status === "aceita") {
      res.status(409).json({ error: "Esta proposta já foi paga." });
      return;
    }
    if (
      !record.supplier?.stripeAccountId ||
      !record.supplier.stripeOnboardingComplete
    ) {
      res.status(409).json({
        error: "O fornecedor ainda não habilitou recebimentos pelo Stripe.",
      });
      return;
    }

    const amount = Math.round(Number(record.proposal.price) * 100);
    if (!Number.isSafeInteger(amount) || amount < 50) {
      res.status(400).json({ error: "O valor da proposta é inválido." });
      return;
    }

    const stripe = await getUncachableStripeClient();
    let priceId = record.proposal.stripePriceId;
    if (!priceId) {
      const product = await stripe.products.create({
        name: `Proposta ${record.proposal.id} — ${record.proposal.supplierName}`,
        description: `Pagamento da proposta para a RFQ ${record.proposal.rfqId}`,
        metadata: {
          proposalId: String(record.proposal.id),
          rfqId: String(record.proposal.rfqId),
        },
      });
      const price = await stripe.prices.create({
        product: product.id,
        currency: "brl",
        unit_amount: amount,
      });
      priceId = price.id;
      await db
        .update(proposalsTable)
        .set({ stripePriceId: price.id })
        .where(eq(proposalsTable.id, record.proposal.id));
    }

    const baseUrl = publicBaseUrl(req);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/rfqs/rfq-${record.proposal.rfqId}`,
      client_reference_id: String(record.proposal.id),
      metadata: {
        proposalId: String(record.proposal.id),
        rfqId: String(record.proposal.rfqId),
        buyerId: String(buyerId),
      },
      payment_intent_data: {
        application_fee_amount: Math.round(
          amount * (platformFeePercent / 100),
        ),
        transfer_data: {
          destination: record.supplier.stripeAccountId,
        },
        metadata: {
          proposalId: String(record.proposal.id),
          rfqId: String(record.proposal.rfqId),
        },
      },
    });
    if (!session.url) {
      res.status(502).json({ error: "O Stripe não retornou o checkout." });
      return;
    }

    await db
      .update(proposalsTable)
      .set({ stripeCheckoutSessionId: session.id })
      .where(eq(proposalsTable.id, record.proposal.id));
    res.json({ url: session.url });
  },
);

export default router;