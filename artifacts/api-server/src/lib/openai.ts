import OpenAI from "openai";
import { logger } from "./logger";

let client: OpenAI | null | undefined;

export function getOpenAiClient(): OpenAI | null {
  if (client !== undefined) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.warn("OPENAI_API_KEY não configurada, chatbot desativado");
    client = null;
    return client;
  }

  client = new OpenAI({ apiKey });
  return client;
}