import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripe-client";

export async function initializeStripe(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (!databaseUrl || !domain) {
    throw new Error("Stripe requer DATABASE_URL e REPLIT_DOMAINS.");
  }

  await runMigrations({ databaseUrl });
  const sync = await getStripeSync();
  await sync.findOrCreateManagedWebhook(
    `https://${domain}/api/stripe/webhook`,
  );
  await sync.syncBackfill();
}