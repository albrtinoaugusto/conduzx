import "server-only";
import { and, asc, count, desc, eq, ilike, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import {
  students,
  categories,
  enrollments,
  enrollmentFinancials,
  payments,
  users,
  type StudentStatus,
  type InatroStatus,
  type PaymentMethod,
} from "@/server/db/schema";
import type { Ctx } from "@/server/auth/session";
import { BusinessError } from "@/server/errors";
import { validateNewPayment } from "@/server/domain/finance";
import { validateInatroStatus } from "@/server/domain/inatro";
import type { StudentInput } from "@/server/validation/schemas";
import { createStudent } from "./students";
import { logHistory } from "./history";

export const PAGE_SIZE = 15;

const inSchool = (ctx: Ctx) => and(eq(enrollments.schoolId, ctx.schoolId), isNull(enrollments.deletedAt));

const listColumns = {
  id: enrollments.id,
  studentId: students.id,
  student: students.fullName,
  phone: students.phone,
  category: categories.name,
  code: categories.code,
  studentStatus: enrollments.studentStatus,
  inatroStatus: enrollments.inatroStatus,
  inatroProcessNumber: enrollments.inatroProcessNumber,
  inatroNote: enrollments.inatroNote,
  inatroLastAttempt: enrollments.inatroLastAttempt,
  enrollmentDate: enrollments.enrollmentDate,
  firstLessonDate: enrollments.firstLessonDate,
  createdAt: enrollments.createdAt,
  /** Valor a pagar (preço - desconto). */
  total: enrollmentFinancials.dueCents,
  price: enrollmentFinancials.totalPriceCents,
  discount: enrollmentFinancials.discountCents,
  discountReason: enrollments.discountReason,
  paid: enrollmentFinancials.paidCents,
  balance: enrollmentFinancials.balanceCents,
  paymentStatus: enrollmentFinancials.paymentStatus,
};

function baseList() {
  return db
    .select(listColumns)
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(categories, eq(categories.id, enrollments.categoryId))
    .innerJoin(enrollmentFinancials, eq(enrollmentFinancials.enrollmentId, enrollments.id));
}

/** "em_divida" = sem pagamento ou parcial (ainda falta receber). */
export type PaymentStatusFilter = "sem_pagamento" | "parcial" | "pago" | "em_divida";

export async function listEnrollments(
  ctx: Ctx,
  { q = "", paymentStatus, page = 1 }: { q?: string; paymentStatus?: PaymentStatusFilter; page?: number },
) {
  const conds: SQL[] = [inSchool(ctx)!];
  if (paymentStatus === "em_divida") conds.push(ne(enrollmentFinancials.paymentStatus, "pago"), eq(enrollments.studentStatus, "ativo"));
  else if (paymentStatus) conds.push(eq(enrollmentFinancials.paymentStatus, paymentStatus));
  if (q.trim()) {
    const term = `%${q.trim().replace(/[%_]/g, "\\$&")}%`;
    conds.push(or(ilike(students.fullName, term), ilike(students.idNumber, term), ilike(categories.code, term))!);
  }
  const where = and(...conds);

  const [{ total }] = await db
    .select({ total: count() })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(categories, eq(categories.id, enrollments.categoryId))
    .innerJoin(enrollmentFinancials, eq(enrollmentFinancials.enrollmentId, enrollments.id))
    .where(where);

  const rows = await baseList()
    .where(where)
    .orderBy(desc(enrollments.createdAt))
    .limit(PAGE_SIZE)
    .offset((Math.max(page, 1) - 1) * PAGE_SIZE);

  return { total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), rows };
}

/** Pendências do INATRO: tudo o que ainda não está registado, mais antigo primeiro. */
export async function listPending(ctx: Ctx, filter: "pendente" | "nao_registado" | "todos" = "todos") {
  const conds: SQL[] = [inSchool(ctx)!, ne(enrollments.studentStatus, "desistiu")];
  conds.push(filter === "todos" ? ne(enrollments.inatroStatus, "registado") : eq(enrollments.inatroStatus, filter));
  return baseList()
    .where(and(...conds))
    .orderBy(asc(enrollments.createdAt));
}

export async function getEnrollment(ctx: Ctx, id: string) {
  const [row] = await db
    .select({
      ...listColumns,
      idNumber: students.idNumber,
      percentage: enrollmentFinancials.paidPercentage,
      createdBy: users.name,
    })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(categories, eq(categories.id, enrollments.categoryId))
    .innerJoin(enrollmentFinancials, eq(enrollmentFinancials.enrollmentId, enrollments.id))
    .leftJoin(users, eq(users.id, enrollments.createdBy))
    .where(and(eq(enrollments.id, id), inSchool(ctx)))
    .limit(1);
  if (!row) return null;

  const registou = sql<string | null>`(select nome from utilizadores u where u.id = ${payments.recordedBy})`;
  const anulou = sql<string | null>`(select nome from utilizadores u where u.id = ${payments.voidedBy})`;
  const list = await db
    .select({
      id: payments.id,
      amountCents: payments.amountCents,
      method: payments.method,
      reference: payments.reference,
      paidAt: payments.paidAt,
      recordedBy: registou,
      voidedAt: payments.voidedAt,
      voidedBy: anulou,
      voidReason: payments.voidReason,
    })
    .from(payments)
    .where(and(eq(payments.enrollmentId, id), eq(payments.schoolId, ctx.schoolId)))
    .orderBy(desc(payments.paidAt));

  return { ...row, payments: list };
}

export type NewEnrollmentInput = {
  student: { existingId: string } | { newStudent: StudentInput };
  categoryId: string;
  enrollmentDate: string;
  firstLessonDate: string | null;
  inatroStatus: InatroStatus;
  inatroProcessNumber: string | null;
  inatroNote: string | null;
  discountCents: number;
  discountReason: string | null;
  firstPayment: { amountCents: number; method: PaymentMethod; reference: string } | null;
};

/** Nova inscrição - UMA transação: aluno + inscrição + pagamento opcional + histórico. */
export async function createEnrollment(ctx: Ctx, input: NewEnrollmentInput) {
  const inatroError = validateInatroStatus(input.inatroStatus, input.inatroProcessNumber);
  if (inatroError) throw new BusinessError(inatroError, "inatroProcessNumber");

  return db.transaction(async (tx) => {
    let studentId: string;
    if ("existingId" in input.student) {
      const [a] = await tx
        .select({ id: students.id })
        .from(students)
        .where(and(eq(students.id, input.student.existingId), eq(students.schoolId, ctx.schoolId), isNull(students.deletedAt)))
        .limit(1);
      if (!a) throw new BusinessError("Aluno não encontrado.", "studentId");
      studentId = a.id;
    } else {
      studentId = await createStudent(ctx, input.student.newStudent, tx);
    }

    const [category] = await tx
      .select()
      .from(categories)
      .where(and(eq(categories.id, input.categoryId), eq(categories.schoolId, ctx.schoolId), eq(categories.active, true)))
      .limit(1);
    if (!category) throw new BusinessError("Categoria inválida ou inativa.", "categoryId");
    if (input.discountCents > category.priceCents) {
      throw new BusinessError("O desconto não pode ser maior que o preço da categoria.", "discount");
    }
    const dueCents = category.priceCents - input.discountCents;

    const [created] = await tx
      .insert(enrollments)
      .values({
        schoolId: ctx.schoolId,
        studentId,
        categoryId: category.id,
        totalPriceCents: category.priceCents, // preço congelado
        discountCents: input.discountCents,
        discountReason: input.discountCents > 0 ? input.discountReason : null,
        enrollmentDate: input.enrollmentDate,
        firstLessonDate: input.firstLessonDate,
        inatroStatus: input.inatroStatus,
        inatroProcessNumber: input.inatroStatus === "registado" ? input.inatroProcessNumber : null,
        inatroNote: input.inatroNote,
        inatroLastAttempt: input.inatroStatus === "nao_registado" ? null : new Date(),
        createdBy: ctx.userId,
      })
      .returning({ id: enrollments.id });

    await logHistory(tx, ctx, "inscricao", created.id, "criou", {
      studentId,
      category: category.code,
      priceCents: category.priceCents,
      discountCents: input.discountCents || undefined,
      discountReason: input.discountCents > 0 ? (input.discountReason ?? undefined) : undefined,
      enrollmentDate: input.enrollmentDate,
      firstLessonDate: input.firstLessonDate,
      inatroStatus: input.inatroStatus,
    });

    if (input.firstPayment) {
      const error = validateNewPayment(dueCents, 0, input.firstPayment.amountCents);
      if (error) throw new BusinessError(error, "firstPayment");
      const [p] = await tx
        .insert(payments)
        .values({
          schoolId: ctx.schoolId,
          enrollmentId: created.id,
          amountCents: input.firstPayment.amountCents,
          method: input.firstPayment.method,
          reference: input.firstPayment.reference,
          recordedBy: ctx.userId,
        })
        .returning({ id: payments.id });
      await logHistory(tx, ctx, "pagamento", p.id, "registou", {
        enrollmentId: created.id,
        amountCents: input.firstPayment.amountCents,
        method: input.firstPayment.method,
        reference: input.firstPayment.reference,
      });
    }

    return { enrollmentId: created.id, studentId };
  });
}

/** Muda o estado no INATRO (inclui "manter pendente", que regista nova tentativa). */
export async function updateInatro(
  ctx: Ctx,
  { enrollmentId, status, processNumber, note }: { enrollmentId: string; status: InatroStatus; processNumber: string | null; note: string | null },
) {
  const error = validateInatroStatus(status, processNumber);
  if (error) throw new BusinessError(error, "processNumber");

  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ status: enrollments.inatroStatus, note: enrollments.inatroNote })
      .from(enrollments)
      .where(and(eq(enrollments.id, enrollmentId), inSchool(ctx)))
      .for("update")
      .limit(1);
    if (!current) throw new BusinessError("Inscrição não encontrada.");

    await tx
      .update(enrollments)
      .set({
        inatroStatus: status,
        inatroProcessNumber: status === "registado" ? processNumber : null,
        inatroNote: note ?? current.note,
        inatroLastAttempt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.schoolId, ctx.schoolId)));

    await logHistory(
      tx,
      ctx,
      "inscricao",
      enrollmentId,
      current.status === status ? "nova_tentativa_inatro" : "alterou_estado_inatro",
      { from: current.status, to: status, processNumber: status === "registado" ? processNumber : undefined, note: note ?? undefined },
    );
  });
}

/** Corrige as datas. Mudar a primeira aula volta a contar o aviso do exame teórico. */
export async function updateEnrollmentDates(
  ctx: Ctx,
  { enrollmentId, enrollmentDate, firstLessonDate }: { enrollmentId: string; enrollmentDate: string; firstLessonDate: string | null },
) {
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ enrollmentDate: enrollments.enrollmentDate, firstLessonDate: enrollments.firstLessonDate })
      .from(enrollments)
      .where(and(eq(enrollments.id, enrollmentId), inSchool(ctx)))
      .for("update")
      .limit(1);
    if (!current) throw new BusinessError("Inscrição não encontrada.");
    if (current.enrollmentDate === enrollmentDate && current.firstLessonDate === firstLessonDate) return;

    const firstLessonChanged = current.firstLessonDate !== firstLessonDate;
    await tx
      .update(enrollments)
      .set({
        enrollmentDate,
        firstLessonDate,
        updatedAt: new Date(),
        ...(firstLessonChanged ? { examNoticeSeenAt: null, examNoticeSeenBy: null } : {}),
      })
      .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.schoolId, ctx.schoolId)));
    await logHistory(tx, ctx, "inscricao", enrollmentId, "alterou_datas_inscricao", {
      enrollmentDate: { from: current.enrollmentDate, to: enrollmentDate },
      firstLessonDate: { from: current.firstLessonDate, to: firstLessonDate },
    });
  });
}

export async function updateStudentStatus(ctx: Ctx, enrollmentId: string, status: StudentStatus) {
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ status: enrollments.studentStatus })
      .from(enrollments)
      .where(and(eq(enrollments.id, enrollmentId), inSchool(ctx)))
      .limit(1);
    if (!current) throw new BusinessError("Inscrição não encontrada.");
    if (current.status === status) return;
    await tx
      .update(enrollments)
      .set({ studentStatus: status, updatedAt: new Date() })
      .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.schoolId, ctx.schoolId)));
    await logHistory(tx, ctx, "inscricao", enrollmentId, "alterou_estado_aluno", { from: current.status, to: status });
  });
}

/**
 * Aplica ou altera o desconto de uma inscrição (gestor/admin). O valor a pagar
 * nunca pode ficar abaixo do que já foi pago.
 */
export async function updateDiscount(
  ctx: Ctx,
  { enrollmentId, discountCents, reason }: { enrollmentId: string; discountCents: number; reason: string | null },
) {
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ price: enrollments.totalPriceCents, discount: enrollments.discountCents, reason: enrollments.discountReason })
      .from(enrollments)
      .where(and(eq(enrollments.id, enrollmentId), inSchool(ctx)))
      .for("update")
      .limit(1);
    if (!current) throw new BusinessError("Inscrição não encontrada.");
    if (discountCents > current.price) {
      throw new BusinessError("O desconto não pode ser maior que o preço da inscrição.", "discount");
    }

    const [{ paid }] = await tx
      .select({ paid: sql<number>`coalesce(sum(${payments.amountCents}), 0)`.mapWith(Number) })
      .from(payments)
      .where(and(eq(payments.enrollmentId, enrollmentId), isNull(payments.voidedAt)));
    if (current.price - discountCents < paid) {
      throw new BusinessError("Com este desconto o valor a pagar fica abaixo do que o aluno já pagou.", "discount");
    }
    if (current.discount === discountCents && (current.reason ?? null) === reason) return;

    await tx
      .update(enrollments)
      .set({ discountCents, discountReason: discountCents > 0 ? reason : null, updatedAt: new Date() })
      .where(and(eq(enrollments.id, enrollmentId), eq(enrollments.schoolId, ctx.schoolId)));
    await logHistory(tx, ctx, "inscricao", enrollmentId, "alterou_desconto", {
      from: current.discount,
      to: discountCents,
      reason: reason ?? undefined,
    });
  });
}

/** Notificação: alunos ainda não registados no INATRO (não registado ou pendente), mais antigos primeiro. */
export async function getInatroNotice(ctx: Pick<Ctx, "schoolId">, limit = 6) {
  const where = and(
    eq(enrollments.schoolId, ctx.schoolId),
    isNull(enrollments.deletedAt),
    isNull(students.deletedAt),
    ne(enrollments.inatroStatus, "registado"),
    ne(enrollments.studentStatus, "desistiu"),
  );
  const [{ total }] = await db
    .select({ total: count() })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(where);
  const rows = total
    ? await db
        .select({
          id: enrollments.id,
          student: students.fullName,
          category: categories.name,
          inatroStatus: enrollments.inatroStatus,
          enrollmentDate: enrollments.enrollmentDate,
        })
        .from(enrollments)
        .innerJoin(students, eq(students.id, enrollments.studentId))
        .innerJoin(categories, eq(categories.id, enrollments.categoryId))
        .where(where)
        .orderBy(asc(enrollments.enrollmentDate), asc(enrollments.createdAt))
        .limit(limit)
    : [];
  return { total, rows };
}
