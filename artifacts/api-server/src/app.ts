import express, { type Express } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
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

app.use("/api", router);

export default app;
