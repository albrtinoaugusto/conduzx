"use server";

import { revalidatePath } from "next/cache";
import { requireContext } from "@/server/auth/session";
import type { FormState } from "@/server/errors";
import { updateCategory, createCategory } from "@/server/services/categories";
import { updateUser, createUser } from "@/server/services/users";
import {
  updateUserSchema,
  categorySchema,
  zodErrors,
  formToObject,
  userSchema,
} from "@/server/validation/schemas";
import { errorToState, invalid, success } from "./util";

export async function saveCategoryAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("manage_categories");
  const id = String(fd.get("categoryId") ?? "");
  const r = categorySchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));
  try {
    if (id) await updateCategory(ctx, id, r.data);
    else await createCategory(ctx, r.data);
  } catch (e) {
    return errorToState(e);
  }
  revalidatePath("/categorias");
  return success(id ? "Categoria atualizada." : "Categoria criada.");
}

export async function createUserAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("manage_users");
  const r = userSchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));
  try {
    await createUser(ctx, r.data);
  } catch (e) {
    return errorToState(e);
  }
  revalidatePath("/utilizadores");
  return success("Utilizador criado.");
}

export async function updateUserAction(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await requireContext("manage_users");
  const r = updateUserSchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));
  try {
    await updateUser(ctx, r.data);
  } catch (e) {
    return errorToState(e);
  }
  revalidatePath("/utilizadores");
  return success("Utilizador atualizado.");
}
