import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";
import { pool } from "@workspace/db";

type StripeCredentials = {
  secretKey: string;
  webhookSecret?: string;
};

async function getStripeCredentials(): Promise<StripeCredentials> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const token = process.env.REPL_IDENTITY
    ? `repl ${process.env.REPL_IDENTITY}`
    : process.env.WEB_REPL_RENEWAL
      ? `depl ${process.env.WEB_REPL_RENEWAL}`
      : null;

  if (!hostname || !token) {
    throw new Error("A integração Stripe não está disponível neste ambiente.");
  }

  const response = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: token,
      },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Falha ao acessar a integração Stripe: ${response.status}.`,
    );
  }

  const data = (await response.json()) as {
    items?: Array<{
      settings?: {
        secret?: string;
        publishable?: string;
        secret_key?: string;
        webhook_secret?: string;
      };
    }>;
  };
  const settings = data.items?.[0]?.settings;
  const secretKey = settings?.secret ?? settings?.secret_key;
  if (!secretKey) {
    throw new Error("A integração Stripe não possui uma credencial válida.");
  }

  return {
    secretKey,
    webhookSecret: settings?.webhook_secret,
  };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL é obrigatória para sincronizar o Stripe.");
  }
  const { secretKey, webhookSecret } = await getStripeCredentials();
  let managedWebhookSecret = webhookSecret;
  if (!managedWebhookSecret) {
    try {
      const result = await pool.query<{ secret: string }>(
        `select secret
           from stripe._managed_webhooks
          where enabled = true and secret is not null
          order by updated_at desc
          limit 1`,
      );
      managedWebhookSecret = result.rows[0]?.secret;
    } catch {
      // The table does not exist until runMigrations executes on first startup.
    }
  }
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: managedWebhookSecret ?? "",
  });
}