"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireContext } from "@/server/auth/session";
import type { FormState } from "@/server/errors";
import { updateEnrollmentDates } from "@/server/services/enrollments";
import { updateStudent, createStudent, searchStudents } from "@/server/services/students";
import { enrollmentDatesSchema, studentSchema, zodErrors, formToObject } from "@/server/validation/schemas";
import { readStudentFiles, saveStudentFiles } from "./student-files";
import { errorToState, invalid } from "./util";

export async function createStudentAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("operate");
  const r = studentSchema.safeParse(formToObject(fd));
  const docs = await readStudentFiles(fd);
  const fields = { ...(r.success ? {} : zodErrors(r.error)), ...docs.fields };
  if (!r.success || Object.keys(docs.fields).length) return invalid(fields);

  let id: string;
  try {
    id = await createStudent(ctx, r.data);
  } catch (e) {
    return errorToState(e);
  }
  const docsOk = await saveStudentFiles(ctx, id, docs.files);
  revalidatePath("/alunos");
  redirect(`/alunos/${id}?created=1${docsOk ? "" : "&docs=falhou"}`);
}

/**
 * "Editar dados": dados pessoais, foto tipo passe, BI e as datas de cada inscrição,
 * tudo no mesmo formulário.
 */
export async function updateStudentAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("operate");
  const id = String(fd.get("studentId") ?? "");
  const r = studentSchema.safeParse(formToObject(fd));
  const docs = await readStudentFiles(fd);

  // Datas das inscrições: campos "enrollmentDate__<id>" e "firstLessonDate__<id>"
  const enrollmentIds = fd.getAll("enrollmentIds").map(String).filter((v) => z.string().uuid().safeParse(v).success);
  const dateFields: Record<string, string> = {};
  const dates: Array<z.output<typeof enrollmentDatesSchema>> = [];
  for (const enrollmentId of enrollmentIds) {
    const d = enrollmentDatesSchema.safeParse({
      enrollmentId,
      enrollmentDate: String(fd.get(`enrollmentDate__${enrollmentId}`) ?? ""),
      firstLessonDate: String(fd.get(`firstLessonDate__${enrollmentId}`) ?? ""),
    });
    if (d.success) dates.push(d.data);
    else for (const [k, msg] of Object.entries(zodErrors(d.error))) dateFields[`${k}__${enrollmentId}`] = msg;
  }

  const fields = { ...(r.success ? {} : zodErrors(r.error)), ...docs.fields, ...dateFields };
  if (!r.success || Object.keys(fields).length) return invalid(fields);

  try {
    await updateStudent(ctx, id, r.data);
    for (const d of dates) await updateEnrollmentDates(ctx, d);
  } catch (e) {
    return errorToState(e);
  }
  const docsOk = await saveStudentFiles(ctx, id, docs.files);
  revalidatePath("/", "layout");
  redirect(`/alunos/${id}?updated=1${docsOk ? "" : "&docs=falhou"}`);
}

/** Pesquisa usada pelo seletor de aluno na nova inscrição. */
export async function searchStudentsAction(q: string) {
  const ctx = await requireContext("operate");
  return searchStudents(ctx, String(q).slice(0, 80));
}
