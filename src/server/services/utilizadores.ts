import "server-only";
import bcrypt from "bcryptjs";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { utilizadores, type PapelUtilizador } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/sessao";
import { ErroNegocio } from "@/server/erros";
import { registarHistorico } from "./historico";

// Hash usado quando o email não existe, para o tempo de resposta não revelar contas.
const HASH_FALSO = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.qdQKZ3uS0b/1.7PPlaV0zrHhb3eK";

/** Login: devolve o id do utilizador ou null (mensagem genérica no ecrã). */
export async function autenticar(email: string, password: string): Promise<string | null> {
  const [u] = await db
    .select({ id: utilizadores.id, hash: utilizadores.passwordHash, ativo: utilizadores.ativo })
    .from(utilizadores)
    .where(eq(utilizadores.email, email))
    .limit(1);
  const ok = await bcrypt.compare(password, u?.hash ?? HASH_FALSO);
  return u && ok && u.ativo ? u.id : null;
}

export async function listarUtilizadores(ctx: Ctx) {
  return db
    .select({
      id: utilizadores.id,
      nome: utilizadores.nome,
      email: utilizadores.email,
      papel: utilizadores.papel,
      ativo: utilizadores.ativo,
      criadoEm: utilizadores.criadoEm,
    })
    .from(utilizadores)
    .where(eq(utilizadores.escolaId, ctx.escolaId!))
    .orderBy(asc(utilizadores.nome));
}

export async function criarUtilizador(
  ctx: Ctx,
  dados: { nome: string; email: string; papel: PapelUtilizador; password: string },
) {
  const [existe] = await db
    .select({ id: utilizadores.id })
    .from(utilizadores)
    .where(eq(utilizadores.email, dados.email))
    .limit(1);
  if (existe) throw new ErroNegocio("Já existe uma conta com este email.", "email");

  const passwordHash = await bcrypt.hash(dados.password, 10);
  return db.transaction(async (tx) => {
    const [novo] = await tx
      .insert(utilizadores)
      .values({ escolaId: ctx.escolaId!, nome: dados.nome, email: dados.email, papel: dados.papel, passwordHash })
      .returning({ id: utilizadores.id });
    await registarHistorico(tx, ctx, "utilizador", novo.id, "criou", { nome: dados.nome, papel: dados.papel });
    return novo.id;
  });
}

export async function atualizarUtilizador(
  ctx: Ctx,
  dados: { utilizadorId: string; papel: PapelUtilizador; ativo: boolean; password: string | null },
) {
  if (dados.utilizadorId === ctx.userId && (!dados.ativo || dados.papel !== "admin")) {
    throw new ErroNegocio("Não pode desativar a sua própria conta nem retirar-se de administrador.");
  }
  const passwordHash = dados.password ? await bcrypt.hash(dados.password, 10) : undefined;

  await db.transaction(async (tx) => {
    const [atual] = await tx
      .select({ papel: utilizadores.papel, ativo: utilizadores.ativo })
      .from(utilizadores)
      .where(and(eq(utilizadores.id, dados.utilizadorId), eq(utilizadores.escolaId, ctx.escolaId!)))
      .limit(1);
    if (!atual) throw new ErroNegocio("Utilizador não encontrado.");

    await tx
      .update(utilizadores)
      .set({ papel: dados.papel, ativo: dados.ativo, ...(passwordHash ? { passwordHash } : {}) })
      .where(and(eq(utilizadores.id, dados.utilizadorId), eq(utilizadores.escolaId, ctx.escolaId!)));

    await registarHistorico(tx, ctx, "utilizador", dados.utilizadorId, "atualizou", {
      ...(atual.papel !== dados.papel ? { papel: { de: atual.papel, para: dados.papel } } : {}),
      ...(atual.ativo !== dados.ativo ? { ativo: dados.ativo } : {}),
      ...(passwordHash ? { redefiniuPassword: true } : {}),
    });
  });
}
