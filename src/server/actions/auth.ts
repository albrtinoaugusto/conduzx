"use server";

import { redirect } from "next/navigation";
import { startSession, endSession } from "@/server/auth/session";
import type { FormState } from "@/server/errors";
import { authenticate } from "@/server/services/users";
import { zodErrors, formToObject, loginSchema } from "@/server/validation/schemas";
import { errorToState, invalid } from "./util";

export async function signInAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = loginSchema.safeParse(formToObject(fd));
  if (!r.success) return invalid(zodErrors(r.error));

  try {
    const uid = await authenticate(r.data.email, r.data.password);
    if (!uid) return { error: "Email ou palavra-passe incorretos.", t: Date.now() };
    startSession(uid);
  } catch (e) {
    return errorToState(e);
  }
  redirect("/");
}

export async function signOutAction() {
  endSession();
  redirect("/login");
}
