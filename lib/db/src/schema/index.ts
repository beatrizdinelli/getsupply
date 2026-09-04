import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const rfqStatusEnum = pgEnum("rfq_status", [
  "aguardando_proposta",
  "proposta_recebida",
  "atrasado",
  "fechado",
]);

export const proposalStatusEnum = pgEnum("proposta_status", [
  "enviada",
  "aceita",
  "recusada",
]);

export const buyersTable = pgTable("comprador", {
  id: serial("id").primaryKey(),
  name: varchar("nome", { length: 120 }).notNull(),
  email: varchar("email", { length: 160 }).notNull(),
  company: varchar("empresa", { length: 160 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categoriesTable = pgTable("categoria", {
  id: serial("id").primaryKey(),
  name: varchar("nome", { length: 80 }).notNull(),
});

export const suppliersTable = pgTable("fornecedor", {
  id: serial("id").primaryKey(),
  companyName: varchar("nome_empresa", { length: 160 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }).notNull().unique(),
  cnpjVerified: boolean("cnpj_verificado").notNull().default(false),
  region: varchar("regiao", { length: 120 }).notNull(),
  productionCapacity: text("capacidade_produtiva"),
  standardMoq: integer("moq_padrao"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const supplierCategoriesTable = pgTable(
  "fornecedor_categoria",
  {
    supplierId: integer("fornecedor_id")
      .notNull()
      .references(() => suppliersTable.id),
    categoryId: integer("categoria_id")
      .notNull()
      .references(() => categoriesTable.id),
  },
  (table) => [
    primaryKey({ columns: [table.supplierId, table.categoryId] }),
  ],
);

export const rfqsTable = pgTable("rfq", {
  id: serial("id").primaryKey(),
  buyerId: integer("comprador_id")
    .notNull()
    .references(() => buyersTable.id),
  categoryId: integer("categoria_id")
    .notNull()
    .references(() => categoriesTable.id),
  title: varchar("titulo", { length: 200 })
    .notNull()
    .default("Solicitação de cotação"),
  technicalSpecification: text("especificacao_tecnica").notNull(),
  quantity: integer("quantidade").notNull(),
  desiredDeadline: date("prazo_desejado", { mode: "string" }).notNull(),
  deliveryRegion: varchar("regiao_entrega", { length: 120 }).notNull(),
  referenceFile: varchar("arquivo_referencia", { length: 255 }),
  status: rfqStatusEnum("status").notNull().default("aguardando_proposta"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const proposalsTable = pgTable("proposta", {
  id: serial("id").primaryKey(),
  rfqId: integer("rfq_id")
    .notNull()
    .references(() => rfqsTable.id),
  supplierName: varchar("fornecedor_nome", { length: 160 }).notNull(),
  price: numeric("preco", { precision: 10, scale: 2 }).notNull(),
  deliveryDeadline: date("prazo_entrega", { mode: "string" }).notNull(),
  proposedMoq: integer("moq_proposto").notNull(),
  commercialTerms: text("condicoes_comerciais"),
  status: proposalStatusEnum("status").notNull().default("enviada"),
  decisionDate: timestamp("data_decisao"),
  rejectionReason: text("motivo_recusa"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const evaluationsTable = pgTable("avaliacao", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposta_id")
    .notNull()
    .references(() => proposalsTable.id),
  score: integer("nota").notNull(),
  comment: text("comentario"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBuyerSchema = createInsertSchema(buyersTable).omit({
  id: true,
  createdAt: true,
});
export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  id: true,
});
export const insertSupplierSchema = createInsertSchema(suppliersTable).omit({
  id: true,
  createdAt: true,
});
export const insertSupplierCategorySchema = createInsertSchema(
  supplierCategoriesTable,
);
export const insertRfqSchema = createInsertSchema(rfqsTable).omit({
  id: true,
  createdAt: true,
});
export const insertProposalSchema = createInsertSchema(proposalsTable).omit({
  id: true,
  createdAt: true,
});
export const insertEvaluationSchema = createInsertSchema(evaluationsTable).omit({
  id: true,
  createdAt: true,
});

export type Buyer = typeof buyersTable.$inferSelect;
export type Category = typeof categoriesTable.$inferSelect;
export type Supplier = typeof suppliersTable.$inferSelect;
export type SupplierCategory = typeof supplierCategoriesTable.$inferSelect;
export type Rfq = typeof rfqsTable.$inferSelect;
export type Proposal = typeof proposalsTable.$inferSelect;
export type Evaluation = typeof evaluationsTable.$inferSelect;
export type InsertBuyer = z.infer<typeof insertBuyerSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type InsertSupplierCategory = z.infer<
  typeof insertSupplierCategorySchema
>;
export type InsertRfq = z.infer<typeof insertRfqSchema>;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;