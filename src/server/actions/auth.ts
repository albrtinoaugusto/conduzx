"use server";

import { redirect } from "next/navigation";
import { iniciarSessao, terminarSessao } from "@/server/auth/sessao";
import type { EstadoForm } from "@/server/erros";
import { autenticar } from "@/server/services/utilizadores";
import { errosZod, formParaObjeto, loginSchema } from "@/server/validation/esquemas";
import { erroParaEstado, invalido } from "./util";

export async function entrarAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const r = loginSchema.safeParse(formParaObjeto(fd));
  if (!r.success) return invalido(errosZod(r.error));

  try {
    const uid = await autenticar(r.data.email, r.data.password);
    if (!uid) return { erro: "Email ou palavra-passe incorretos.", t: Date.now() };
    iniciarSessao(uid);
  } catch (e) {
    return erroParaEstado(e);
  }
  redirect("/");
}

export async function sairAction() {
  terminarSessao();
  redirect("/login");
}
