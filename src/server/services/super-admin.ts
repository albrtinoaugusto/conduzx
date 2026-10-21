import "server-only";
import bcrypt from "bcryptjs";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { schools, users } from "@/server/db/schema";
import { BusinessError } from "@/server/errors";
import type { Ctx } from "@/server/auth/session";

export async function globalSummary() {
  const result = await db.execute<{
    companies: number | string;
    admins: number | string;
    enrollments: number | string;
    received_month: number | string;
  }>(sql`
    select
      (select count(*) from escolas) as companies,
      (select count(*) from utilizadores where papel = 'admin' and ativo) as admins,
      (select count(*) from inscricoes where eliminado_em is null) as enrollments,
      (select coalesce(sum(valor_centavos), 0) from pagamentos
        where anulado_em is null and pago_em >= date_trunc('month', now())) as received_month
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
    created_at: Date;
    users: number | string;
    enrollments: number | string;
    received: number | string;
  }>(sql`
    select e.id, e.nome as name, e.telefone as phone, e.criado_em as created_at,
      (select count(*) from utilizadores u where u.escola_id = e.id and u.ativo) as users,
      (select count(*) from inscricoes i where i.escola_id = e.id and i.eliminado_em is null) as enrollments,
      (select coalesce(sum(p.valor_centavos), 0) from pagamentos p
        where p.escola_id = e.id and p.anulado_em is null) as received
    from escolas e order by e.nome
  `).then((r) => r.rows);
}

export async function saveCompany(ctx: Ctx, data: { id?: string; name: string; phone: string | null }) {
  if (data.id) {
    const updatedRows = await db.update(schools).set({ name: data.name, phone: data.phone }).where(eq(schools.id, data.id)).returning({ id: schools.id });
    if (!updatedRows.length) throw new BusinessError("Empresa não encontrada.");
    return updatedRows[0].id;
  }
  const [created] = await db.insert(schools).values({ name: data.name, phone: data.phone }).returning({ id: schools.id });
  return created.id;
}

export async function listAdmins() {
  return db.select({ id: users.id, name: users.name, email: users.email, active: users.active, createdAt: users.createdAt, school: schools.name })
    .from(users).innerJoin(schools, eq(schools.id, users.schoolId))
    .where(eq(users.role, "admin")).orderBy(asc(schools.name), asc(users.name));
}

export async function createCompanyAdmin(data: { name: string; email: string; password: string; schoolId: string }) {
  const [school] = await db.select({ id: schools.id }).from(schools).where(eq(schools.id, data.schoolId)).limit(1);
  if (!school) throw new BusinessError("Escolha uma empresa válida.", "schoolId");
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);
  if (existing) throw new BusinessError("Já existe uma conta com este email.", "email");
  const passwordHash = await bcrypt.hash(data.password, 10);
  await db.insert(users).values({ schoolId: school.id, name: data.name, email: data.email, passwordHash, role: "admin" });
}
