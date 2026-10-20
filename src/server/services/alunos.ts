import "server-only";
import { and, asc, count, desc, eq, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db, type Tx } from "@/server/db";
import { alunos, categorias, inscricoes, inscricoesFinanceiro } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/sessao";
import { ErroNegocio } from "@/server/erros";
import type { AlunoInput } from "@/server/validation/esquemas";
import { registarHistorico } from "./historico";

export const POR_PAGINA = 15;

function filtroPesquisa(q: string) {
  const termo = `%${q.replace(/[%_]/g, "\\$&")}%`;
  const digitos = q.replace(/\D/g, "");
  return or(
    ilike(alunos.nomeCompleto, termo),
    ilike(alunos.biNumero, termo),
    digitos.length >= 3
      ? sql`regexp_replace(coalesce(${alunos.telefone}, ''), '\\D', '', 'g') LIKE ${`%${digitos}%`}`
      : ilike(alunos.telefone, termo),
  );
}

export async function listarAlunos(
  ctx: Ctx,
  { q = "", pagina = 1, estado }: { q?: string; pagina?: number; estado?: "ativo" | "concluido" | "desistiu" },
) {
  const conds = [eq(alunos.escolaId, ctx.escolaId), isNull(alunos.eliminadoEm)];
  if (q.trim()) conds.push(filtroPesquisa(q.trim())!);
  if (estado) {
    conds.push(
      sql`exists (select 1 from ${inscricoes} i where i.aluno_id = ${alunos.id}
          and i.eliminado_em is null and i.estado_aluno = ${estado})`,
    );
  }
  const where = and(...conds);

  const [{ total }] = await db.select({ total: count() }).from(alunos).where(where);
  const linhas = await db
    .select({
      id: alunos.id,
      nomeCompleto: alunos.nomeCompleto,
      biNumero: alunos.biNumero,
      telefone: alunos.telefone,
    })
    .from(alunos)
    .where(where)
    .orderBy(asc(alunos.nomeCompleto))
    .limit(POR_PAGINA)
    .offset((Math.max(pagina, 1) - 1) * POR_PAGINA);

  // Última inscrição de cada aluno (categoria + estado)
  const ids = linhas.map((l) => l.id);
  const ultimas = ids.length
    ? await db
        .selectDistinctOn([inscricoes.alunoId], {
          alunoId: inscricoes.alunoId,
          categoria: categorias.nome,
          codigo: categorias.codigo,
          estadoAluno: inscricoes.estadoAluno,
        })
        .from(inscricoes)
        .innerJoin(categorias, eq(categorias.id, inscricoes.categoriaId))
        .where(
          and(
            eq(inscricoes.escolaId, ctx.escolaId),
            inArray(inscricoes.alunoId, ids),
            isNull(inscricoes.eliminadoEm),
          ),
        )
        .orderBy(inscricoes.alunoId, desc(inscricoes.criadoEm))
    : [];
  const porAluno = new Map(ultimas.map((u) => [u.alunoId, u]));

  return {
    total,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    linhas: linhas.map((l) => ({ ...l, ultima: porAluno.get(l.id) ?? null })),
  };
}

/** Pesquisa rápida para escolher aluno numa nova inscrição. */
export async function pesquisarAlunos(ctx: Ctx, q: string) {
  if (q.trim().length < 2) return [];
  return db
    .select({
      id: alunos.id,
      nomeCompleto: alunos.nomeCompleto,
      biNumero: alunos.biNumero,
      telefone: alunos.telefone,
    })
    .from(alunos)
    .where(and(eq(alunos.escolaId, ctx.escolaId), isNull(alunos.eliminadoEm), filtroPesquisa(q.trim())))
    .orderBy(asc(alunos.nomeCompleto))
    .limit(8);
}

export async function obterAluno(ctx: Ctx, id: string) {
  const [aluno] = await db
    .select()
    .from(alunos)
    .where(and(eq(alunos.id, id), eq(alunos.escolaId, ctx.escolaId), isNull(alunos.eliminadoEm)))
    .limit(1);
  if (!aluno) return null;

  const lista = await db
    .select({
      id: inscricoes.id,
      categoria: categorias.nome,
      codigo: categorias.codigo,
      estadoAluno: inscricoes.estadoAluno,
      estadoInatro: inscricoes.estadoInatro,
      inatroNumeroProcesso: inscricoes.inatroNumeroProcesso,
      dataInscricao: inscricoes.dataInscricao,
      total: inscricoesFinanceiro.precoTotalCentavos,
      pago: inscricoesFinanceiro.pagoCentavos,
      situacao: inscricoesFinanceiro.situacaoPagamento,
    })
    .from(inscricoes)
    .innerJoin(categorias, eq(categorias.id, inscricoes.categoriaId))
    .innerJoin(inscricoesFinanceiro, eq(inscricoesFinanceiro.inscricaoId, inscricoes.id))
    .where(and(eq(inscricoes.alunoId, id), eq(inscricoes.escolaId, ctx.escolaId), isNull(inscricoes.eliminadoEm)))
    .orderBy(desc(inscricoes.criadoEm));

  return { aluno, inscricoes: lista };
}

async function verificarBiUnico(tx: Tx, ctx: Ctx, bi: string | null, excetoId?: string) {
  if (!bi) return;
  const conds = [eq(alunos.escolaId, ctx.escolaId), eq(alunos.biNumero, bi), isNull(alunos.eliminadoEm)];
  if (excetoId) conds.push(ne(alunos.id, excetoId));
  const [existe] = await tx
    .select({ id: alunos.id, nome: alunos.nomeCompleto })
    .from(alunos)
    .where(and(...conds))
    .limit(1);
  if (existe) {
    throw new ErroNegocio(`Já existe um aluno com este BI: ${existe.nome}.`, "biNumero", {
      href: `/alunos/${existe.id}`,
      texto: "Abrir ficha do aluno",
    });
  }
}

/** Cria um aluno. Pode receber uma transação externa (fluxo de nova inscrição). */
export async function criarAluno(ctx: Ctx, dados: AlunoInput, txExterna?: Tx) {
  const executar = async (tx: Tx) => {
    await verificarBiUnico(tx, ctx, dados.biNumero);
    const [novo] = await tx
      .insert(alunos)
      .values({ ...dados, escolaId: ctx.escolaId, criadoPor: ctx.userId })
      .returning({ id: alunos.id });
    await registarHistorico(tx, ctx, "aluno", novo.id, "criou", { nome: dados.nomeCompleto });
    return novo.id;
  };
  return txExterna ? executar(txExterna) : db.transaction(executar);
}

export async function atualizarAluno(ctx: Ctx, id: string, dados: AlunoInput) {
  return db.transaction(async (tx) => {
    const [atual] = await tx
      .select()
      .from(alunos)
      .where(and(eq(alunos.id, id), eq(alunos.escolaId, ctx.escolaId), isNull(alunos.eliminadoEm)))
      .limit(1);
    if (!atual) throw new ErroNegocio("Aluno não encontrado.");
    await verificarBiUnico(tx, ctx, dados.biNumero, id);

    const alterados = (Object.keys(dados) as Array<keyof AlunoInput>).filter(
      (k) => String(atual[k] ?? "") !== String(dados[k] ?? ""),
    );
    if (alterados.length === 0) return;

    await tx
      .update(alunos)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(and(eq(alunos.id, id), eq(alunos.escolaId, ctx.escolaId)));
    // Só os nomes dos campos — sem valores pessoais no histórico
    await registarHistorico(tx, ctx, "aluno", id, "atualizou", { campos: alterados });
  });
}
