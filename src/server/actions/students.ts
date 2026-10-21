"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireContext } from "@/server/auth/session";
import type { FormState } from "@/server/errors";
import { updateStudent, createStudent, searchStudents } from "@/server/services/students";
import { studentSchema, zodErrors, formToObject } from "@/server/validation/schemas";
import { errorToState, invalid } from "./util";

export async function createStudentAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("operate");
  const r = studentSchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));

  let id: string;
  try {
    id = await createStudent(ctx, r.data);
  } catch (e) {
    return errorToState(e);
  }
  revalidatePath("/alunos");
  redirect(`/alunos/${id}?created=1`);
}

export async function updateStudentAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("operate");
  const id = String(fd.get("studentId") ?? "");
  const r = studentSchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));

  try {
    await updateStudent(ctx, id, r.data);
  } catch (e) {
    return errorToState(e);
  }
  revalidatePath(`/alunos/${id}`);
  redirect(`/alunos/${id}?updated=1`);
}

/** Pesquisa usada pelo seletor de aluno na nova inscrição. */
export async function searchStudentsAction(q: string) {
  const ctx = await requireContext("operate");
  return searchStudents(ctx, String(q).slice(0, 80));
}
