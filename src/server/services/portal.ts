import "server-only";
import { createHash } from "node:crypto";
import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  categories,
  enrollmentFinancials,
  enrollments,
  schools,
  studentLoginAttempts,
  students,
} from "@/server/db/schema";
import type { StudentCtx } from "@/server/auth/student-session";
import { parseStudentIdentifier } from "@/server/domain/practice-exam";
import { BusinessError } from "@/server/errors";

const MAX_FAILURES = 5;
const LOCK_MINUTES = 15;

/** Só id e nome: é a única informação da escola visível antes de entrar. */
export function listSchoolsForLogin() {
  return db.select({ id: schools.id, name: schools.name }).from(schools).where(isNull(schools.deletedAt)).orderBy(asc(schools.name));
}

async function registerFailure(key: string) {
  await db
    .insert(studentLoginAttempts)
    .values({ key, failures: 1 })
    .onConflictDoUpdate({
      target: studentLoginAttempts.key,
      set: {
        // Falhas antigas (depois do período de bloqueio) deixam de contar
        failures: sql`case
          when ${studentLoginAttempts.updatedAt} < now() - make_interval(mins => ${LOCK_MINUTES}) then 1
          when ${studentLoginAttempts.failures} + 1 >= ${MAX_FAILURES} then 0
          else ${studentLoginAttempts.failures} + 1 end`,
        blockedUntil: sql`case
          when ${studentLoginAttempts.updatedAt} >= now() - make_interval(mins => ${LOCK_MINUTES})
            and ${studentLoginAttempts.failures} + 1 >= ${MAX_FAILURES}
          then now() + make_interval(mins => ${LOCK_MINUTES})
          else ${studentLoginAttempts.blockedUntil} end`,
        updatedAt: sql`now()`,
      },
    });
}

/**
 * Entrada do aluno: escola + BI ou telefone + data de nascimento. A mensagem de
 * erro é sempre a mesma, para não revelar se o aluno existe.
 */
export async function authenticateStudent(schoolId: string, identifier: string, birthDate: string) {
  const { idNumber, phoneDigits } = parseStudentIdentifier(identifier);
  // O mesmo telefone escrito de formas diferentes conta como a mesma pessoa
  const key = createHash("sha256").update(`${schoolId}|${phoneDigits ?? idNumber}`).digest("hex");

  const [attempt] = await db
    .select({ blockedUntil: studentLoginAttempts.blockedUntil })
    .from(studentLoginAttempts)
    .where(eq(studentLoginAttempts.key, key))
    .limit(1);
  if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) {
    throw new BusinessError(`Demasiadas tentativas. Aguarde ${LOCK_MINUTES} minutos ou fale com a secretaria.`);
  }

  const matches = await db
    .select({ id: students.id })
    .from(students)
    .where(
      and(
        eq(students.schoolId, schoolId),
        isNull(students.deletedAt),
        eq(students.birthDate, birthDate),
        or(
          eq(students.idNumber, idNumber),
          phoneDigits
            ? sql`right(regexp_replace(coalesce(${students.phone}, ''), '\\D', '', 'g'), 9) = ${phoneDigits}`
            : undefined,
        ),
      ),
    )
    .limit(2);

  if (matches.length !== 1) {
    await registerFailure(key);
    throw new BusinessError(
      matches.length > 1
        ? "Este telefone está associado a mais de um aluno. Entre com o número de BI."
        : "Não encontrámos os seus dados nesta escola. Confirme-os ou fale com a secretaria.",
    );
  }

  await db.delete(studentLoginAttempts).where(eq(studentLoginAttempts.key, key));
  return matches[0].id;
}

/** Situação do próprio aluno: nunca recebe id de aluno vindo do cliente. */
export function listMyEnrollments(student: StudentCtx) {
  return db
    .select({
      id: enrollments.id,
      category: categories.name,
      code: categories.code,
      studentStatus: enrollments.studentStatus,
      inatroStatus: enrollments.inatroStatus,
      inatroProcessNumber: enrollments.inatroProcessNumber,
      enrollmentDate: enrollments.enrollmentDate,
      firstLessonDate: enrollments.firstLessonDate,
      total: enrollmentFinancials.totalPriceCents,
      paid: enrollmentFinancials.paidCents,
      paymentStatus: enrollmentFinancials.paymentStatus,
    })
    .from(enrollments)
    .innerJoin(categories, eq(categories.id, enrollments.categoryId))
    .innerJoin(enrollmentFinancials, eq(enrollmentFinancials.enrollmentId, enrollments.id))
    .where(
      and(
        eq(enrollments.schoolId, student.schoolId),
        eq(enrollments.studentId, student.studentId),
        isNull(enrollments.deletedAt),
      ),
    )
    .orderBy(desc(enrollments.createdAt));
}
