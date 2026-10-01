import type { Request, Response } from "express";
import { db, suppliersTable, type Supplier } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getClerkUserId } from "./require-buyer";

export async function requireSupplier(
  req: Request,
  res: Response,
): Promise<Supplier | null> {
  const clerkUserId = getClerkUserId(req);
  if (!clerkUserId) {
    res.status(401).json({ error: "Entre como fornecedor para continuar." });
    return null;
  }

  const [supplier] = await db
    .select()
    .from(suppliersTable)
    .where(eq(suppliersTable.clerkUserId, clerkUserId))
    .limit(1);
  if (!supplier) {
    res
      .status(404)
      .json({ error: "Cadastre-se como fornecedor para continuar." });
    return null;
  }
  return supplier;
}
