import "server-only";
import { and, asc, count, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { categories, enrollments, students } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/session";
import { THEORY_EXAM_DAYS, addDays, todayInMaputo } from "@/server/domain/theory-exam";
import { logHistory } from "./history";

const activeInSchool = (schoolId: string) =>
  and(
    eq(enrollments.schoolId, schoolId),
    isNull(enrollments.deletedAt),
    isNull(students.deletedAt),
    eq(enrollments.studentStatus, "ativo"),
  );

const readyCondition = () => sql`${enrollments.firstLessonDate} + ${THEORY_EXAM_DAYS}::int <= ${todayInMaputo()}::date`;

/** Alunos que completaram os 45 dias e cujo aviso ainda ninguém confirmou (popup). */
export async function getExamNotice(ctx: Pick<Ctx, "schoolId">) {
  const where = and(activeInSchool(ctx.schoolId), isNull(enrollments.examNoticeSeenAt), readyCondition());
  const [{ total }] = await db
    .select({ total: count() })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .where(where);
  if (total === 0) return { total, rows: [] };

  const rows = await db
    .select({
      id: enrollments.id,
      student: students.fullName,
      category: categories.name,
      firstLessonDate: enrollments.firstLessonDate,
    })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(categories, eq(categories.id, enrollments.categoryId))
    .where(where)
    .orderBy(asc(enrollments.firstLessonDate))
    .limit(50);
  return {
    total,
    rows: rows.map(({ firstLessonDate, ...r }) => ({ ...r, readyDate: addDays(firstLessonDate!, THEORY_EXAM_DAYS) })),
  };
}

/** Inscrições ativas, com e sem data de primeira aula, para a página do exame teórico. */
export async function listExamTracking(ctx: Ctx) {
  return db
    .select({
      id: enrollments.id,
      studentId: students.id,
      student: students.fullName,
      phone: students.phone,
      category: categories.name,
      enrollmentDate: enrollments.enrollmentDate,
      firstLessonDate: enrollments.firstLessonDate,
      noticeSeenAt: enrollments.examNoticeSeenAt,
    })
    .from(enrollments)
    .innerJoin(students, eq(students.id, enrollments.studentId))
    .innerJoin(categories, eq(categories.id, enrollments.categoryId))
    .where(activeInSchool(ctx.schoolId))
    .orderBy(asc(enrollments.firstLessonDate), asc(students.fullName));
}

export async function acknowledgeExamNotice(ctx: Ctx, enrollmentIds: string[]) {
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(enrollments)
      .set({ examNoticeSeenAt: new Date(), examNoticeSeenBy: ctx.userId })
      .where(
        and(
          eq(enrollments.schoolId, ctx.schoolId),
          inArray(enrollments.id, enrollmentIds),
          isNull(enrollments.examNoticeSeenAt),
          isNotNull(enrollments.firstLessonDate),
          readyCondition(),
        ),
      )
      .returning({ id: enrollments.id });
    for (const { id } of updated) {
      await logHistory(tx, ctx, "inscricao", id, "confirmou_aviso_exame");
    }
  });
}
