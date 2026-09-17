import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  categoriesTable,
  db,
  evaluationsTable,
  proposalsTable,
  rfqsTable,
} from "@workspace/db";
import {
  CreateEvaluationBody,
  CreateEvaluationParams,
  CreateEvaluationResponse,
  CreateProposalBody,
  CreateProposalParams,
  CreateProposalResponse,
  CreateRfqBody,
  CreateRfqResponse,
  GetRfqParams,
  GetRfqResponse,
  ListEvaluationsParams,
  ListEvaluationsResponse,
  ListProposalsParams,
  ListProposalsResponse,
  ListRfqsResponse,
} from "@workspace/api-zod";
import { requireBuyer } from "../lib/require-buyer";

const router: IRouter = Router();

const rfqStatus = {
  aguardando_proposta: "waiting",
  proposta_recebida: "received",
  atrasado: "delayed",
  fechado: "closed",
} as const;

const proposalStatus = {
  enviada: "sent",
  aceita: "accepted",
  recusada: "rejected",
} as const;

function numericId(value: string, prefix: string): number | null {
  const normalized = value.startsWith(`${prefix}-`)
    ? value.slice(prefix.length + 1)
    : value;
  const id = Number(normalized);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function positiveInteger(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  const number = Number(digits);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function mapRfq(row: {
  rfq: typeof rfqsTable.$inferSelect;
  category: string;
}) {
  const fallbackTitle = `${row.category} — ${row.rfq.quantity.toLocaleString("pt-BR")} unidades`;
  return {
    id: `rfq-${row.rfq.id}`,
    title:
      row.rfq.title === "Solicitação de cotação" ? fallbackTitle : row.rfq.title,
    category: row.category,
    specification: row.rfq.technicalSpecification,
    quantity: `${row.rfq.quantity.toLocaleString("pt-BR")} unidades`,
    deadline: row.rfq.desiredDeadline,
    region: row.rfq.deliveryRegion,
    createdAt: row.rfq.createdAt.toISOString(),
    status: rfqStatus[row.rfq.status],
    supplierIds: [],
  };
}

function mapProposal(row: typeof proposalsTable.$inferSelect) {
  return {
    id: `proposal-${row.id}`,
    rfqId: `rfq-${row.rfqId}`,
    supplierId: `supplier-${row.id}`,
    supplierName: row.supplierName,
    price: Number(row.price),
    leadTime: row.deliveryDeadline,
    moq: `${row.proposedMoq.toLocaleString("pt-BR")} un.`,
    note: row.commercialTerms ?? "",
    status: proposalStatus[row.status],
  };
}

function mapEvaluation(row: typeof evaluationsTable.$inferSelect) {
  return {
    id: `evaluation-${row.id}`,
    proposalId: `proposal-${row.proposalId}`,
    score: row.score,
    comment: row.comment ?? "",
    createdAt: row.createdAt.toISOString(),
  };
}

async function selectRfq(buyerId: number, id?: number) {
  const query = db
    .select({ rfq: rfqsTable, category: categoriesTable.name })
    .from(rfqsTable)
    .innerJoin(categoriesTable, eq(rfqsTable.categoryId, categoriesTable.id))
    .orderBy(desc(rfqsTable.createdAt));

  return query.where(
    id
      ? and(eq(rfqsTable.buyerId, buyerId), eq(rfqsTable.id, id))
      : eq(rfqsTable.buyerId, buyerId),
  );
}

router.post("/sessions/buyer", async (req, res): Promise<void> => {
  const buyerId = await requireBuyer(req, res);
  if (!buyerId) return;
  res.status(200).json({ authenticated: true });
});

router.get("/rfqs", async (req, res): Promise<void> => {
  const buyerId = await requireBuyer(req, res);
  if (!buyerId) return;
  const rows = await selectRfq(buyerId);
  res.json(ListRfqsResponse.parse(rows.map(mapRfq)));
});

router.post("/rfqs", async (req, res): Promise<void> => {
  const buyerId = await requireBuyer(req, res);
  if (!buyerId) return;
  const body = CreateRfqBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const quantity = positiveInteger(body.data.quantity);
  if (!quantity || !validDate(body.data.deadline)) {
    res.status(400).json({ error: "Quantidade ou prazo inválido." });
    return;
  }

  let [category] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.name, body.data.category))
    .limit(1);
  if (!category) {
    [category] = await db
      .insert(categoriesTable)
      .values({ name: body.data.category })
      .returning();
  }

  const [rfq] = await db
    .insert(rfqsTable)
    .values({
      buyerId,
      categoryId: category.id,
      title: body.data.title,
      technicalSpecification: body.data.specification,
      quantity,
      desiredDeadline: body.data.deadline,
      deliveryRegion: body.data.region,
    })
    .returning();

  res.status(201).json(CreateRfqResponse.parse(mapRfq({ rfq, category: category.name })));
});

router.get("/rfqs/:id", async (req, res): Promise<void> => {
  const buyerId = await requireBuyer(req, res);
  if (!buyerId) return;
  const params = GetRfqParams.safeParse(req.params);
  const id = params.success ? numericId(params.data.id, "rfq") : null;
  if (!id) {
    res.status(400).json({ error: "RFQ inválido." });
    return;
  }

  const [row] = await selectRfq(buyerId, id);
  if (!row) {
    res.status(404).json({ error: "RFQ não encontrado." });
    return;
  }
  res.json(GetRfqResponse.parse(mapRfq(row)));
});

router.get("/rfqs/:rfqId/proposals", async (req, res): Promise<void> => {
  const buyerId = await requireBuyer(req, res);
  if (!buyerId) return;
  const params = ListProposalsParams.safeParse(req.params);
  const rfqId = params.success ? numericId(params.data.rfqId, "rfq") : null;
  if (!rfqId) {
    res.status(400).json({ error: "RFQ inválido." });
    return;
  }
  const [ownedRfq] = await selectRfq(buyerId, rfqId);
  if (!ownedRfq) {
    res.status(404).json({ error: "RFQ não encontrado." });
    return;
  }
  const rows = await db
    .select()
    .from(proposalsTable)
    .where(eq(proposalsTable.rfqId, rfqId))
    .orderBy(desc(proposalsTable.createdAt));
  res.json(ListProposalsResponse.parse(rows.map(mapProposal)));
});

router.post("/rfqs/:rfqId/proposals", async (req, res): Promise<void> => {
  const buyerId = await requireBuyer(req, res);
  if (!buyerId) return;
  const params = CreateProposalParams.safeParse(req.params);
  const body = CreateProposalBody.safeParse(req.body);
  const rfqId = params.success ? numericId(params.data.rfqId, "rfq") : null;
  const moq = body.success ? positiveInteger(body.data.moq) : null;
  if (!rfqId || !body.success || !moq || !validDate(body.data.leadTime)) {
    res.status(400).json({ error: "Dados da proposta inválidos." });
    return;
  }

  const [rfq] = await selectRfq(buyerId, rfqId);
  if (!rfq) {
    res.status(404).json({ error: "RFQ não encontrado." });
    return;
  }

  const proposal = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(proposalsTable)
      .values({
        rfqId,
        supplierName: body.data.supplierName,
        price: body.data.price.toFixed(2),
        deliveryDeadline: body.data.leadTime,
        proposedMoq: moq,
        commercialTerms: body.data.note ?? null,
      })
      .returning();
    await tx
      .update(rfqsTable)
      .set({ status: "proposta_recebida" })
      .where(eq(rfqsTable.id, rfqId));
    return created;
  });

  res.status(201).json(CreateProposalResponse.parse(mapProposal(proposal)));
});

router.get("/proposals/:proposalId/evaluations", async (req, res): Promise<void> => {
  const buyerId = await requireBuyer(req, res);
  if (!buyerId) return;
  const params = ListEvaluationsParams.safeParse(req.params);
  const proposalId = params.success
    ? numericId(params.data.proposalId, "proposal")
    : null;
  if (!proposalId) {
    res.status(400).json({ error: "Proposta inválida." });
    return;
  }
  const [ownedProposal] = await db
    .select({ id: proposalsTable.id })
    .from(proposalsTable)
    .innerJoin(rfqsTable, eq(proposalsTable.rfqId, rfqsTable.id))
    .where(
      and(
        eq(proposalsTable.id, proposalId),
        eq(rfqsTable.buyerId, buyerId),
      ),
    )
    .limit(1);
  if (!ownedProposal) {
    res.status(404).json({ error: "Proposta não encontrada." });
    return;
  }
  const rows = await db
    .select({ evaluation: evaluationsTable })
    .from(evaluationsTable)
    .innerJoin(proposalsTable, eq(evaluationsTable.proposalId, proposalsTable.id))
    .innerJoin(rfqsTable, eq(proposalsTable.rfqId, rfqsTable.id))
    .where(
      and(
        eq(evaluationsTable.proposalId, proposalId),
        eq(rfqsTable.buyerId, buyerId),
      ),
    );
  res.json(ListEvaluationsResponse.parse(rows.map(({ evaluation }) => mapEvaluation(evaluation))));
});

router.post("/proposals/:proposalId/evaluations", async (req, res): Promise<void> => {
  const buyerId = await requireBuyer(req, res);
  if (!buyerId) return;
  const params = CreateEvaluationParams.safeParse(req.params);
  const body = CreateEvaluationBody.safeParse(req.body);
  const proposalId = params.success
    ? numericId(params.data.proposalId, "proposal")
    : null;
  if (
    !proposalId ||
    !body.success ||
    !Number.isInteger(body.data.score)
  ) {
    res.status(400).json({ error: "Avaliação inválida." });
    return;
  }

  const [proposal] = await db
    .select({ id: proposalsTable.id })
    .from(proposalsTable)
    .innerJoin(rfqsTable, eq(proposalsTable.rfqId, rfqsTable.id))
    .where(
      and(
        eq(proposalsTable.id, proposalId),
        eq(rfqsTable.buyerId, buyerId),
      ),
    );
  if (!proposal) {
    res.status(404).json({ error: "Proposta não encontrada." });
    return;
  }

  try {
    const [evaluation] = await db
      .insert(evaluationsTable)
      .values({
        proposalId,
        score: body.data.score,
        comment: body.data.comment ?? null,
      })
      .returning();
    res
      .status(201)
      .json(CreateEvaluationResponse.parse(mapEvaluation(evaluation)));
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    if (code === "23505") {
      res.status(409).json({ error: "Esta proposta já foi avaliada." });
      return;
    }
    throw error;
  }
});

export default router;