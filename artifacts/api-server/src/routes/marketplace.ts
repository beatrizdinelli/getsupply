import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  categoriesTable,
  db,
  evaluationsTable,
  proposalsTable,
  rfqsTable,
  suppliersTable,
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

// Limite da coluna INTEGER do Postgres.
const MAX_INTEGER = 2_147_483_647;

function positiveInteger(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  const number = Number(digits);
  return Number.isInteger(number) && number > 0 && number <= MAX_INTEGER
    ? number
    : null;
}

// Lê uma quantidade digitada em formato brasileiro ("1.200 unidades",
// "2500 un."). O ponto é separador de milhar; vírgula indica fração, que
// não faz sentido para unidades, então "1,5" é rejeitado em vez de virar 15.
function unitQuantity(value: string): number | null {
  const tokens = value.match(/\d[\d.,]*/g);
  if (!tokens || tokens.length !== 1) return null;
  const token = tokens[0].replace(/[.,]$/, "");
  if (!/^(\d{1,3}(\.\d{3})+|\d+)$/.test(token)) return null;
  const number = Number(token.replace(/\./g, ""));
  return number > 0 && number <= MAX_INTEGER ? number : null;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  // Date.parse aceita datas inexistentes como 2030-02-31; o Postgres não.
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Tamanhos das colunas varchar em lib/db/src/schema.
const rfqFieldLimits = {
  title: { max: 200, label: "Nome do projeto" },
  category: { max: 80, label: "Categoria" },
  region: { max: 120, label: "Região de entrega" },
} as const;

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
    supplierId: `supplier-${row.supplierId ?? row.id}`,
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
    res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    return;
  }

  for (const [field, { max, label }] of Object.entries(rfqFieldLimits)) {
    if (body.data[field as keyof typeof rfqFieldLimits].length > max) {
      res
        .status(400)
        .json({ error: `${label} deve ter no máximo ${max} caracteres.` });
      return;
    }
  }

  const quantity = unitQuantity(body.data.quantity);
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
  const moq = body.success ? unitQuantity(body.data.moq) : null;
  const supplierId = body.success
    ? positiveInteger(body.data.supplierId ?? "")
    : null;
  if (
    !rfqId ||
    !body.success ||
    !supplierId ||
    !moq ||
    !validDate(body.data.leadTime)
  ) {
    res.status(400).json({ error: "Dados da proposta inválidos." });
    return;
  }

  const [rfq] = await selectRfq(buyerId, rfqId);
  if (!rfq) {
    res.status(404).json({ error: "RFQ não encontrado." });
    return;
  }
  const [supplier] = await db
    .select({
      id: suppliersTable.id,
      companyName: suppliersTable.companyName,
    })
    .from(suppliersTable)
    .where(eq(suppliersTable.id, supplierId))
    .limit(1);
  if (!supplier) {
    res.status(404).json({ error: "Fornecedor não encontrado." });
    return;
  }

  const proposal = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(proposalsTable)
      .values({
        rfqId,
        supplierId: supplier.id,
        supplierName: supplier.companyName,
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

router.post("/proposals/:proposalId/reject", async (req, res): Promise<void> => {
  const buyerId = await requireBuyer(req, res);
  if (!buyerId) return;
  const proposalId = numericId(req.params.proposalId ?? "", "proposal");
  if (!proposalId) {
    res.status(400).json({ error: "Proposta inválida." });
    return;
  }
  const reason =
    typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  if (reason.length > 500) {
    res
      .status(400)
      .json({ error: "O motivo deve ter no máximo 500 caracteres." });
    return;
  }

  const [owned] = await db
    .select({ proposal: proposalsTable })
    .from(proposalsTable)
    .innerJoin(rfqsTable, eq(proposalsTable.rfqId, rfqsTable.id))
    .where(and(eq(proposalsTable.id, proposalId), eq(rfqsTable.buyerId, buyerId)))
    .limit(1);
  if (!owned) {
    res.status(404).json({ error: "Proposta não encontrada." });
    return;
  }

  // Só recusa o que ainda está em aberto; a condição no UPDATE evita
  // sobrescrever uma proposta paga entre a leitura e a escrita.
  const [rejected] = await db
    .update(proposalsTable)
    .set({
      status: "recusada",
      decisionDate: new Date(),
      rejectionReason: reason || null,
    })
    .where(and(eq(proposalsTable.id, proposalId), eq(proposalsTable.status, "enviada")))
    .returning();
  if (!rejected) {
    res.status(409).json({
      error:
        owned.proposal.status === "aceita"
          ? "Esta proposta já foi paga."
          : "Esta proposta já foi recusada.",
    });
    return;
  }
  res.json(mapProposal(rejected));
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