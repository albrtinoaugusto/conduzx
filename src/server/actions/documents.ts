"use server";

import { revalidatePath } from "next/cache";
import { requireContext } from "@/server/auth/session";
import type { FormState } from "@/server/errors";
import { uploadDocument } from "@/server/services/documents";
import { documentSchema, zodErrors, formToObject } from "@/server/validation/schemas";
import { errorToState, invalid, success } from "./util";

export async function uploadDocumentAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("operate");
  const r = documentSchema.safeParse({ ...formToObject(fd), file: fd.get("file") });
  if (!r.success) return invalid(zodErrors(r.error));

  const { file, ...data } = r.data;
  try {
    await uploadDocument(ctx, {
      ...data,
      fileName: file.name,
      content: new Uint8Array(await file.arrayBuffer()),
    });
  } catch (e) {
    return errorToState(e);
  }
  revalidatePath(`/alunos/${data.studentId}`);
  return success("Documento carregado.");
}
