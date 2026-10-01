import { Router, type IRouter } from "express";
import { avg, count, desc, eq, inArray } from "drizzle-orm";
import {
  categoriesTable,
  db,
  evaluationsTable,
  proposalsTable,
  suppliersTable,
  supplierCategoriesTable,
} from "@workspace/db";
import { GetSupplierParams, ListSuppliersResponse, GetSupplierResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function numericId(value: string, prefix: string): number | null {
  const normalized = value.startsWith(`${prefix}-`)
    ? value.slice(prefix.length + 1)
    : value;
  const id = Number(normalized);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function categoriesBySupplier(
  supplierIds: number[],
): Promise<Map<number, string[]>> {
  if (!supplierIds.length) return new Map();
  const rows = await db
    .select({
      supplierId: supplierCategoriesTable.supplierId,
      name: categoriesTable.name,
    })
    .from(supplierCategoriesTable)
    .innerJoin(
      categoriesTable,
      eq(supplierCategoriesTable.categoryId, categoriesTable.id),
    )
    .where(inArray(supplierCategoriesTable.supplierId, supplierIds));
  const map = new Map<number, string[]>();
  for (const row of rows) {
    const list = map.get(row.supplierId) ?? [];
    list.push(row.name);
    map.set(row.supplierId, list);
  }
  return map;
}

async function ratingsBySupplier(
  supplierIds: number[],
): Promise<Map<number, { rating: number; reviewCount: number }>> {
  if (!supplierIds.length) return new Map();
  const rows = await db
    .select({
      supplierId: proposalsTable.supplierId,
      avgScore: avg(evaluationsTable.score),
      reviewCount: count(evaluationsTable.id),
    })
    .from(evaluationsTable)
    .innerJoin(proposalsTable, eq(evaluationsTable.proposalId, proposalsTable.id))
    .where(inArray(proposalsTable.supplierId, supplierIds))
    .groupBy(proposalsTable.supplierId);
  const map = new Map<number, { rating: number; reviewCount: number }>();
  for (const row of rows) {
    if (row.supplierId == null) continue;
    map.set(row.supplierId, {
      rating: row.avgScore ? Number(row.avgScore) : 0,
      reviewCount: row.reviewCount,
    });
  }
  return map;
}

function mapSupplier(
  row: typeof suppliersTable.$inferSelect,
  categories: string[],
  rating: { rating: number; reviewCount: number } | undefined,
) {
  return {
    id: `supplier-${row.id}`,
    companyName: row.companyName,
    cnpj: row.cnpj,
    region: row.region,
    categories,
    moq: row.standardMoq ?? null,
    capacity: row.productionCapacity ?? null,
    logoUrl: row.logoUrl ?? null,
    verified: row.cnpjVerified,
    rating: rating?.rating ?? 0,
    reviewCount: rating?.reviewCount ?? 0,
  };
}

router.get("/suppliers", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(suppliersTable)
    .orderBy(desc(suppliersTable.createdAt));
  const ids = rows.map((row) => row.id);
  const [categories, ratings] = await Promise.all([
    categoriesBySupplier(ids),
    ratingsBySupplier(ids),
  ]);
  res.json(
    ListSuppliersResponse.parse(
      rows.map((row) =>
        mapSupplier(row, categories.get(row.id) ?? [], ratings.get(row.id)),
      ),
    ),
  );
});

router.get("/suppliers/:id", async (req, res): Promise<void> => {
  const params = GetSupplierParams.safeParse(req.params);
  const id = params.success ? numericId(params.data.id, "supplier") : null;
  if (!id) {
    res.status(400).json({ error: "Fornecedor inválido." });
    return;
  }

  const [row] = await db
    .select()
    .from(suppliersTable)
    .where(eq(suppliersTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Fornecedor não encontrado." });
    return;
  }

  const [categories, ratings] = await Promise.all([
    categoriesBySupplier([id]),
    ratingsBySupplier([id]),
  ]);
  res.json(
    GetSupplierResponse.parse(
      mapSupplier(row, categories.get(id) ?? [], ratings.get(id)),
    ),
  );
});

export default router;
