import "server-only";
import { and, asc, count, desc, eq, ilike, isNull, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import {
  alunos,
  categorias,
  inscricoes,
  inscricoesFinanceiro,
  pagamentos,
  utilizadores,
  type EstadoAluno,
  type EstadoInatro,
  type MetodoPagamento,
} from "@/server/db/schema";
import type { Ctx } from "@/server/auth/sessao";
import { ErroNegocio } from "@/server/erros";
import { validarNovoPagamento } from "@/server/domain/financeiro";
import { validarEstadoInatro } from "@/server/domain/inatro";
import type { AlunoInput } from "@/server/validation/esquemas";
import { criarAluno } from "./alunos";
import { registarHistorico } from "./historico";

export const POR_PAGINA = 15;

const doCtx = (ctx: Ctx) => and(eq(inscricoes.escolaId, ctx.escolaId), isNull(inscricoes.eliminadoEm));

const colunasLista = {
  id: inscricoes.id,
  alunoId: alunos.id,
  aluno: alunos.nomeCompleto,
  telefone: alunos.telefone,
  categoria: categorias.nome,
  codigo: categorias.codigo,
  estadoAluno: inscricoes.estadoAluno,
  estadoInatro: inscricoes.estadoInatro,
  inatroNumeroProcesso: inscricoes.inatroNumeroProcesso,
  inatroNota: inscricoes.inatroNota,
  inatroUltimaTentativa: inscricoes.inatroUltimaTentativa,
  dataInscricao: inscricoes.dataInscricao,
  criadoEm: inscricoes.criadoEm,
  total: inscricoesFinanceiro.precoTotalCentavos,
  pago: inscricoesFinanceiro.pagoCentavos,
  saldo: inscricoesFinanceiro.saldoCentavos,
  situacao: inscricoesFinanceiro.situacaoPagamento,
};

function baseLista() {
  return db
    .select(colunasLista)
    .from(inscricoes)
    .innerJoin(alunos, eq(alunos.id, inscricoes.alunoId))
    .innerJoin(categorias, eq(categorias.id, inscricoes.categoriaId))
    .innerJoin(inscricoesFinanceiro, eq(inscricoesFinanceiro.inscricaoId, inscricoes.id));
}

export type FiltroSituacao = "sem_pagamento" | "parcial" | "pago";

export async function listarInscricoes(
  ctx: Ctx,
  { q = "", situacao, pagina = 1 }: { q?: string; situacao?: FiltroSituacao; pagina?: number },
) {
  const conds: SQL[] = [doCtx(ctx)!];
  if (situacao) conds.push(eq(inscricoesFinanceiro.situacaoPagamento, situacao));
  if (q.trim()) {
    const termo = `%${q.trim().replace(/[%_]/g, "\\$&")}%`;
    conds.push(or(ilike(alunos.nomeCompleto, termo), ilike(alunos.biNumero, termo), ilike(categorias.codigo, termo))!);
  }
  const where = and(...conds);

  const [{ total }] = await db
    .select({ total: count() })
    .from(inscricoes)
    .innerJoin(alunos, eq(alunos.id, inscricoes.alunoId))
    .innerJoin(categorias, eq(categorias.id, inscricoes.categoriaId))
    .innerJoin(inscricoesFinanceiro, eq(inscricoesFinanceiro.inscricaoId, inscricoes.id))
    .where(where);

  const linhas = await baseLista()
    .where(where)
    .orderBy(desc(inscricoes.criadoEm))
    .limit(POR_PAGINA)
    .offset((Math.max(pagina, 1) - 1) * POR_PAGINA);

  return { total, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)), linhas };
}

/** Pendências do INATRO: tudo o que ainda não está registado, mais antigo primeiro. */
export async function listarPendencias(ctx: Ctx, filtro: "pendente" | "nao_registado" | "todos" = "todos") {
  const conds: SQL[] = [doCtx(ctx)!, ne(inscricoes.estadoAluno, "desistiu")];
  conds.push(filtro === "todos" ? ne(inscricoes.estadoInatro, "registado") : eq(inscricoes.estadoInatro, filtro));
  return baseLista()
    .where(and(...conds))
    .orderBy(asc(inscricoes.criadoEm));
}

export async function obterInscricao(ctx: Ctx, id: string) {
  const [linha] = await db
    .select({
      ...colunasLista,
      biNumero: alunos.biNumero,
      percentagem: inscricoesFinanceiro.percentagemPaga,
      criadoPor: utilizadores.nome,
    })
    .from(inscricoes)
    .innerJoin(alunos, eq(alunos.id, inscricoes.alunoId))
    .innerJoin(categorias, eq(categorias.id, inscricoes.categoriaId))
    .innerJoin(inscricoesFinanceiro, eq(inscricoesFinanceiro.inscricaoId, inscricoes.id))
    .leftJoin(utilizadores, eq(utilizadores.id, inscricoes.criadoPor))
    .where(and(eq(inscricoes.id, id), doCtx(ctx)))
    .limit(1);
  if (!linha) return null;

  const registou = sql<string | null>`(select nome from utilizadores u where u.id = ${pagamentos.registadoPor})`;
  const anulou = sql<string | null>`(select nome from utilizadores u where u.id = ${pagamentos.anuladoPor})`;
  const lista = await db
    .select({
      id: pagamentos.id,
      valorCentavos: pagamentos.valorCentavos,
      metodo: pagamentos.metodo,
      referencia: pagamentos.referencia,
      pagoEm: pagamentos.pagoEm,
      registadoPor: registou,
      anuladoEm: pagamentos.anuladoEm,
      anuladoPor: anulou,
      motivoAnulacao: pagamentos.motivoAnulacao,
    })
    .from(pagamentos)
    .where(and(eq(pagamentos.inscricaoId, id), eq(pagamentos.escolaId, ctx.escolaId)))
    .orderBy(desc(pagamentos.pagoEm));

  return { ...linha, pagamentos: lista };
}

export type NovaInscricaoInput = {
  aluno: { existenteId: string } | { novo: AlunoInput };
  categoriaId: string;
  estadoInatro: EstadoInatro;
  inatroNumeroProcesso: string | null;
  inatroNota: string | null;
  primeiroPagamento: { valorCentavos: number; metodo: MetodoPagamento; referencia: string | null } | null;
};

/** Nova inscrição — UMA transação: aluno + inscrição + pagamento opcional + histórico. */
export async function criarInscricao(ctx: Ctx, input: NovaInscricaoInput) {
  const erroInatro = validarEstadoInatro(input.estadoInatro, input.inatroNumeroProcesso);
  if (erroInatro) throw new ErroNegocio(erroInatro, "inatroNumeroProcesso");

  return db.transaction(async (tx) => {
    let alunoId: string;
    if ("existenteId" in input.aluno) {
      const [a] = await tx
        .select({ id: alunos.id })
        .from(alunos)
        .where(and(eq(alunos.id, input.aluno.existenteId), eq(alunos.escolaId, ctx.escolaId), isNull(alunos.eliminadoEm)))
        .limit(1);
      if (!a) throw new ErroNegocio("Aluno não encontrado.", "alunoId");
      alunoId = a.id;
    } else {
      alunoId = await criarAluno(ctx, input.aluno.novo, tx);
    }

    const [categoria] = await tx
      .select()
      .from(categorias)
      .where(and(eq(categorias.id, input.categoriaId), eq(categorias.escolaId, ctx.escolaId), eq(categorias.ativo, true)))
      .limit(1);
    if (!categoria) throw new ErroNegocio("Categoria inválida ou inativa.", "categoriaId");

    const [nova] = await tx
      .insert(inscricoes)
      .values({
        escolaId: ctx.escolaId,
        alunoId,
        categoriaId: categoria.id,
        precoTotalCentavos: categoria.precoCentavos, // preço congelado
        estadoInatro: input.estadoInatro,
        inatroNumeroProcesso: input.estadoInatro === "registado" ? input.inatroNumeroProcesso : null,
        inatroNota: input.inatroNota,
        inatroUltimaTentativa: input.estadoInatro === "nao_registado" ? null : new Date(),
        criadoPor: ctx.userId,
      })
      .returning({ id: inscricoes.id });

    await registarHistorico(tx, ctx, "inscricao", nova.id, "criou", {
      alunoId,
      categoria: categoria.codigo,
      precoCentavos: categoria.precoCentavos,
      estadoInatro: input.estadoInatro,
    });

    if (input.primeiroPagamento) {
      const erro = validarNovoPagamento(categoria.precoCentavos, 0, input.primeiroPagamento.valorCentavos);
      if (erro) throw new ErroNegocio(erro, "primeiroPagamento");
      const [p] = await tx
        .insert(pagamentos)
        .values({
          escolaId: ctx.escolaId,
          inscricaoId: nova.id,
          valorCentavos: input.primeiroPagamento.valorCentavos,
          metodo: input.primeiroPagamento.metodo,
          referencia: input.primeiroPagamento.referencia,
          registadoPor: ctx.userId,
        })
        .returning({ id: pagamentos.id });
      await registarHistorico(tx, ctx, "pagamento", p.id, "registou", {
        inscricaoId: nova.id,
        valorCentavos: input.primeiroPagamento.valorCentavos,
        metodo: input.primeiroPagamento.metodo,
      });
    }

    return { inscricaoId: nova.id, alunoId };
  });
}

/** Muda o estado no INATRO (inclui "manter pendente", que regista nova tentativa). */
export async function atualizarInatro(
  ctx: Ctx,
  { inscricaoId, estado, numeroProcesso, nota }: { inscricaoId: string; estado: EstadoInatro; numeroProcesso: string | null; nota: string | null },
) {
  const erro = validarEstadoInatro(estado, numeroProcesso);
  if (erro) throw new ErroNegocio(erro, "numeroProcesso");

  await db.transaction(async (tx) => {
    const [atual] = await tx
      .select({ estado: inscricoes.estadoInatro, nota: inscricoes.inatroNota })
      .from(inscricoes)
      .where(and(eq(inscricoes.id, inscricaoId), doCtx(ctx)))
      .for("update")
      .limit(1);
    if (!atual) throw new ErroNegocio("Inscrição não encontrada.");

    await tx
      .update(inscricoes)
      .set({
        estadoInatro: estado,
        inatroNumeroProcesso: estado === "registado" ? numeroProcesso : null,
        inatroNota: nota ?? atual.nota,
        inatroUltimaTentativa: new Date(),
        atualizadoEm: new Date(),
      })
      .where(and(eq(inscricoes.id, inscricaoId), eq(inscricoes.escolaId, ctx.escolaId)));

    await registarHistorico(
      tx,
      ctx,
      "inscricao",
      inscricaoId,
      atual.estado === estado ? "nova_tentativa_inatro" : "alterou_estado_inatro",
      { de: atual.estado, para: estado, numeroProcesso: estado === "registado" ? numeroProcesso : undefined, nota: nota ?? undefined },
    );
  });
}

export async function atualizarEstadoAluno(ctx: Ctx, inscricaoId: string, estado: EstadoAluno) {
  await db.transaction(async (tx) => {
    const [atual] = await tx
      .select({ estado: inscricoes.estadoAluno })
      .from(inscricoes)
      .where(and(eq(inscricoes.id, inscricaoId), doCtx(ctx)))
      .limit(1);
    if (!atual) throw new ErroNegocio("Inscrição não encontrada.");
    if (atual.estado === estado) return;
    await tx
      .update(inscricoes)
      .set({ estadoAluno: estado, atualizadoEm: new Date() })
      .where(and(eq(inscricoes.id, inscricaoId), eq(inscricoes.escolaId, ctx.escolaId)));
    await registarHistorico(tx, ctx, "inscricao", inscricaoId, "alterou_estado_aluno", { de: atual.estado, para: estado });
  });
}
