import "server-only";
import { and, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { practiceAccess, practiceAttempts, practiceQuestions } from "@/server/db/schema";
import type { StudentCtx } from "@/server/auth/student-session";
import {
  EXAM_DURATION_S,
  EXAM_GRACE_S,
  EXAM_QUESTIONS,
  gradeExam,
  sanitizeAnswers,
} from "@/server/domain/practice-exam";
import { BusinessError } from "@/server/errors";

const mine = (s: StudentCtx) =>
  and(eq(practiceAttempts.schoolId, s.schoolId), eq(practiceAttempts.studentId, s.studentId));

const pastGrace = (expiresAt: Date) => Date.now() > expiresAt.getTime() + EXAM_GRACE_S * 1000;

async function loadQuestions(ids: string[]) {
  const rows = await db.select().from(practiceQuestions).where(inArray(practiceQuestions.id, ids));
  const byId = new Map(rows.map((q) => [q.id, q]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

const forSanitize = (qs: Awaited<ReturnType<typeof loadQuestions>>) =>
  qs.map((q) => ({ id: q.id, optionCount: q.options.length }));

export async function hasPracticeAccess(s: StudentCtx) {
  const [row] = await db
    .select({ id: practiceAccess.id })
    .from(practiceAccess)
    .where(and(eq(practiceAccess.schoolId, s.schoolId), eq(practiceAccess.studentId, s.studentId), isNull(practiceAccess.voidedAt)))
    .limit(1);
  return Boolean(row);
}

export async function getPracticeHome(s: StudentCtx) {
  const [access, attempts, [{ available }]] = await Promise.all([
    hasPracticeAccess(s),
    db
      .select({
        id: practiceAttempts.id,
        finishedAt: practiceAttempts.finishedAt,
        expiresAt: practiceAttempts.expiresAt,
        correct: practiceAttempts.correctCount,
        wrong: practiceAttempts.wrongCount,
        passed: practiceAttempts.passed,
      })
      .from(practiceAttempts)
      .where(mine(s))
      .orderBy(desc(practiceAttempts.startedAt))
      .limit(10),
    db.select({ available: count() }).from(practiceQuestions).where(eq(practiceQuestions.active, true)),
  ]);
  const open = attempts.find((a) => !a.finishedAt && !pastGrace(a.expiresAt)) ?? null;
  return { access, open, finished: attempts.filter((a) => a.finishedAt), bankReady: available >= EXAM_QUESTIONS };
}

/** Fecha um teste com as respostas enviadas (ou, fora de tempo, só com as já guardadas). */
export async function finishAttempt(s: StudentCtx, attemptId: string, submitted: unknown) {
  return db.transaction(async (tx) => {
    const [attempt] = await tx
      .select()
      .from(practiceAttempts)
      .where(and(eq(practiceAttempts.id, attemptId), mine(s)))
      .for("update")
      .limit(1);
    if (!attempt) throw new BusinessError("Teste não encontrado.");
    if (attempt.finishedAt) return;

    const questions = await loadQuestions(attempt.questionIds);
    const answers = pastGrace(attempt.expiresAt)
      ? attempt.answers
      : { ...attempt.answers, ...sanitizeAnswers(submitted, forSanitize(questions)) };
    const result = gradeExam(questions, answers);

    await tx
      .update(practiceAttempts)
      .set({ answers, finishedAt: new Date(), correctCount: result.correct, wrongCount: result.wrong, passed: result.passed })
      .where(eq(practiceAttempts.id, attemptId));
  });
}

/** Começa um teste novo, ou devolve o que já está a decorrer. */
export async function startAttempt(s: StudentCtx) {
  if (!(await hasPracticeAccess(s))) {
    throw new BusinessError("Ainda não tem acesso aos testes. Fale com a secretaria da sua escola.");
  }

  const [open] = await db
    .select({ id: practiceAttempts.id, expiresAt: practiceAttempts.expiresAt })
    .from(practiceAttempts)
    .where(and(mine(s), isNull(practiceAttempts.finishedAt)))
    .limit(1);
  if (open) {
    if (!pastGrace(open.expiresAt)) return open.id;
    await finishAttempt(s, open.id, null);
  }

  const picked = await db
    .select({ id: practiceQuestions.id })
    .from(practiceQuestions)
    .where(eq(practiceQuestions.active, true))
    .orderBy(sql`random()`)
    .limit(EXAM_QUESTIONS);
  if (picked.length < EXAM_QUESTIONS) {
    throw new BusinessError("Os testes ainda não estão disponíveis. Tente novamente mais tarde.");
  }

  // Dois toques seguidos em "Iniciar" não criam dois testes (índice único de teste aberto)
  const [created] = await db
    .insert(practiceAttempts)
    .values({
      schoolId: s.schoolId,
      studentId: s.studentId,
      questionIds: picked.map((q) => q.id),
      expiresAt: new Date(Date.now() + EXAM_DURATION_S * 1000),
    })
    .onConflictDoNothing()
    .returning({ id: practiceAttempts.id });
  if (created) return created.id;

  const [existing] = await db
    .select({ id: practiceAttempts.id })
    .from(practiceAttempts)
    .where(and(mine(s), isNull(practiceAttempts.finishedAt)))
    .limit(1);
  if (!existing) throw new BusinessError("Não foi possível iniciar o teste. Tente novamente.");
  return existing.id;
}

export async function saveAnswers(s: StudentCtx, attemptId: string, submitted: unknown) {
  const [attempt] = await db
    .select({ questionIds: practiceAttempts.questionIds, expiresAt: practiceAttempts.expiresAt, finishedAt: practiceAttempts.finishedAt })
    .from(practiceAttempts)
    .where(and(eq(practiceAttempts.id, attemptId), mine(s)))
    .limit(1);
  if (!attempt || attempt.finishedAt || pastGrace(attempt.expiresAt)) return;
  const answers = sanitizeAnswers(submitted, forSanitize(await loadQuestions(attempt.questionIds)));
  await db
    .update(practiceAttempts)
    .set({ answers })
    .where(and(eq(practiceAttempts.id, attemptId), mine(s), isNull(practiceAttempts.finishedAt)));
}

/** O que a página do teste pode ver. A resposta certa nunca sai do servidor. */
export async function getAttemptView(s: StudentCtx, attemptId: string) {
  const load = () =>
    db
      .select()
      .from(practiceAttempts)
      .where(and(eq(practiceAttempts.id, attemptId), mine(s)))
      .limit(1);

  let [attempt] = await load();
  if (!attempt) return null;
  if (!attempt.finishedAt && pastGrace(attempt.expiresAt)) {
    await finishAttempt(s, attempt.id, null);
    [attempt] = await load();
  }

  if (attempt.finishedAt) {
    return {
      status: "finished" as const,
      correct: attempt.correctCount ?? 0,
      wrong: attempt.wrongCount ?? 0,
      passed: attempt.passed ?? false,
    };
  }

  const questions = await loadQuestions(attempt.questionIds);
  return {
    status: "open" as const,
    remainingMs: Math.max(attempt.expiresAt.getTime() - Date.now(), 0),
    answers: attempt.answers,
    questions: questions.map((q) => ({ id: q.id, text: q.text, imageUrl: q.imageUrl, options: q.options })),
  };
}

export type ExamQuestion = Extract<Awaited<ReturnType<typeof getAttemptView>>, { status: "open" }>["questions"][number];
