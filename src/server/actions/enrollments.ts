"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireContext } from "@/server/auth/session";
import type { FormState } from "@/server/errors";
import {
  updateStudentStatus,
  updateInatro,
  createEnrollment,
} from "@/server/services/enrollments";
import { voidPayment, recordPayment } from "@/server/services/payments";
import {
  studentSchema,
  voidSchema,
  zodErrors,
  studentStatusSchema,
  formToObject,
  inatroSchema,
  enrollmentSchema,
  paymentSchema,
} from "@/server/validation/schemas";
import { errorToState, invalid, success } from "./util";

function revalidateAll(enrollmentId?: string) {
  revalidatePath("/", "layout");
  if (enrollmentId) revalidatePath(`/inscricoes/${enrollmentId}`);
}

export async function createEnrollmentAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("operate");
  const obj = formToObject(fd);
  const r = enrollmentSchema.safeParse(obj);
  const studentResult = obj.studentMode === "novo" ? studentSchema.safeParse(obj) : null;

  const fields = {
    ...(r.success ? {} : zodErrors(r.error)),
    ...(studentResult && !studentResult.success ? zodErrors(studentResult.error) : {}),
  };
  if (!r.success || (studentResult && !studentResult.success)) return invalid(fields);

  const d = r.data;
  let enrollmentId: string;
  try {
    const res = await createEnrollment(ctx, {
      student: studentResult?.success ? { newStudent: studentResult.data } : { existingId: d.studentId! },
      categoryId: d.categoryId,
      inatroStatus: d.inatroStatus,
      inatroProcessNumber: d.inatroProcessNumber,
      inatroNote: d.inatroNote,
      firstPayment: d.firstPayment
        ? { amountCents: d.firstPayment, method: d.method, reference: d.reference }
        : null,
    });
    enrollmentId = res.enrollmentId;
  } catch (e) {
    return errorToState(e);
  }
  revalidateAll();
  redirect(`/inscricoes/${enrollmentId}?created=1`);
}

export async function recordPaymentAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("operate");
  const r = paymentSchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));
  try {
    await recordPayment(ctx, {
      enrollmentId: r.data.enrollmentId,
      amountCents: r.data.amount!,
      method: r.data.method,
      reference: r.data.reference,
    });
  } catch (e) {
    return errorToState(e);
  }
  revalidateAll(r.data.enrollmentId);
  return success("Pagamento registado.");
}

export async function voidPaymentAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("void_payment");
  const r = voidSchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));
  let enrollmentId: string;
  try {
    enrollmentId = await voidPayment(ctx, r.data);
  } catch (e) {
    return errorToState(e);
  }
  revalidateAll(enrollmentId);
  return success("Pagamento anulado.");
}

export async function updateInatroAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("operate");
  const r = inatroSchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));
  try {
    await updateInatro(ctx, {
      enrollmentId: r.data.enrollmentId,
      status: r.data.status,
      processNumber: r.data.processNumber,
      note: r.data.note,
    });
  } catch (e) {
    return errorToState(e);
  }
  revalidateAll(r.data.enrollmentId);
  return success(r.data.status === "registado" ? "Marcado como registado no INATRO." : "Estado do INATRO atualizado.");
}

export async function updateStudentStatusAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("operate");
  const r = studentStatusSchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));
  try {
    await updateStudentStatus(ctx, r.data.enrollmentId, r.data.status);
  } catch (e) {
    return errorToState(e);
  }
  revalidateAll(r.data.enrollmentId);
  return success("Estado do aluno atualizado.");
}
