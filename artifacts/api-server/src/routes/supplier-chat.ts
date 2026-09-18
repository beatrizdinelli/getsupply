import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, ilike, lte } from "drizzle-orm";
import {
  categoriesTable,
  db,
  supplierCategoriesTable,
  suppliersTable,
} from "@workspace/db";
import {
  ChatSupplierBody,
  ChatSupplierResponse,
} from "@workspace/api-zod";
import type OpenAI from "openai";
import { getOpenAiClient } from "../lib/openai";
import { requireBuyer } from "../lib/require-buyer";

const router: IRouter = Router();

type SearchArgs = {
  categoria: string;
  regiao?: string;
  moq_max?: number;
};

function parseSearchArgs(raw: string): SearchArgs | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const input = value as Record<string, unknown>;
    if (typeof input.categoria !== "string" || !input.categoria.trim()) {
      return null;
    }
    return {
      categoria: input.categoria.trim(),
      regiao:
        typeof input.regiao === "string" && input.regiao.trim()
          ? input.regiao.trim()
          : undefined,
      moq_max:
        typeof input.moq_max === "number" &&
        Number.isInteger(input.moq_max) &&
        input.moq_max > 0
          ? input.moq_max
          : undefined,
    };
  } catch {
    return null;
  }
}

async function searchVerifiedSuppliers(input: SearchArgs) {
  const filters = [
    eq(suppliersTable.cnpjVerified, true),
    ilike(categoriesTable.name, `%${input.categoria}%`),
  ];
  if (input.regiao) {
    filters.push(ilike(suppliersTable.region, `%${input.regiao}%`));
  }
  if (input.moq_max) {
    filters.push(lte(suppliersTable.standardMoq, input.moq_max));
  }

  const rows = await db
    .select({
      id: suppliersTable.id,
      name: suppliersTable.companyName,
      region: suppliersTable.region,
      standardMoq: suppliersTable.standardMoq,
      category: categoriesTable.name,
    })
    .from(suppliersTable)
    .innerJoin(
      supplierCategoriesTable,
      eq(supplierCategoriesTable.supplierId, suppliersTable.id),
    )
    .innerJoin(
      categoriesTable,
      eq(supplierCategoriesTable.categoryId, categoriesTable.id),
    )
    .where(and(...filters))
    .limit(3);

  return rows.map((row) => ({
    id: `supplier-${row.id}`,
    name: row.name,
    region: row.region,
    standardMoq: row.standardMoq ?? 0,
    category: row.category,
    verified: true as const,
  }));
}

const systemPrompt = `Você é o Assistente GetSupply. Ajude compradores iniciantes a encontrar fornecedores de embalagem para explorar.

Regras invioláveis:
- Pergunte antes de buscar se categoria, região desejada ou quantidade aproximada estiverem ausentes.
- Use buscar_fornecedores somente quando houver informações suficientes.
- Nunca sugira fornecedor não verificado e nunca tente contornar esse filtro.
- Sugira no máximo três candidatos e descreva fatos; não decida pelo comprador.
- Nunca crie RFQ, envie proposta, negocie ou feche negócio.
- Se a busca não tiver resultados, diga isso claramente e sugira criar uma RFQ aberta.
- Responda em português, de forma curta e acolhedora.`;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "buscar_fornecedores",
      description:
        "Busca fornecedores de embalagem com CNPJ verificado na base GetSupply.",
      strict: true,
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          categoria: {
            type: "string",
            description: "Categoria: Rótulos, Potes, Caixas ou Sacos.",
          },
          regiao: {
            type: ["string", "null"],
            description: "Região ou estado desejado.",
          },
          moq_max: {
            type: ["integer", "null"],
            description: "Quantidade máxima aceitável como pedido mínimo.",
          },
        },
        required: ["categoria", "regiao", "moq_max"],
      },
    },
  },
];

router.post("/chat/fornecedor", async (req, res): Promise<void> => {
  const buyerId = await requireBuyer(req, res);
  if (!buyerId) return;

  const body = ChatSupplierBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Mensagem de chat inválida." });
    return;
  }

  const openai = getOpenAiClient();
  if (!openai) {
    res.status(503).json({ error: "Assistente de IA indisponível." });
    return;
  }

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...body.data.history.slice(-12).map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user", content: body.data.message },
  ];

  try {
    const first = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages,
      tools,
      tool_choice: "auto",
      max_completion_tokens: 8192,
    });
    const assistant = first.choices[0]?.message;
    const toolCall = assistant?.tool_calls?.find(
      (call) =>
        call.type === "function" &&
        call.function.name === "buscar_fornecedores",
    );

    if (!toolCall || toolCall.type !== "function") {
      res.json(
        ChatSupplierResponse.parse({
          message:
            assistant?.content ??
            "Conte qual embalagem procura, a região de entrega e a quantidade aproximada.",
          suppliers: [],
        }),
      );
      return;
    }

    const search = parseSearchArgs(toolCall.function.arguments);
    if (!search) {
      res.status(400).json({ error: "Não consegui entender os critérios de busca." });
      return;
    }

    const suppliers = await searchVerifiedSuppliers(search);
    const second = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        ...messages,
        assistant,
        {
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ suppliers }),
        },
      ],
      max_completion_tokens: 8192,
    });

    const fallback =
      suppliers.length > 0
        ? "Encontrei fornecedores verificados para você explorar."
        : "Não encontrei fornecedores verificados com esses critérios. Você pode criar uma RFQ aberta para receber propostas.";
    res.json(
      ChatSupplierResponse.parse({
        message: second.choices[0]?.message.content ?? fallback,
        suppliers,
      }),
    );
  } catch (error) {
    req.log.error({ err: error, buyerId }, "Supplier chatbot request failed");
    res.status(503).json({ error: "O assistente está temporariamente indisponível." });
  }
});

export default router;