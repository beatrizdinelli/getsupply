import express, {
  type ErrorRequestHandler,
  type Express,
} from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import { eq } from "drizzle-orm";
import pinoHttp from "pino-http";
import { db, suppliersTable } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import { requireSupplier } from "./lib/require-supplier";
import { uploadSupplierLogo } from "./lib/supplier-logo";
import { processStripeWebhook } from "./lib/stripe-webhooks";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ credentials: true, origin: true }));
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res): Promise<void> => {
    const signature = req.headers["stripe-signature"];
    const normalizedSignature = Array.isArray(signature)
      ? signature[0]
      : signature;
    if (!normalizedSignature) {
      res.status(400).json({ error: "Assinatura Stripe ausente." });
      return;
    }
    await processStripeWebhook(req.body as Buffer, normalizedSignature);
    res.status(200).json({ received: true });
  },
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const isReplit = Boolean(process.env.REPL_ID || process.env.REPLIT_DOMAINS);
app.use(
  isReplit
    ? clerkMiddleware((req) => ({
        publishableKey: publishableKeyFromHost(
          getClerkProxyHost(req) ?? "",
          process.env.CLERK_PUBLISHABLE_KEY,
        ),
      }))
    : clerkMiddleware(),
);

app.post(
  "/api/suppliers/me/logo",
  express.raw({
    type: ["image/png", "image/jpeg", "image/webp"],
    limit: "4mb",
  }),
  async (req, res): Promise<void> => {
    const supplier = await requireSupplier(req, res);
    if (!supplier) return;
    if (!Buffer.isBuffer(req.body) || !req.body.length) {
      res.status(400).json({ error: "Envie uma imagem válida (PNG, JPEG ou WebP)." });
      return;
    }
    const contentType = req.headers["content-type"] ?? "image/jpeg";
    const logoUrl = await uploadSupplierLogo(supplier.id, req.body, contentType);
    await db
      .update(suppliersTable)
      .set({ logoUrl })
      .where(eq(suppliersTable.id, supplier.id));
    res.json({ logoUrl });
  },
);

app.use("/api", router);

// Sem isto o Express responde 500 com uma página HTML e o front não
// consegue ler o erro; aqui registramos a causa e devolvemos JSON.
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  req.log.error({ err }, "erro não tratado");
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(500).json({ error: "Erro interno. Tente novamente." });
};
app.use(errorHandler);

export default app;
