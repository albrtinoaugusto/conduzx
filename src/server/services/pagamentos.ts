import "server-only";
import { and, count, desc, eq, gte, ilike, isNotNull, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { alunos, categorias, inscricoes, pagamentos, type MetodoPagamento } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/sessao";
import { ErroNegocio } from "@/server/erros";
import { validarNovoPagamento } from "@/server/domain/financeiro";
import { pode } from "@/server/domain/permissoes";
import { registarHistorico } from "./historico";

export const POR_PAGINA = 20;

export async function registarPagamento(
  ctx: Ctx,
  dados: { inscricaoId: string; valorCentavos: number; metodo: MetodoPagamento; referencia: string | null },
) {
  return db.transaction(async (tx) => {
    // Bloqueia a inscrição para evitar dois pagamentos em simultâneo ultrapassarem o total
    const [insc] = await tx
      .select({ id: inscricoes.id, total: inscricoes.precoTotalCentavos })
      .from(inscricoes)
      .where(and(eq(inscricoes.id, dados.inscricaoId), eq(inscricoes.escolaId, ctx.escolaId), isNull(inscricoes.eliminadoEm)))
      .for("update")
      .limit(1);
    if (!insc) throw new ErroNegocio("Inscrição não encontrada.");

    const [{ pago }] = await tx
      .select({ pago: sql<number>`coalesce(sum(${pagamentos.valorCentavos}), 0)`.mapWith(Number) })
      .from(pagamentos)
      .where(and(eq(pagamentos.inscricaoId, insc.id), isNull(pagamentos.anuladoEm)));

    const erro = validarNovoPagamento(insc.total, pago, dados.valorCentavos);
    if (erro) throw new ErroNegocio(erro, "valor");

    const [p] = await tx
      .insert(pagamentos)
      .values({
        escolaId: ctx.escolaId,
        inscricaoId: insc.id,
        valorCentavos: dados.valorCentavos,
        metodo: dados.metodo,
        referencia: dados.referencia,
        registadoPor: ctx.userId,
      })
      .returning({ id: pagamentos.id });

    await registarHistorico(tx, ctx, "pagamento", p.id, "registou", {
      inscricaoId: insc.id,
      valorCentavos: dados.valorCentavos,
      metodo: dados.metodo,
    });
    return p.id;
  });
}

/** Pagamentos não se editam nem apagam: anulam-se com motivo (gestor/admin). */
export async function anularPagamento(ctx: Ctx, { pagamentoId, motivo }: { pagamentoId: string; motivo: string }) {
  if (!pode(ctx.papel, "anular_pagamento")) {
    throw new ErroNegocio("Só o gestor ou o administrador podem anular pagamentos.");
  }
  return db.transaction(async (tx) => {
    const [p] = await tx
      .select({ id: pagamentos.id, inscricaoId: pagamentos.inscricaoId, valor: pagamentos.valorCentavos, anuladoEm: pagamentos.anuladoEm })
      .from(pagamentos)
      .where(and(eq(pagamentos.id, pagamentoId), eq(pagamentos.escolaId, ctx.escolaId)))
      .for("update")
      .limit(1);
    if (!p) throw new ErroNegocio("Pagamento não encontrado.");
    if (p.anuladoEm) throw new ErroNegocio("Este pagamento já foi anulado.");

    await tx
      .update(pagamentos)
      .set({ anuladoEm: new Date(), anuladoPor: ctx.userId, motivoAnulacao: motivo })
      .where(and(eq(pagamentos.id, p.id), eq(pagamentos.escolaId, ctx.escolaId)));

    await registarHistorico(tx, ctx, "pagamento", p.id, "anulou", {
      inscricaoId: p.inscricaoId,
      valorCentavos: p.valor,
      motivo,
    });
    return p.inscricaoId;
  });
}

export type Periodo = "hoje" | "semana" | "mes" | "anulados" | "todos";

function inicioPeriodo(periodo: Periodo): Date | null {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (periodo === "hoje") return d;
  if (periodo === "semana") {
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // segunda-feira
    return d;
  }
  if (periodo === "mes") {
    d.setDate(1);
    return d;
  }
  return null;
}

export async function listarPagamentos(
  ctx: Ctx,
  { periodo = "mes", q = "", pagina = 1 }: { periodo?: Periodo; q?: string; pagina?: number },
) {
  const conds: SQL[] = [eq(pagamentos.escolaId, ctx.escolaId)];
  const inicio = inicioPeriodo(periodo);
  if (inicio) conds.push(gte(pagamentos.pagoEm, inicio));
  if (periodo === "anulados") conds.push(isNotNull(pagamentos.anuladoEm));
  if (q.trim()) {
    const termo = `%${q.trim().replace(/[%_]/g, "\\$&")}%`;
    conds.push(or(ilike(alunos.nomeCompleto, termo), ilike(pagamentos.referencia, termo))!);
  }
  const where = and(...conds);

  const [resumo] = await db
    .select({
      total: count(),
      validos: sql<number>`count(*) filter (where ${pagamentos.anuladoEm} is null)`.mapWith(Number),
      recebido: sql<number>`coalesce(sum(${pagamentos.valorCentavos}) filter (where ${pagamentos.anuladoEm} is null), 0)`.mapWith(Number),
    })
    .from(pagamentos)
    .innerJoin(inscricoes, eq(inscricoes.id, pagamentos.inscricaoId))
    .innerJoin(alunos, eq(alunos.id, inscricoes.alunoId))
    .where(where);

  const linhas = await db
    .select({
      id: pagamentos.id,
      inscricaoId: pagamentos.inscricaoId,
      aluno: alunos.nomeCompleto,
      categoria: categorias.codigo,
      valorCentavos: pagamentos.valorCentavos,
      metodo: pagamentos.metodo,
      referencia: pagamentos.referencia,
      pagoEm: pagamentos.pagoEm,
      registadoPor: sql<string | null>`(select nome from utilizadores u where u.id = ${pagamentos.registadoPor})`,
      anuladoEm: pagamentos.anuladoEm,
      anuladoPor: sql<string | null>`(select nome from utilizadores u where u.id = ${pagamentos.anuladoPor})`,
      motivoAnulacao: pagamentos.motivoAnulacao,
    })
    .from(pagamentos)
    .innerJoin(inscricoes, eq(inscricoes.id, pagamentos.inscricaoId))
    .innerJoin(alunos, eq(alunos.id, inscricoes.alunoId))
    .innerJoin(categorias, eq(categorias.id, inscricoes.categoriaId))
    .where(where)
    .orderBy(desc(pagamentos.pagoEm))
    .limit(POR_PAGINA)
    .offset((Math.max(pagina, 1) - 1) * POR_PAGINA);

  return {
    ...resumo,
    anulados: resumo.total - resumo.validos,
    paginas: Math.max(1, Math.ceil(resumo.total / POR_PAGINA)),
    linhas,
  };
}
