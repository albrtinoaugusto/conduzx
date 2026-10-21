import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db, type Tx } from "@/server/db";
import { students, categories, enrollments, enrollmentFinancials } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/session";
import { BusinessError } from "@/server/errors";
import type { StudentInput } from "@/server/validation/schemas";
import { logHistory } from "./history";

export const PAGE_SIZE = 15;

function searchFilter(q: string) {
  const term = `%${q.replace(/[%_]/g, "\\$&")}%`;
  const digits = q.replace(/\D/g, "");
  return or(
    ilike(students.fullName, term),
    ilike(students.idNumber, term),
    digits.length >= 3
      ? sql`regexp_replace(coalesce(${students.phone}, ''), '\\D', '', 'g') LIKE ${`%${digits}%`}`
      : ilike(students.phone, term),
  );
}

export async function listStudents(
  ctx: Ctx,
  { q = "", page = 1, status }: { q?: string; page?: number; status?: "ativo" | "concluido" | "desistiu" },
) {
  const conds = [eq(students.schoolId, ctx.schoolId), isNull(students.deletedAt)];
  if (q.trim()) conds.push(searchFilter(q.trim())!);
  if (status) {
    conds.push(
      sql`exists (select 1 from ${enrollments} i where i.aluno_id = ${students.id}
          and i.eliminado_em is null and i.estado_aluno = ${status})`,
    );
  }
  const where = and(...conds);

  const [{ total }] = await db.select({ total: count() }).from(students).where(where);
  const rows = await db
    .select({
      id: students.id,
      fullName: students.fullName,
      idNumber: students.idNumber,
      phone: students.phone,
    })
    .from(students)
    .where(where)
    .orderBy(asc(students.fullName))
    .limit(PAGE_SIZE)
    .offset((Math.max(page, 1) - 1) * PAGE_SIZE);

  // Última inscrição de cada aluno (categoria + estado)
  const ids = rows.map((l) => l.id);
  const latestList = ids.length
    ? await db
        .selectDistinctOn([enrollments.studentId], {
          studentId: enrollments.studentId,
          category: categories.name,
          code: categories.code,
          studentStatus: enrollments.studentStatus,
        })
        .from(enrollments)
        .innerJoin(categories, eq(categories.id, enrollments.categoryId))
        .where(
          and(
            eq(enrollments.schoolId, ctx.schoolId),
            inArray(enrollments.studentId, ids),
            isNull(enrollments.deletedAt),
          ),
        )
        .orderBy(enrollments.studentId, desc(enrollments.createdAt))
    : [];
  const byStudent = new Map(latestList.map((u) => [u.studentId, u]));

  return {
    total,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    rows: rows.map((l) => ({ ...l, latest: byStudent.get(l.id) ?? null })),
  };
}

/** Pesquisa rápida para escolher aluno numa nova inscrição. */
export async function searchStudents(ctx: Ctx, q: string) {
  if (q.trim().length < 2) return [];
  return db
    .select({
      id: students.id,
      fullName: students.fullName,
      idNumber: students.idNumber,
      phone: students.phone,
    })
    .from(students)
    .where(and(eq(students.schoolId, ctx.schoolId), isNull(students.deletedAt), searchFilter(q.trim())))
    .orderBy(asc(students.fullName))
    .limit(8);
}

export async function getStudent(ctx: Ctx, id: string) {
  const [student] = await db
    .select()
    .from(students)
    .where(and(eq(students.id, id), eq(students.schoolId, ctx.schoolId), isNull(students.deletedAt)))
    .limit(1);
  if (!student) return null;

  const list = await db
    .select({
      id: enrollments.id,
      category: categories.name,
      code: categories.code,
      studentStatus: enrollments.studentStatus,
      inatroStatus: enrollments.inatroStatus,
      inatroProcessNumber: enrollments.inatroProcessNumber,
      enrollmentDate: enrollments.enrollmentDate,
      total: enrollmentFinancials.totalPriceCents,
      paid: enrollmentFinancials.paidCents,
      paymentStatus: enrollmentFinancials.paymentStatus,
    })
    .from(enrollments)
    .innerJoin(categories, eq(categories.id, enrollments.categoryId))
    .innerJoin(enrollmentFinancials, eq(enrollmentFinancials.enrollmentId, enrollments.id))
    .where(and(eq(enrollments.studentId, id), eq(enrollments.schoolId, ctx.schoolId), isNull(enrollments.deletedAt)))
    .orderBy(desc(enrollments.createdAt));

  return { student, enrollments: list };
}

async function ensureUniqueIdNumber(tx: Tx, ctx: Ctx, idNo: string | null, excludeId?: string) {
  if (!idNo) return;
  const conds = [eq(students.schoolId, ctx.schoolId), eq(students.idNumber, idNo), isNull(students.deletedAt)];
  if (excludeId) conds.push(ne(students.id, excludeId));
  const [found] = await tx
    .select({ id: students.id, name: students.fullName })
    .from(students)
    .where(and(...conds))
    .limit(1);
  if (found) {
    throw new BusinessError(`Já existe um aluno com este BI: ${found.name}.`, "idNumber", {
      href: `/alunos/${found.id}`,
      text: "Abrir ficha do aluno",
    });
  }
}

/** Cria um aluno. Pode receber uma transação externa (fluxo de nova inscrição). */
export async function createStudent(ctx: Ctx, data: StudentInput, outerTx?: Tx) {
  const run = async (tx: Tx) => {
    await ensureUniqueIdNumber(tx, ctx, data.idNumber);
    const [created] = await tx
      .insert(students)
      .values({ ...data, schoolId: ctx.schoolId, createdBy: ctx.userId })
      .returning({ id: students.id });
    await logHistory(tx, ctx, "aluno", created.id, "criou", { name: data.fullName });
    return created.id;
  };
  return outerTx ? run(outerTx) : db.transaction(run);
}

export async function updateStudent(ctx: Ctx, id: string, data: StudentInput) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(students)
      .where(and(eq(students.id, id), eq(students.schoolId, ctx.schoolId), isNull(students.deletedAt)))
      .limit(1);
    if (!current) throw new BusinessError("Aluno não encontrado.");
    await ensureUniqueIdNumber(tx, ctx, data.idNumber, id);

    const changedFields = (Object.keys(data) as Array<keyof StudentInput>).filter(
      (k) => String(current[k] ?? "") !== String(data[k] ?? ""),
    );
    if (changedFields.length === 0) return;

    await tx
      .update(students)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(students.id, id), eq(students.schoolId, ctx.schoolId)));
    // Só os nomes dos campos — sem valores pessoais no histórico
    await logHistory(tx, ctx, "aluno", id, "atualizou", { fields: changedFields });
  });
}
