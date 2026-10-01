import { eq, inArray } from "drizzle-orm";
import { categoriesTable, db, supplierCategoriesTable } from "@workspace/db";

export function normalizeCategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export async function saveSupplierCategories(
  supplierId: number,
  requested: unknown,
): Promise<void> {
  if (typeof requested !== "string") return;
  const wanted = new Set(
    requested.split(/[,;]+/).map(normalizeCategory).filter(Boolean),
  );
  if (!wanted.size) return;
  const categories = await db.select().from(categoriesTable);
  const matches = categories
    .filter((category) => wanted.has(normalizeCategory(category.name)))
    .map((category) => ({ supplierId, categoryId: category.id }));
  if (!matches.length) return;
  await db.insert(supplierCategoriesTable).values(matches).onConflictDoNothing();
}

export async function replaceSupplierCategories(
  supplierId: number,
  requested: unknown,
): Promise<void> {
  if (typeof requested !== "string") return;
  const wanted = new Set(
    requested.split(/[,;]+/).map(normalizeCategory).filter(Boolean),
  );
  const categories = await db.select().from(categoriesTable);
  const matches = categories
    .filter((category) => wanted.has(normalizeCategory(category.name)))
    .map((category) => ({ supplierId, categoryId: category.id }));
  await db
    .delete(supplierCategoriesTable)
    .where(eq(supplierCategoriesTable.supplierId, supplierId));
  if (!matches.length) return;
  await db.insert(supplierCategoriesTable).values(matches).onConflictDoNothing();
}

export async function getSupplierCategoryIds(
  supplierId: number,
): Promise<number[]> {
  const rows = await db
    .select({ categoryId: supplierCategoriesTable.categoryId })
    .from(supplierCategoriesTable)
    .where(eq(supplierCategoriesTable.supplierId, supplierId));
  return rows.map((row) => row.categoryId);
}

export async function getCategoryNamesByIds(
  categoryIds: number[],
): Promise<string[]> {
  if (!categoryIds.length) return [];
  const rows = await db
    .select({ name: categoriesTable.name })
    .from(categoriesTable)
    .where(inArray(categoriesTable.id, categoryIds));
  return rows.map((row) => row.name);
}
