"use server";

import { revalidatePath } from "next/cache";
import { requireContext } from "@/server/auth/session";
import type { FormState } from "@/server/errors";
import { grantPracticeAccess, voidPracticeAccess } from "@/server/services/practice-access";
import { formToObject, grantPracticeAccessSchema, voidPracticeAccessSchema, zodErrors } from "@/server/validation/schemas";
import { errorToState, invalid, success } from "./util";

export async function grantPracticeAccessAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("operate");
  const r = grantPracticeAccessSchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));
  try {
    await grantPracticeAccess(ctx, {
      studentId: r.data.studentId,
      amountCents: r.data.amount!,
      method: r.data.method,
      reference: r.data.reference,
    });
  } catch (e) {
    return errorToState(e);
  }
  revalidatePath(`/alunos/${r.data.studentId}`);
  return success("Acesso aos testes ativado.");
}

export async function voidPracticeAccessAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("void_payment");
  const r = voidPracticeAccessSchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));
  try {
    await voidPracticeAccess(ctx, r.data);
  } catch (e) {
    return errorToState(e);
  }
  revalidatePath(`/alunos/${r.data.studentId}`);
  return success("Acesso anulado.");
}
