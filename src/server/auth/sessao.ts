import "server-only";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/server/db";
import { escolas, utilizadores, type PapelUtilizador } from "@/server/db/schema";
import { pode, type Acao } from "@/server/domain/permissoes";
import { COOKIE_SESSAO, DURACAO_SESSAO_S, criarToken, lerToken } from "./token";

/** Contexto por pedido; contas globais não têm escola associada. */
export type Ctx = {
  userId: string;
  escolaId: string;
  papel: PapelUtilizador;
  nome: string;
  escolaNome: string;
};

export function iniciarSessao(userId: string) {
  cookies().set(COOKIE_SESSAO, criarToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACAO_SESSAO_S,
  });
}

export function terminarSessao() {
  cookies().delete(COOKIE_SESSAO);
}

/** Utilizador autenticado (ou null). Memorizado durante o pedido. */
export const obterContexto = cache(async (): Promise<Ctx | null> => {
  const uid = lerToken(cookies().get(COOKIE_SESSAO)?.value);
  if (!uid) return null;

  const [linha] = await db
    .select({
      userId: utilizadores.id,
      escolaId: utilizadores.escolaId,
      papel: utilizadores.papel,
      nome: utilizadores.nome,
      escolaNome: escolas.nome,
    })
    .from(utilizadores)
    .leftJoin(escolas, eq(escolas.id, utilizadores.escolaId))
    .where(and(eq(utilizadores.id, uid), eq(utilizadores.ativo, true)))
    .limit(1);

  return linha ? { ...linha, escolaId: linha.escolaId ?? "", escolaNome: linha.escolaNome ?? "Administração ConduzX" } : null;
});

/** Para páginas e server actions: exige sessão (e permissão, se indicada). */
export async function exigirContexto(acao?: Acao): Promise<Ctx> {
  const ctx = await obterContexto();
  if (!ctx) redirect("/login");
  if (acao && !ctx.escolaId) redirect("/admin?sem-permissao=1");
  if (acao && !pode(ctx.papel, acao)) redirect("/?sem-permissao=1");
  return ctx;
}

export async function exigirSuperAdmin(): Promise<Ctx> {
  const ctx = await exigirContexto();
  if (ctx.papel !== "super_admin" || ctx.escolaId !== "") redirect("/?sem-permissao=1");
  return ctx;
}
