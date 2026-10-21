import "server-only";
import { and, count, desc, eq, gte, ilike, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { students, categories, enrollments, payments, type PaymentMethod } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/session";
import { BusinessError } from "@/server/errors";
import { validateNewPayment } from "@/server/domain/finance";
import { can } from "@/server/domain/permissions";
import { logHistory } from "./history";

export const PAGE_SIZE = 20;

export async function recordPayment(
  ctx: Ctx,
  data: { enrollmentId: string; amountCents: number; method: PaymentMethod; reference: string | null },
) {
  return db.transaction(async (tx) => {
    // Bloqueia a inscrição para evitar dois pagamentos em simultâneo ultrapassarem o total
    const [enr] = await tx
      .select({ id: enrollments.id, total: enrollments.totalPriceCents })
      .from(enrollments)
      .where(and(eq(enrollments.id, data.enrollmentId), eq(enrollments.schoolId, ctx.schoolId), isNull(enrollments.deletedAt)))
      .for("update")
      .limit(1);
    if (!enr) throw new BusinessError("Inscrição não encontrada.");

    const [{ paid }] = await tx
      .select({ paid: sql<number>`coalesce(sum(${payments.amountCents}), 0)`.mapWith(Number) })
      .from(payments)
      .where(and(eq(payments.enrollmentId, enr.id), isNull(payments.voidedAt)));

    const error = validateNewPayment(enr.total, paid, data.amountCents);
    if (error) throw new BusinessError(error, "amount");

    const [p] = await tx
      .insert(payments)
      .values({
        schoolId: ctx.schoolId,
        enrollmentId: enr.id,
        amountCents: data.amountCents,
        method: data.method,
        reference: data.reference,
        recordedBy: ctx.userId,
      })
      .returning({ id: payments.id });

    await logHistory(tx, ctx, "pagamento", p.id, "registou", {
      enrollmentId: enr.id,
      amountCents: data.amountCents,
      method: data.method,
    });
    return p.id;
  });
}

/** Pagamentos não se editam nem apagam: anulam-se com motivo (gestor/admin). */
export async function voidPayment(ctx: Ctx, { paymentId, reason }: { paymentId: string; reason: string }) {
  if (!can(ctx.role, "void_payment")) {
    throw new BusinessError("Só o gestor ou o administrador podem anular pagamentos.");
  }
  return db.transaction(async (tx) => {
    const [p] = await tx
      .select({ id: payments.id, enrollmentId: payments.enrollmentId, amount: payments.amountCents, voidedAt: payments.voidedAt })
      .from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.schoolId, ctx.schoolId)))
      .for("update")
      .limit(1);
    if (!p) throw new BusinessError("Pagamento não encontrado.");
    if (p.voidedAt) throw new BusinessError("Este pagamento já foi anulado.");

    await tx
      .update(payments)
      .set({ voidedAt: new Date(), voidedBy: ctx.userId, voidReason: reason })
      .where(and(eq(payments.id, p.id), eq(payments.schoolId, ctx.schoolId)));

    await logHistory(tx, ctx, "pagamento", p.id, "anulou", {
      enrollmentId: p.enrollmentId,
      amountCents: p.amount,
      reason,
    });
    return p.enrollmentId;
  });
}

export type Period = "hoje" | "semana" | "mes" | "anulados" | "todos";

function getPeriodStart(period: Period): Date | null {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (period === "hoje") return d;
  if (period === "semana") {
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // segunda-feira
    return d;
  }
  if (period === "mes") {
    d.setDate(1);
    return d;
  }
  return null;
}

export async function listPayments(
  ctx: Ctx,
  { period = "mes", q = "", page = 1 }: { period?: Period; q?: string; page?: number },
) {
  const conds: SQL[] = [eq(payments.schoolId, ctx.schoolId)];
  const periodStart = getPeriodStart(period);
  if (periodStart) conds.push(gte(payments.paidAt, periodStart));
  if (period === "anulados") conds.push(isNotNull(payments.voidedAt));
  if (q.trim()) {
    const term = `%${q.trim().replace(/[%_]/g, "\\$&")}%`;
    conds.push(or(ilike(students.fullName, term), ilike(payments.reference, term))!);
  }
  const where = and(...conds);

  const [summary] = await db
    .select({
      total: count(),
      validCount: sql<number>`count(*) filter (where ${payments.voidedAt} is null)`.mapWith(Number),
      received: sql<number>`coalesce(sum(${payments.amountCents}) filter (where ${payments.voidedAt} is null), 0)`.mapWith(Number),
    })
    .from(payments)
    .innerJoin(enrollments, eq(enrollments.id, payments.enrollmentId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(where);

  const rows = await db
    .select({
      id: payments.id,
      enrollmentId: payments.enrollmentId,
      student: students.fullName,
      category: categories.code,
      amountCents: payments.amountCents,
      method: payments.method,
      reference: payments.reference,
      paidAt: payments.paidAt,
      recordedBy: sql<string | null>`(select nome from utilizadores u where u.id = ${payments.recordedBy})`,
      voidedAt: payments.voidedAt,
      voidedBy: sql<string | null>`(select nome from utilizadores u where u.id = ${payments.voidedBy})`,
      voidReason: payments.voidReason,
    })
    .from(payments)
    .innerJoin(enrollments, eq(enrollments.id, payments.enrollmentId))
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(categories, eq(categories.id, enrollments.categoryId))
    .where(where)
    .orderBy(desc(payments.paidAt))
    .limit(PAGE_SIZE)
    .offset((Math.max(page, 1) - 1) * PAGE_SIZE);

  return {
    ...summary,
    voidedCount: summary.total - summary.validCount,
    pages: Math.max(1, Math.ceil(summary.total / PAGE_SIZE)),
    rows,
  };
}
