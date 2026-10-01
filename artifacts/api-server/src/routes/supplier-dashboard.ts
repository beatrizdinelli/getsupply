import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  categoriesTable,
  db,
  proposalsTable,
  rfqsTable,
  suppliersTable,
} from "@workspace/db";
import { requireSupplier } from "../lib/require-supplier";
import {
  getCategoryNamesByIds,
  getSupplierCategoryIds,
  replaceSupplierCategories,
} from "../lib/supplier-categories";

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

async function profileResponse(supplier: typeof suppliersTable.$inferSelect) {
  const categoryIds = await getSupplierCategoryIds(supplier.id);
  const categoryNames = await getCategoryNamesByIds(categoryIds);
  return {
    id: `supplier-${supplier.id}`,
    company: supplier.companyName,
    cnpj: supplier.cnpj,
    cnpjVerified: supplier.cnpjVerified,
    region: supplier.region,
    capacity: supplier.productionCapacity ?? "",
    moq: supplier.standardMoq ?? null,
    categories: categoryNames.join(", "),
    logoUrl: supplier.logoUrl ?? null,
    stripeOnboardingComplete: supplier.stripeOnboardingComplete,
  };
}

function mapProposal(row: typeof proposalsTable.$inferSelect) {
  return {
    id: `proposal-${row.id}`,
    rfqId: `rfq-${row.rfqId}`,
    price: Number(row.price),
    leadTime: row.deliveryDeadline,
    moq: row.proposedMoq,
    note: row.commercialTerms ?? "",
    status: proposalStatus[row.status],
  };
}

function mapRfq(row: {
  rfq: typeof rfqsTable.$inferSelect;
  category: string;
  proposal: typeof proposalsTable.$inferSelect | null;
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
    myProposal: row.proposal ? mapProposal(row.proposal) : null,
  };
}

router.get("/suppliers/me", async (req, res): Promise<void> => {
  const supplier = await requireSupplier(req, res);
  if (!supplier) return;
  res.json(await profileResponse(supplier));
});

router.patch("/suppliers/me", async (req, res): Promise<void> => {
  const supplier = await requireSupplier(req, res);
  if (!supplier) return;

  const updates: Partial<typeof suppliersTable.$inferInsert> = {};
  if (typeof req.body?.region === "string") {
    const region = req.body.region.trim();
    if (!region) {
      res.status(400).json({ error: "Região não pode ficar vazia." });
      return;
    }
    updates.region = region;
  }
  if (typeof req.body?.capacity === "string") {
    updates.productionCapacity = req.body.capacity.trim() || null;
  }
  if (req.body?.moq !== undefined) {
    const moq = positiveInteger(String(req.body.moq ?? ""));
    if (req.body.moq !== "" && req.body.moq !== null && !moq) {
      res.status(400).json({ error: "Pedido mínimo inválido." });
      return;
    }
    updates.standardMoq = moq;
  }

  if (Object.keys(updates).length) {
    await db
      .update(suppliersTable)
      .set(updates)
      .where(eq(suppliersTable.id, supplier.id));
  }
  if (typeof req.body?.categories === "string") {
    await replaceSupplierCategories(supplier.id, req.body.categories);
  }

  const [updated] = await db
    .select()
    .from(suppliersTable)
    .where(eq(suppliersTable.id, supplier.id))
    .limit(1);
  res.json(await profileResponse(updated));
});

router.get("/suppliers/me/rfqs", async (req, res): Promise<void> => {
  const supplier = await requireSupplier(req, res);
  if (!supplier) return;

  const categoryIds = await getSupplierCategoryIds(supplier.id);
  if (!categoryIds.length) {
    res.json([]);
    return;
  }

  const rows = await db
    .select({
      rfq: rfqsTable,
      category: categoriesTable.name,
      proposal: proposalsTable,
    })
    .from(rfqsTable)
    .innerJoin(categoriesTable, eq(rfqsTable.categoryId, categoriesTable.id))
    .leftJoin(
      proposalsTable,
      and(
        eq(proposalsTable.rfqId, rfqsTable.id),
        eq(proposalsTable.supplierId, supplier.id),
      ),
    )
    .where(inArray(rfqsTable.categoryId, categoryIds))
    .orderBy(desc(rfqsTable.createdAt));

  res.json(rows.map(mapRfq));
});

router.post(
  "/suppliers/me/rfqs/:rfqId/proposals",
  async (req, res): Promise<void> => {
    const supplier = await requireSupplier(req, res);
    if (!supplier) return;

    const rfqId = numericId(req.params.rfqId ?? "", "rfq");
    const price = Number(req.body?.price);
    const moq = positiveInteger(String(req.body?.moq ?? ""));
    const leadTime =
      typeof req.body?.leadTime === "string" ? req.body.leadTime : "";
    const note =
      typeof req.body?.note === "string" ? req.body.note.trim() || null : null;
    if (
      !rfqId ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !moq ||
      !validDate(leadTime)
    ) {
      res.status(400).json({ error: "Dados da proposta inválidos." });
      return;
    }

    const [rfq] = await db
      .select()
      .from(rfqsTable)
      .where(eq(rfqsTable.id, rfqId))
      .limit(1);
    if (!rfq) {
      res.status(404).json({ error: "Pedido não encontrado." });
      return;
    }

    const categoryIds = await getSupplierCategoryIds(supplier.id);
    if (!categoryIds.includes(rfq.categoryId)) {
      res
        .status(403)
        .json({ error: "Este pedido não está nas suas categorias." });
      return;
    }

    const [existing] = await db
      .select({ id: proposalsTable.id })
      .from(proposalsTable)
      .where(
        and(
          eq(proposalsTable.rfqId, rfqId),
          eq(proposalsTable.supplierId, supplier.id),
        ),
      )
      .limit(1);
    if (existing) {
      res
        .status(409)
        .json({ error: "Você já enviou uma proposta para este pedido." });
      return;
    }

    const proposal = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(proposalsTable)
        .values({
          rfqId,
          supplierId: supplier.id,
          supplierName: supplier.companyName,
          price: price.toFixed(2),
          deliveryDeadline: leadTime,
          proposedMoq: moq,
          commercialTerms: note,
        })
        .returning();
      await tx
        .update(rfqsTable)
        .set({ status: "proposta_recebida" })
        .where(eq(rfqsTable.id, rfqId));
      return created;
    });

    res.status(201).json(mapProposal(proposal));
  },
);

export default router;
