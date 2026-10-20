/**
 * Schema Drizzle — tradução fiel de schema.sql (fonte de verdade).
 * Não renomear tabelas/colunas nem remover restrições sem aprovação.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  check,
  date,
  index,
  jsonb,
  pgEnum,
  pgTable,
  pgView,
  numeric,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const papelUtilizador = pgEnum("papel_utilizador", [
  "atendente",
  "gestor",
  "admin",
  "super_admin",
]);
export const estadoAluno = pgEnum("estado_aluno", [
  "ativo",
  "desistiu",
  "concluido",
]);
export const estadoInatro = pgEnum("estado_inatro", [
  "nao_registado",
  "pendente",
  "registado",
]);
export const metodoPagamento = pgEnum("metodo_pagamento", [
  "dinheiro",
  "mpesa",
  "emola",
  "transferencia",
  "outro",
]);

const tz = (name: string) => timestamp(name, { withTimezone: true });
const money = (name: string) => bigint(name, { mode: "number" });

export const escolas = pgTable("escolas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  telefone: text("telefone"),
  criadoEm: tz("criado_em").notNull().defaultNow(),
});

export const utilizadores = pgTable("utilizadores", {
  id: uuid("id").primaryKey().defaultRandom(),
  escolaId: uuid("escola_id").references(() => escolas.id),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  papel: papelUtilizador("papel").notNull().default("atendente"),
  ativo: boolean("ativo").notNull().default(true),
  criadoEm: tz("criado_em").notNull().defaultNow(),
});

export const alunos = pgTable(
  "alunos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    escolaId: uuid("escola_id").references(() => escolas.id),
    nomeCompleto: text("nome_completo").notNull(),
    dataNascimento: date("data_nascimento").notNull(),
    biNumero: text("bi_numero"),
    telefone: text("telefone"),
    email: text("email"),
    endereco: text("endereco"),
    criadoPor: uuid("criado_por").references(() => utilizadores.id),
    criadoEm: tz("criado_em").notNull().defaultNow(),
    atualizadoEm: tz("atualizado_em").notNull().defaultNow(),
    eliminadoEm: tz("eliminado_em"),
  },
  (t) => [
    uniqueIndex("alunos_bi_unico")
      .on(t.escolaId, t.biNumero)
      .where(sql`${t.biNumero} IS NOT NULL AND ${t.eliminadoEm} IS NULL`),
    index("alunos_nome_idx").on(t.escolaId, sql`lower(${t.nomeCompleto})`),
  ],
);

export const categorias = pgTable(
  "categorias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    escolaId: uuid("escola_id")
      .notNull()
      .references(() => escolas.id),
    codigo: text("codigo").notNull(),
    nome: text("nome").notNull(),
    precoCentavos: money("preco_centavos").notNull(),
    ativo: boolean("ativo").notNull().default(true),
  },
  (t) => [
    unique().on(t.escolaId, t.codigo),
    check("categorias_preco_check", sql`${t.precoCentavos} >= 0`),
  ],
);

export const inscricoes = pgTable(
  "inscricoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    escolaId: uuid("escola_id")
      .notNull()
      .references(() => escolas.id),
    alunoId: uuid("aluno_id")
      .notNull()
      .references(() => alunos.id),
    categoriaId: uuid("categoria_id")
      .notNull()
      .references(() => categorias.id),
    precoTotalCentavos: money("preco_total_centavos").notNull(),
    estadoAluno: estadoAluno("estado_aluno").notNull().default("ativo"),
    estadoInatro: estadoInatro("estado_inatro")
      .notNull()
      .default("nao_registado"),
    inatroNumeroProcesso: text("inatro_numero_processo"),
    inatroUltimaTentativa: tz("inatro_ultima_tentativa"),
    inatroNota: text("inatro_nota"),
    dataInscricao: date("data_inscricao")
      .notNull()
      .default(sql`current_date`),
    criadoPor: uuid("criado_por").references(() => utilizadores.id),
    criadoEm: tz("criado_em").notNull().defaultNow(),
    atualizadoEm: tz("atualizado_em").notNull().defaultNow(),
    eliminadoEm: tz("eliminado_em"),
  },
  (t) => [
    check("inscricoes_preco_total_check", sql`${t.precoTotalCentavos} >= 0`),
    index("inscricoes_pendentes_idx")
      .on(t.escolaId, t.estadoInatro)
      .where(
        sql`${t.eliminadoEm} IS NULL AND ${t.estadoInatro} <> 'registado'`,
      ),
    index("inscricoes_aluno_idx").on(t.alunoId),
  ],
);

export const pagamentos = pgTable(
  "pagamentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    escolaId: uuid("escola_id")
      .notNull()
      .references(() => escolas.id),
    inscricaoId: uuid("inscricao_id")
      .notNull()
      .references(() => inscricoes.id),
    valorCentavos: money("valor_centavos").notNull(),
    metodo: metodoPagamento("metodo").notNull().default("dinheiro"),
    referencia: text("referencia"),
    pagoEm: tz("pago_em").notNull().defaultNow(),
    registadoPor: uuid("registado_por").references(() => utilizadores.id),
    anuladoEm: tz("anulado_em"),
    anuladoPor: uuid("anulado_por").references(() => utilizadores.id),
    motivoAnulacao: text("motivo_anulacao"),
  },
  (t) => [
    check("pagamentos_valor_check", sql`${t.valorCentavos} > 0`),
    check(
      "pagamentos_anulacao_check",
      sql`(${t.anuladoEm} IS NULL) = (${t.motivoAnulacao} IS NULL)`,
    ),
    index("pagamentos_inscricao_idx").on(t.inscricaoId),
  ],
);

export const documentos = pgTable("documentos", {
  id: uuid("id").primaryKey().defaultRandom(),
  escolaId: uuid("escola_id")
    .notNull()
    .references(() => escolas.id),
  alunoId: uuid("aluno_id")
    .notNull()
    .references(() => alunos.id),
  inscricaoId: uuid("inscricao_id").references(() => inscricoes.id),
  tipo: text("tipo").notNull(),
  storageKey: text("storage_key").notNull(),
  nomeFicheiro: text("nome_ficheiro").notNull(),
  mimeType: text("mime_type").notNull(),
  enviadoPor: uuid("enviado_por").references(() => utilizadores.id),
  criadoEm: tz("criado_em").notNull().defaultNow(),
});

export const historico = pgTable(
  "historico",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    escolaId: uuid("escola_id")
      .notNull()
      .references(() => escolas.id),
    utilizadorId: uuid("utilizador_id").references(() => utilizadores.id),
    origem: text("origem").notNull().default("app"),
    entidade: text("entidade").notNull(),
    entidadeId: uuid("entidade_id").notNull(),
    acao: text("acao").notNull(),
    dados: jsonb("dados"),
    criadoEm: tz("criado_em").notNull().defaultNow(),
  },
  (t) => [
    index("historico_entidade_idx").on(
      t.entidade,
      t.entidadeId,
      sql`${t.criadoEm} DESC`,
    ),
  ],
);

/** View criada na migração 0001 (cópia de schema.sql). `.existing()` = o drizzle-kit não a gere. */
export const inscricoesFinanceiro = pgView("inscricoes_financeiro", {
  inscricaoId: uuid("inscricao_id").notNull(),
  escolaId: uuid("escola_id").notNull(),
  precoTotalCentavos: money("preco_total_centavos").notNull(),
  pagoCentavos: money("pago_centavos").notNull(),
  saldoCentavos: money("saldo_centavos").notNull(),
  percentagemPaga: numeric("percentagem_paga").notNull(),
  situacaoPagamento: text("situacao_pagamento")
    .$type<"sem_pagamento" | "parcial" | "pago">()
    .notNull(),
}).existing();

export type PapelUtilizador = (typeof papelUtilizador.enumValues)[number];
export type EstadoInatro = (typeof estadoInatro.enumValues)[number];
export type EstadoAluno = (typeof estadoAluno.enumValues)[number];
export type MetodoPagamento = (typeof metodoPagamento.enumValues)[number];
