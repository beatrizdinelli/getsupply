CREATE TYPE "public"."proposta_status" AS ENUM('enviada', 'aceita', 'recusada');--> statement-breakpoint
CREATE TYPE "public"."rfq_status" AS ENUM('aguardando_proposta', 'proposta_recebida', 'atrasado', 'fechado');--> statement-breakpoint
CREATE TABLE "comprador" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" varchar(80),
	"nome" varchar(120) NOT NULL,
	"email" varchar(160) NOT NULL,
	"empresa" varchar(160),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comprador_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "categoria" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(80) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avaliacao" (
	"id" serial PRIMARY KEY NOT NULL,
	"proposta_id" integer NOT NULL,
	"nota" integer NOT NULL,
	"comentario" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposta" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfq_id" integer NOT NULL,
	"fornecedor_id" integer,
	"fornecedor_nome" varchar(160) NOT NULL,
	"preco" numeric(10, 2) NOT NULL,
	"prazo_entrega" date NOT NULL,
	"moq_proposto" integer NOT NULL,
	"condicoes_comerciais" text,
	"status" "proposta_status" DEFAULT 'enviada' NOT NULL,
	"data_decisao" timestamp,
	"motivo_recusa" text,
	"stripe_price_id" varchar(80),
	"stripe_checkout_session_id" varchar(100),
	"stripe_payment_intent_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "proposta_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id")
);
--> statement-breakpoint
CREATE TABLE "rfq" (
	"id" serial PRIMARY KEY NOT NULL,
	"comprador_id" integer NOT NULL,
	"categoria_id" integer NOT NULL,
	"titulo" varchar(200) DEFAULT 'Solicitação de cotação' NOT NULL,
	"especificacao_tecnica" text NOT NULL,
	"quantidade" integer NOT NULL,
	"prazo_desejado" date NOT NULL,
	"regiao_entrega" varchar(120) NOT NULL,
	"arquivo_referencia" varchar(255),
	"status" "rfq_status" DEFAULT 'aguardando_proposta' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fornecedor_categoria" (
	"fornecedor_id" integer NOT NULL,
	"categoria_id" integer NOT NULL,
	CONSTRAINT "fornecedor_categoria_fornecedor_id_categoria_id_pk" PRIMARY KEY("fornecedor_id","categoria_id")
);
--> statement-breakpoint
CREATE TABLE "fornecedor" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" varchar(80),
	"stripe_account_id" varchar(80),
	"stripe_onboarding_complete" boolean DEFAULT false NOT NULL,
	"nome_empresa" varchar(160) NOT NULL,
	"cnpj" varchar(20) NOT NULL,
	"cnpj_verificado" boolean DEFAULT false NOT NULL,
	"regiao" varchar(120) NOT NULL,
	"capacidade_produtiva" text,
	"moq_padrao" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fornecedor_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "fornecedor_stripe_account_id_unique" UNIQUE("stripe_account_id"),
	CONSTRAINT "fornecedor_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
ALTER TABLE "avaliacao" ADD CONSTRAINT "avaliacao_proposta_id_proposta_id_fk" FOREIGN KEY ("proposta_id") REFERENCES "public"."proposta"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposta" ADD CONSTRAINT "proposta_rfq_id_rfq_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfq"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposta" ADD CONSTRAINT "proposta_fornecedor_id_fornecedor_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_comprador_id_comprador_id_fk" FOREIGN KEY ("comprador_id") REFERENCES "public"."comprador"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfq" ADD CONSTRAINT "rfq_categoria_id_categoria_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fornecedor_categoria" ADD CONSTRAINT "fornecedor_categoria_fornecedor_id_fornecedor_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fornecedor_categoria" ADD CONSTRAINT "fornecedor_categoria_categoria_id_categoria_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categoria"("id") ON DELETE no action ON UPDATE no action;