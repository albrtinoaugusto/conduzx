"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { endStudentSession, requireStudent, startStudentSession } from "@/server/auth/student-session";
import type { FormState } from "@/server/errors";
import { authenticateStudent } from "@/server/services/portal";
import { finishAttempt, saveAnswers, startAttempt } from "@/server/services/practice-exams";
import { formToObject, studentLoginSchema, zodErrors } from "@/server/validation/schemas";
import { errorToState, invalid } from "./util";

export async function studentSignInAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = studentLoginSchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));
  try {
    startStudentSession(await authenticateStudent(r.data.schoolId, r.data.identifier, r.data.birthDate));
  } catch (e) {
    return errorToState(e);
  }
  redirect("/portal");
}

export async function studentSignOutAction() {
  endStudentSession();
  redirect("/entrar");
}

export async function startExamAction(): Promise<FormState> {
  const student = await requireStudent();
  let id: string;
  try {
    id = await startAttempt(student);
  } catch (e) {
    return errorToState(e);
  }
  redirect(`/portal/testes/${id}`);
}

const attemptId = z.string().uuid();

/** Guarda em segundo plano: uma falha de rede não interrompe o teste. */
export async function saveExamAnswersAction(id: string, answers: unknown) {
  const student = await requireStudent();
  await saveAnswers(student, attemptId.parse(id), answers);
}

export async function finishExamAction(id: string, answers: unknown): Promise<FormState> {
  const student = await requireStudent();
  try {
    await finishAttempt(student, attemptId.parse(id), answers);
  } catch (e) {
    return errorToState(e);
  }
  return { ok: true, t: Date.now() };
}
