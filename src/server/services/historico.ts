import "server-only";
import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db, type Tx } from "@/server/db";
import { historico, utilizadores } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/sessao";

export type Entidade = "aluno" | "inscricao" | "pagamento" | "categoria" | "utilizador" | "documento";

/**
 * Regista uma ação no histórico. Chamar SEMPRE dentro da mesma transação da alteração.
 * Não guardar dados pessoais sensíveis em `dados` (BI, telefone, morada).
 */
export async function registarHistorico(
  tx: Tx,
  ctx: Pick<Ctx, "escolaId" | "userId">,
  entidade: Entidade,
  entidadeId: string,
  acao: string,
  dados?: Record<string, unknown>,
) {
  await tx.insert(historico).values({
    escolaId: ctx.escolaId,
    utilizadorId: ctx.userId,
    origem: "app",
    entidade,
    entidadeId,
    acao,
    dados: dados ?? null,
  });
}

const colunas = {
  id: historico.id,
  entidade: historico.entidade,
  entidadeId: historico.entidadeId,
  acao: historico.acao,
  dados: historico.dados,
  criadoEm: historico.criadoEm,
  utilizador: utilizadores.nome,
};

export type LinhaHistorico = Awaited<ReturnType<typeof listarHistorico>>[number];

export async function listarHistorico(
  ctx: Ctx,
  filtro: { entidade?: Entidade; entidadeIds?: string[]; limite?: number } = {},
) {
  const conds: SQL[] = [eq(historico.escolaId, ctx.escolaId)];
  if (filtro.entidade) conds.push(eq(historico.entidade, filtro.entidade));
  if (filtro.entidadeIds) {
    if (filtro.entidadeIds.length === 0) return [];
    conds.push(inArray(historico.entidadeId, filtro.entidadeIds));
  }

  return db
    .select(colunas)
    .from(historico)
    .leftJoin(utilizadores, eq(utilizadores.id, historico.utilizadorId))
    .where(and(...conds))
    .orderBy(desc(historico.criadoEm), desc(historico.id))
    .limit(filtro.limite ?? 100);
}
