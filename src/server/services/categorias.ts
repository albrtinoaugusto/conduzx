import "server-only";
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { categorias } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/sessao";
import { ErroNegocio } from "@/server/erros";
import { registarHistorico } from "./historico";

type CategoriaInput = { codigo: string; nome: string; preco: number | null; ativo: boolean };

export async function listarCategorias(ctx: Ctx, { apenasAtivas = false } = {}) {
  const conds = [eq(categorias.escolaId, ctx.escolaId)];
  if (apenasAtivas) conds.push(eq(categorias.ativo, true));
  return db
    .select()
    .from(categorias)
    .where(and(...conds))
    .orderBy(asc(categorias.codigo));
}

async function codigoLivre(ctx: Ctx, codigo: string, excetoId?: string) {
  const conds = [eq(categorias.escolaId, ctx.escolaId), eq(categorias.codigo, codigo)];
  if (excetoId) conds.push(ne(categorias.id, excetoId));
  const [existe] = await db.select({ id: categorias.id }).from(categorias).where(and(...conds)).limit(1);
  if (existe) throw new ErroNegocio("Já existe uma categoria com este código.", "codigo");
}

export async function criarCategoria(ctx: Ctx, dados: CategoriaInput) {
  await codigoLivre(ctx, dados.codigo);
  return db.transaction(async (tx) => {
    const [nova] = await tx
      .insert(categorias)
      .values({
        escolaId: ctx.escolaId,
        codigo: dados.codigo,
        nome: dados.nome,
        precoCentavos: dados.preco ?? 0,
        ativo: true,
      })
      .returning({ id: categorias.id });
    await registarHistorico(tx, ctx, "categoria", nova.id, "criou", {
      codigo: dados.codigo,
      precoCentavos: dados.preco,
    });
    return nova.id;
  });
}

export async function atualizarCategoria(ctx: Ctx, id: string, dados: CategoriaInput) {
  await codigoLivre(ctx, dados.codigo, id);
  await db.transaction(async (tx) => {
    const [atual] = await tx
      .select()
      .from(categorias)
      .where(and(eq(categorias.id, id), eq(categorias.escolaId, ctx.escolaId)))
      .limit(1);
    if (!atual) throw new ErroNegocio("Categoria não encontrada.");

    await tx
      .update(categorias)
      .set({ codigo: dados.codigo, nome: dados.nome, precoCentavos: dados.preco ?? 0, ativo: dados.ativo })
      .where(and(eq(categorias.id, id), eq(categorias.escolaId, ctx.escolaId)));

    await registarHistorico(tx, ctx, "categoria", id, "atualizou", {
      codigo: dados.codigo,
      ...(atual.precoCentavos !== dados.preco
        ? { precoAnterior: atual.precoCentavos, precoNovo: dados.preco }
        : {}),
      ...(atual.ativo !== dados.ativo ? { ativo: dados.ativo } : {}),
    });
  });
}
