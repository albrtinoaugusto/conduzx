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

export const userRole = pgEnum("papel_utilizador", [
  "atendente",
  "gestor",
  "admin",
  "super_admin",
]);
export const studentStatus = pgEnum("estado_aluno", [
  "ativo",
  "desistiu",
  "concluido",
]);
export const inatroStatus = pgEnum("estado_inatro", [
  "nao_registado",
  "pendente",
  "registado",
]);
export const paymentMethod = pgEnum("metodo_pagamento", [
  "dinheiro",
  "mpesa",
  "emola",
  "transferencia",
  "outro",
]);

const tz = (name: string) => timestamp(name, { withTimezone: true });
const money = (name: string) => bigint(name, { mode: "number" });

export const schools = pgTable("escolas", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("nome").notNull(),
  phone: text("telefone"),
  createdAt: tz("criado_em").notNull().defaultNow(),
});

export const users = pgTable("utilizadores", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("escola_id").references(() => schools.id),
  name: text("nome").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("papel").notNull().default("atendente"),
  active: boolean("ativo").notNull().default(true),
  createdAt: tz("criado_em").notNull().defaultNow(),
});

export const students = pgTable(
  "alunos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("escola_id").references(() => schools.id),
    fullName: text("nome_completo").notNull(),
    birthDate: date("data_nascimento").notNull(),
    idNumber: text("bi_numero"),
    phone: text("telefone"),
    email: text("email"),
    address: text("endereco"),
    createdBy: uuid("criado_por").references(() => users.id),
    createdAt: tz("criado_em").notNull().defaultNow(),
    updatedAt: tz("atualizado_em").notNull().defaultNow(),
    deletedAt: tz("eliminado_em"),
  },
  (t) => [
    uniqueIndex("alunos_bi_unico")
      .on(t.schoolId, t.idNumber)
      .where(sql`${t.idNumber} IS NOT NULL AND ${t.deletedAt} IS NULL`),
    index("alunos_nome_idx").on(t.schoolId, sql`lower(${t.fullName})`),
  ],
);

export const categories = pgTable(
  "categorias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("escola_id")
      .notNull()
      .references(() => schools.id),
    code: text("codigo").notNull(),
    name: text("nome").notNull(),
    priceCents: money("preco_centavos").notNull(),
    active: boolean("ativo").notNull().default(true),
  },
  (t) => [
    unique().on(t.schoolId, t.code),
    check("categorias_preco_check", sql`${t.priceCents} >= 0`),
  ],
);

export const enrollments = pgTable(
  "inscricoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("escola_id")
      .notNull()
      .references(() => schools.id),
    studentId: uuid("aluno_id")
      .notNull()
      .references(() => students.id),
    categoryId: uuid("categoria_id")
      .notNull()
      .references(() => categories.id),
    totalPriceCents: money("preco_total_centavos").notNull(),
    studentStatus: studentStatus("estado_aluno").notNull().default("ativo"),
    inatroStatus: inatroStatus("estado_inatro")
      .notNull()
      .default("nao_registado"),
    inatroProcessNumber: text("inatro_numero_processo"),
    inatroLastAttempt: tz("inatro_ultima_tentativa"),
    inatroNote: text("inatro_nota"),
    enrollmentDate: date("data_inscricao")
      .notNull()
      .default(sql`current_date`),
    createdBy: uuid("criado_por").references(() => users.id),
    createdAt: tz("criado_em").notNull().defaultNow(),
    updatedAt: tz("atualizado_em").notNull().defaultNow(),
    deletedAt: tz("eliminado_em"),
  },
  (t) => [
    check("inscricoes_preco_total_check", sql`${t.totalPriceCents} >= 0`),
    index("inscricoes_pendentes_idx")
      .on(t.schoolId, t.inatroStatus)
      .where(
        sql`${t.deletedAt} IS NULL AND ${t.inatroStatus} <> 'registado'`,
      ),
    index("inscricoes_aluno_idx").on(t.studentId),
  ],
);

export const payments = pgTable(
  "pagamentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("escola_id")
      .notNull()
      .references(() => schools.id),
    enrollmentId: uuid("inscricao_id")
      .notNull()
      .references(() => enrollments.id),
    amountCents: money("valor_centavos").notNull(),
    method: paymentMethod("metodo").notNull().default("dinheiro"),
    reference: text("referencia"),
    paidAt: tz("pago_em").notNull().defaultNow(),
    recordedBy: uuid("registado_por").references(() => users.id),
    voidedAt: tz("anulado_em"),
    voidedBy: uuid("anulado_por").references(() => users.id),
    voidReason: text("motivo_anulacao"),
  },
  (t) => [
    check("pagamentos_valor_check", sql`${t.amountCents} > 0`),
    check(
      "pagamentos_anulacao_check",
      sql`(${t.voidedAt} IS NULL) = (${t.voidReason} IS NULL)`,
    ),
    index("pagamentos_inscricao_idx").on(t.enrollmentId),
  ],
);

export const documents = pgTable("documentos", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("escola_id")
    .notNull()
    .references(() => schools.id),
  studentId: uuid("aluno_id")
    .notNull()
    .references(() => students.id),
  enrollmentId: uuid("inscricao_id").references(() => enrollments.id),
  type: text("tipo").notNull(),
  storageKey: text("storage_key").notNull(),
  fileName: text("nome_ficheiro").notNull(),
  mimeType: text("mime_type").notNull(),
  uploadedBy: uuid("enviado_por").references(() => users.id),
  createdAt: tz("criado_em").notNull().defaultNow(),
});

export const history = pgTable(
  "historico",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    schoolId: uuid("escola_id")
      .notNull()
      .references(() => schools.id),
    userId: uuid("utilizador_id").references(() => users.id),
    source: text("origem").notNull().default("app"),
    entity: text("entidade").notNull(),
    entityId: uuid("entidade_id").notNull(),
    action: text("acao").notNull(),
    data: jsonb("dados"),
    createdAt: tz("criado_em").notNull().defaultNow(),
  },
  (t) => [
    index("historico_entidade_idx").on(
      t.entity,
      t.entityId,
      sql`${t.createdAt} DESC`,
    ),
  ],
);

/** View criada na migração 0001 (cópia de schema.sql). `.existing()` = o drizzle-kit não a gere. */
export const enrollmentFinancials = pgView("inscricoes_financeiro", {
  enrollmentId: uuid("inscricao_id").notNull(),
  schoolId: uuid("escola_id").notNull(),
  totalPriceCents: money("preco_total_centavos").notNull(),
  paidCents: money("pago_centavos").notNull(),
  balanceCents: money("saldo_centavos").notNull(),
  paidPercentage: numeric("percentagem_paga").notNull(),
  paymentStatus: text("situacao_pagamento")
    .$type<"sem_pagamento" | "parcial" | "pago">()
    .notNull(),
}).existing();

export type UserRole = (typeof userRole.enumValues)[number];
export type InatroStatus = (typeof inatroStatus.enumValues)[number];
export type StudentStatus = (typeof studentStatus.enumValues)[number];
export type PaymentMethod = (typeof paymentMethod.enumValues)[number];
