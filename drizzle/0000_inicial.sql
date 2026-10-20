CREATE TYPE "public"."estado_aluno" AS ENUM('ativo', 'desistiu', 'concluido');--> statement-breakpoint
CREATE TYPE "public"."estado_inatro" AS ENUM('nao_registado', 'pendente', 'registado');--> statement-breakpoint
CREATE TYPE "public"."metodo_pagamento" AS ENUM('dinheiro', 'mpesa', 'emola', 'transferencia', 'outro');--> statement-breakpoint
CREATE TYPE "public"."papel_utilizador" AS ENUM('atendente', 'gestor', 'admin');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alunos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escola_id" uuid NOT NULL,
	"nome_completo" text NOT NULL,
	"data_nascimento" date NOT NULL,
	"bi_numero" text,
	"telefone" text,
	"email" text,
	"endereco" text,
	"criado_por" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"eliminado_em" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escola_id" uuid NOT NULL,
	"codigo" text NOT NULL,
	"nome" text NOT NULL,
	"preco_centavos" bigint NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categorias_escola_id_codigo_unique" UNIQUE("escola_id","codigo"),
	CONSTRAINT "categorias_preco_check" CHECK ("categorias"."preco_centavos" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escola_id" uuid NOT NULL,
	"aluno_id" uuid NOT NULL,
	"inscricao_id" uuid,
	"tipo" text NOT NULL,
	"storage_key" text NOT NULL,
	"nome_ficheiro" text NOT NULL,
	"mime_type" text NOT NULL,
	"enviado_por" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "escolas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"telefone" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "historico" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"escola_id" uuid NOT NULL,
	"utilizador_id" uuid,
	"origem" text DEFAULT 'app' NOT NULL,
	"entidade" text NOT NULL,
	"entidade_id" uuid NOT NULL,
	"acao" text NOT NULL,
	"dados" jsonb,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inscricoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escola_id" uuid NOT NULL,
	"aluno_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"preco_total_centavos" bigint NOT NULL,
	"estado_aluno" "estado_aluno" DEFAULT 'ativo' NOT NULL,
	"estado_inatro" "estado_inatro" DEFAULT 'nao_registado' NOT NULL,
	"inatro_numero_processo" text,
	"inatro_ultima_tentativa" timestamp with time zone,
	"inatro_nota" text,
	"data_inscricao" date DEFAULT current_date NOT NULL,
	"criado_por" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"eliminado_em" timestamp with time zone,
	CONSTRAINT "inscricoes_preco_total_check" CHECK ("inscricoes"."preco_total_centavos" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pagamentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escola_id" uuid NOT NULL,
	"inscricao_id" uuid NOT NULL,
	"valor_centavos" bigint NOT NULL,
	"metodo" "metodo_pagamento" DEFAULT 'dinheiro' NOT NULL,
	"referencia" text,
	"pago_em" timestamp with time zone DEFAULT now() NOT NULL,
	"registado_por" uuid,
	"anulado_em" timestamp with time zone,
	"anulado_por" uuid,
	"motivo_anulacao" text,
	CONSTRAINT "pagamentos_valor_check" CHECK ("pagamentos"."valor_centavos" > 0),
	CONSTRAINT "pagamentos_anulacao_check" CHECK (("pagamentos"."anulado_em" IS NULL) = ("pagamentos"."motivo_anulacao" IS NULL))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "utilizadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"escola_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"papel" "papel_utilizador" DEFAULT 'atendente' NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "utilizadores_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alunos" ADD CONSTRAINT "alunos_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alunos" ADD CONSTRAINT "alunos_criado_por_utilizadores_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."utilizadores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categorias" ADD CONSTRAINT "categorias_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documentos" ADD CONSTRAINT "documentos_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documentos" ADD CONSTRAINT "documentos_aluno_id_alunos_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."alunos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documentos" ADD CONSTRAINT "documentos_inscricao_id_inscricoes_id_fk" FOREIGN KEY ("inscricao_id") REFERENCES "public"."inscricoes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documentos" ADD CONSTRAINT "documentos_enviado_por_utilizadores_id_fk" FOREIGN KEY ("enviado_por") REFERENCES "public"."utilizadores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "historico" ADD CONSTRAINT "historico_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "historico" ADD CONSTRAINT "historico_utilizador_id_utilizadores_id_fk" FOREIGN KEY ("utilizador_id") REFERENCES "public"."utilizadores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_aluno_id_alunos_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."alunos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_criado_por_utilizadores_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."utilizadores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_inscricao_id_inscricoes_id_fk" FOREIGN KEY ("inscricao_id") REFERENCES "public"."inscricoes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_registado_por_utilizadores_id_fk" FOREIGN KEY ("registado_por") REFERENCES "public"."utilizadores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_anulado_por_utilizadores_id_fk" FOREIGN KEY ("anulado_por") REFERENCES "public"."utilizadores"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "utilizadores" ADD CONSTRAINT "utilizadores_escola_id_escolas_id_fk" FOREIGN KEY ("escola_id") REFERENCES "public"."escolas"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "alunos_bi_unico" ON "alunos" USING btree ("escola_id","bi_numero") WHERE "alunos"."bi_numero" IS NOT NULL AND "alunos"."eliminado_em" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "alunos_nome_idx" ON "alunos" USING btree ("escola_id",lower("nome_completo"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "historico_entidade_idx" ON "historico" USING btree ("entidade","entidade_id","criado_em" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inscricoes_pendentes_idx" ON "inscricoes" USING btree ("escola_id","estado_inatro") WHERE "inscricoes"."eliminado_em" IS NULL AND "inscricoes"."estado_inatro" <> 'registado';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "inscricoes_aluno_idx" ON "inscricoes" USING btree ("aluno_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pagamentos_inscricao_idx" ON "pagamentos" USING btree ("inscricao_id");