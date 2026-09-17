import { getAuth } from "@clerk/express";
import type { Request, Response } from "express";
import { buyersTable, db } from "@workspace/db";
import { eq } from "drizzle-orm";

export function getClerkUserId(req: Request): string | null {
  if (process.env.NODE_ENV === "test") {
    const testUserId = req.headers["x-test-clerk-user-id"];
    if (typeof testUserId === "string" && testUserId) return testUserId;
  }
  const auth = getAuth(req);
  return (
    (auth.sessionClaims?.userId as string | undefined) ??
    auth.userId ??
    null
  );
}

export async function requireBuyer(
  req: Request,
  res: Response,
): Promise<number | null> {
  const clerkUserId = getClerkUserId(req);

  if (!clerkUserId) {
    res.status(401).json({ error: "Entre como comprador para continuar." });
    return null;
  }

  const [existing] = await db
    .select({ id: buyersTable.id })
    .from(buyersTable)
    .where(eq(buyersTable.clerkUserId, clerkUserId))
    .limit(1);
  if (existing) return existing.id;

  const [created] = await db
    .insert(buyersTable)
    .values({
      clerkUserId,
      name: "Comprador GetSupply",
      email: `clerk-${clerkUserId}@users.getsupply.local`,
    })
    .onConflictDoNothing({ target: buyersTable.clerkUserId })
    .returning({ id: buyersTable.id });
  if (created) return created.id;

  const [concurrent] = await db
    .select({ id: buyersTable.id })
    .from(buyersTable)
    .where(eq(buyersTable.clerkUserId, clerkUserId))
    .limit(1);
  if (concurrent) return concurrent.id;

  res.status(500).json({ error: "Não foi possível preparar a conta." });
  return null;
}