"use server";

import { revalidatePath } from "next/cache";
import { exigirContexto } from "@/server/auth/sessao";
import type { EstadoForm } from "@/server/erros";
import { atualizarCategoria, criarCategoria } from "@/server/services/categorias";
import { atualizarUtilizador, criarUtilizador } from "@/server/services/utilizadores";
import {
  atualizarUtilizadorSchema,
  categoriaSchema,
  errosZod,
  formParaObjeto,
  utilizadorSchema,
} from "@/server/validation/esquemas";
import { erroParaEstado, invalido, sucesso } from "./util";

export async function guardarCategoriaAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const ctx = await exigirContexto("gerir_categorias");
  const id = String(fd.get("categoriaId") ?? "");
  const r = categoriaSchema.safeParse(formParaObjeto(fd));
  if (!r.success) return invalido(errosZod(r.error));
  try {
    if (id) await atualizarCategoria(ctx, id, r.data);
    else await criarCategoria(ctx, r.data);
  } catch (e) {
    return erroParaEstado(e);
  }
  revalidatePath("/categorias");
  return sucesso(id ? "Categoria atualizada." : "Categoria criada.");
}

export async function criarUtilizadorAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const ctx = await exigirContexto("gerir_utilizadores");
  const r = utilizadorSchema.safeParse(formParaObjeto(fd));
  if (!r.success) return invalido(errosZod(r.error));
  try {
    await criarUtilizador(ctx, r.data);
  } catch (e) {
    return erroParaEstado(e);
  }
  revalidatePath("/utilizadores");
  return sucesso("Utilizador criado.");
}

export async function atualizarUtilizadorAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const ctx = await exigirContexto("gerir_utilizadores");
  const r = atualizarUtilizadorSchema.safeParse(formParaObjeto(fd));
  if (!r.success) return invalido(errosZod(r.error));
  try {
    await atualizarUtilizador(ctx, r.data);
  } catch (e) {
    return erroParaEstado(e);
  }
  revalidatePath("/utilizadores");
  return sucesso("Utilizador atualizado.");
}
