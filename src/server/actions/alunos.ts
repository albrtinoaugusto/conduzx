"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirContexto } from "@/server/auth/sessao";
import type { EstadoForm } from "@/server/erros";
import { atualizarAluno, criarAluno, pesquisarAlunos } from "@/server/services/alunos";
import { alunoSchema, errosZod, formParaObjeto } from "@/server/validation/esquemas";
import { erroParaEstado, invalido } from "./util";

export async function criarAlunoAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const ctx = await exigirContexto("operar");
  const r = alunoSchema.safeParse(formParaObjeto(fd));
  if (!r.success) return invalido(errosZod(r.error));

  let id: string;
  try {
    id = await criarAluno(ctx, r.data);
  } catch (e) {
    return erroParaEstado(e);
  }
  revalidatePath("/alunos");
  redirect(`/alunos/${id}?criado=1`);
}

export async function atualizarAlunoAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const ctx = await exigirContexto("operar");
  const id = String(fd.get("alunoId") ?? "");
  const r = alunoSchema.safeParse(formParaObjeto(fd));
  if (!r.success) return invalido(errosZod(r.error));

  try {
    await atualizarAluno(ctx, id, r.data);
  } catch (e) {
    return erroParaEstado(e);
  }
  revalidatePath(`/alunos/${id}`);
  redirect(`/alunos/${id}?atualizado=1`);
}

/** Pesquisa usada pelo seletor de aluno na nova inscrição. */
export async function pesquisarAlunosAction(q: string) {
  const ctx = await exigirContexto("operar");
  return pesquisarAlunos(ctx, String(q).slice(0, 80));
}
