import "server-only";
import bcrypt from "bcryptjs";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { schools, users } from "@/server/db/schema";
import { BusinessError } from "@/server/errors";
import type { Ctx } from "@/server/auth/session";
import { logHistory } from "./history";

export async function globalSummary() {
  const result = await db.execute<{
    companies: number | string;
    admins: number | string;
    enrollments: number | string;
    received_month: number | string;
  }>(sql`
    with ativas as (select id from escolas where eliminada_em is null)
    select
      (select count(*) from ativas) as companies,
      (select count(*) from utilizadores where papel = 'admin' and ativo and escola_id in (select id from ativas)) as admins,
      (select count(*) from inscricoes where eliminado_em is null and escola_id in (select id from ativas)) as enrollments,
      (select coalesce(sum(valor_centavos), 0) from pagamentos
        where anulado_em is null and pago_em >= date_trunc('month', now()) and escola_id in (select id from ativas)) as received_month
  `);
  const r = result.rows[0];
  return {
    companies: Number(r.companies),
    admins: Number(r.admins),
    enrollments: Number(r.enrollments),
    receivedThisMonth: Number(r.received_month),
  };
}

export async function listCompanies() {
  return db.execute<{
    id: string;
    name: string;
    phone: string | null;
    created_at: Date | string;
    suspended_at: Date | string | null;
    trial_days: number | null;
    users: number | string;
    enrollments: number | string;
    received: number | string;
  }>(sql`
    select e.id, e.nome as name, e.telefone as phone, e.criado_em as created_at,
      e.suspensa_em as suspended_at, e.trial_dias as trial_days,
      (select count(*) from utilizadores u where u.escola_id = e.id and u.ativo) as users,
      (select count(*) from inscricoes i where i.escola_id = e.id and i.eliminado_em is null) as enrollments,
      (select coalesce(sum(p.valor_centavos), 0) from pagamentos p
        where p.escola_id = e.id and p.anulado_em is null) as received
    from escolas e where e.eliminada_em is null order by e.nome
  `).then((r) => r.rows);
}

const activeCompany = (id: string) => and(eq(schools.id, id), isNull(schools.deletedAt));

export async function saveCompany(ctx: Ctx, data: { id?: string; name: string; phone: string | null; trialDays: number | null }) {
  const { id } = data;
  const values = { name: data.name, phone: data.phone, trialDays: data.trialDays };
  if (!id) {
    const [created] = await db.insert(schools).values(values).returning({ id: schools.id });
    return created.id;
  }
  return db.transaction(async (tx) => {
    const [current] = await tx.select({ trialDays: schools.trialDays }).from(schools).where(activeCompany(id)).limit(1);
    if (!current) throw new BusinessError("Empresa não encontrada.");
    await tx.update(schools).set(values).where(eq(schools.id, id));
    if (current.trialDays !== data.trialDays) {
      await logHistory(tx, { schoolId: id, userId: ctx.userId }, "empresa", id, "alterou_trial", { from: current.trialDays, to: data.trialDays });
    }
    return id;
  });
}

/** Suspende ou reativa. Os dados ficam intactos; só o acesso muda. */
export async function setCompanySuspended(ctx: Ctx, id: string, suspended: boolean) {
  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(schools)
      .set({ suspendedAt: suspended ? new Date() : null })
      .where(activeCompany(id))
      .returning({ id: schools.id });
    if (!updated) throw new BusinessError("Empresa não encontrada.");
    await logHistory(tx, { schoolId: id, userId: ctx.userId }, "empresa", id, suspended ? "suspendeu" : "reativou");
  });
}

/** Eliminação lógica: nada é apagado (pagamentos e histórico têm de se manter), a empresa deixa de estar disponível. */
export async function deleteCompany(ctx: Ctx, id: string, confirmName: string) {
  await db.transaction(async (tx) => {
    const [company] = await tx.select({ name: schools.name }).from(schools).where(activeCompany(id)).limit(1);
    if (!company) throw new BusinessError("Empresa não encontrada.");
    if (company.name !== confirmName) throw new BusinessError("O nome escrito não corresponde ao da empresa.");
    await tx.update(schools).set({ deletedAt: new Date() }).where(eq(schools.id, id));
    await logHistory(tx, { schoolId: id, userId: ctx.userId }, "empresa", id, "eliminou");
  });
}

export async function listAdmins() {
  return db.select({ id: users.id, name: users.name, email: users.email, active: users.active, createdAt: users.createdAt, school: schools.name })
    .from(users).innerJoin(schools, eq(schools.id, users.schoolId))
    .where(and(eq(users.role, "admin"), isNull(schools.deletedAt))).orderBy(asc(schools.name), asc(users.name));
}

export async function createCompanyAdmin(data: { name: string; email: string; password: string; schoolId: string }) {
  const [school] = await db.select({ id: schools.id }).from(schools).where(activeCompany(data.schoolId)).limit(1);
  if (!school) throw new BusinessError("Escolha uma empresa válida.", "schoolId");
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);
  if (existing) throw new BusinessError("Já existe uma conta com este email.", "email");
  const passwordHash = await bcrypt.hash(data.password, 10);
  await db.insert(users).values({ schoolId: school.id, name: data.name, email: data.email, passwordHash, role: "admin" });
}
