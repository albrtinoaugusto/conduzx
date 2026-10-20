"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirContexto } from "@/server/auth/sessao";
import type { EstadoForm } from "@/server/erros";
import {
  atualizarEstadoAluno,
  atualizarInatro,
  criarInscricao,
} from "@/server/services/inscricoes";
import { anularPagamento, registarPagamento } from "@/server/services/pagamentos";
import {
  alunoSchema,
  anulacaoSchema,
  errosZod,
  estadoAlunoSchema,
  formParaObjeto,
  inatroSchema,
  inscricaoSchema,
  pagamentoSchema,
} from "@/server/validation/esquemas";
import { erroParaEstado, invalido, sucesso } from "./util";

function revalidarTudo(inscricaoId?: string) {
  revalidatePath("/", "layout");
  if (inscricaoId) revalidatePath(`/inscricoes/${inscricaoId}`);
}

export async function criarInscricaoAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const ctx = await exigirContexto("operar");
  const obj = formParaObjeto(fd);
  const r = inscricaoSchema.safeParse(obj);
  const rAluno = obj.modoAluno === "novo" ? alunoSchema.safeParse(obj) : null;

  const campos = {
    ...(r.success ? {} : errosZod(r.error)),
    ...(rAluno && !rAluno.success ? errosZod(rAluno.error) : {}),
  };
  if (!r.success || (rAluno && !rAluno.success)) return invalido(campos);

  const d = r.data;
  let inscricaoId: string;
  try {
    const res = await criarInscricao(ctx, {
      aluno: rAluno?.success ? { novo: rAluno.data } : { existenteId: d.alunoId! },
      categoriaId: d.categoriaId,
      estadoInatro: d.estadoInatro,
      inatroNumeroProcesso: d.inatroNumeroProcesso,
      inatroNota: d.inatroNota,
      primeiroPagamento: d.primeiroPagamento
        ? { valorCentavos: d.primeiroPagamento, metodo: d.metodo, referencia: d.referencia }
        : null,
    });
    inscricaoId = res.inscricaoId;
  } catch (e) {
    return erroParaEstado(e);
  }
  revalidarTudo();
  redirect(`/inscricoes/${inscricaoId}?criada=1`);
}

export async function registarPagamentoAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const ctx = await exigirContexto("operar");
  const r = pagamentoSchema.safeParse(formParaObjeto(fd));
  if (!r.success) return invalido(errosZod(r.error));
  try {
    await registarPagamento(ctx, {
      inscricaoId: r.data.inscricaoId,
      valorCentavos: r.data.valor!,
      metodo: r.data.metodo,
      referencia: r.data.referencia,
    });
  } catch (e) {
    return erroParaEstado(e);
  }
  revalidarTudo(r.data.inscricaoId);
  return sucesso("Pagamento registado.");
}

export async function anularPagamentoAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const ctx = await exigirContexto("anular_pagamento");
  const r = anulacaoSchema.safeParse(formParaObjeto(fd));
  if (!r.success) return invalido(errosZod(r.error));
  let inscricaoId: string;
  try {
    inscricaoId = await anularPagamento(ctx, r.data);
  } catch (e) {
    return erroParaEstado(e);
  }
  revalidarTudo(inscricaoId);
  return sucesso("Pagamento anulado.");
}

export async function atualizarInatroAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const ctx = await exigirContexto("operar");
  const r = inatroSchema.safeParse(formParaObjeto(fd));
  if (!r.success) return invalido(errosZod(r.error));
  try {
    await atualizarInatro(ctx, {
      inscricaoId: r.data.inscricaoId,
      estado: r.data.estado,
      numeroProcesso: r.data.numeroProcesso,
      nota: r.data.nota,
    });
  } catch (e) {
    return erroParaEstado(e);
  }
  revalidarTudo(r.data.inscricaoId);
  return sucesso(r.data.estado === "registado" ? "Marcado como registado no INATRO." : "Estado do INATRO atualizado.");
}

export async function atualizarEstadoAlunoAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const ctx = await exigirContexto("operar");
  const r = estadoAlunoSchema.safeParse(formParaObjeto(fd));
  if (!r.success) return invalido(errosZod(r.error));
  try {
    await atualizarEstadoAluno(ctx, r.data.inscricaoId, r.data.estado);
  } catch (e) {
    return erroParaEstado(e);
  }
  revalidarTudo(r.data.inscricaoId);
  return sucesso("Estado do aluno atualizado.");
}
