import "server-only";
import bcrypt from "bcryptjs";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { escolas, utilizadores } from "@/server/db/schema";
import { ErroNegocio } from "@/server/erros";
import type { Ctx } from "@/server/auth/sessao";

export async function resumoGlobal() {
  const result = await db.execute<{
    empresas: number | string;
    admins: number | string;
    inscricoes: number | string;
    recebimentos_mes: number | string;
  }>(sql`
    select
      (select count(*) from escolas) as empresas,
      (select count(*) from utilizadores where papel = 'admin' and ativo) as admins,
      (select count(*) from inscricoes where eliminado_em is null) as inscricoes,
      (select coalesce(sum(valor_centavos), 0) from pagamentos
        where anulado_em is null and pago_em >= date_trunc('month', now())) as recebimentos_mes
  `);
  const r = result.rows[0];
  return {
    empresas: Number(r.empresas),
    admins: Number(r.admins),
    inscricoes: Number(r.inscricoes),
    recebimentosMes: Number(r.recebimentos_mes),
  };
}

export async function listarEmpresas() {
  return db.execute<{
    id: string;
    nome: string;
    telefone: string | null;
    criado_em: Date;
    utilizadores: number | string;
    inscricoes: number | string;
    recebido: number | string;
  }>(sql`
    select e.id, e.nome, e.telefone, e.criado_em,
      (select count(*) from utilizadores u where u.escola_id = e.id and u.ativo) as utilizadores,
      (select count(*) from inscricoes i where i.escola_id = e.id and i.eliminado_em is null) as inscricoes,
      (select coalesce(sum(p.valor_centavos), 0) from pagamentos p
        where p.escola_id = e.id and p.anulado_em is null) as recebido
    from escolas e order by e.nome
  `).then((r) => r.rows);
}

export async function guardarEmpresa(ctx: Ctx, dados: { id?: string; nome: string; telefone: string | null }) {
  if (dados.id) {
    const resultado = await db.update(escolas).set({ nome: dados.nome, telefone: dados.telefone }).where(eq(escolas.id, dados.id)).returning({ id: escolas.id });
    if (!resultado.length) throw new ErroNegocio("Empresa não encontrada.");
    return resultado[0].id;
  }
  const [nova] = await db.insert(escolas).values({ nome: dados.nome, telefone: dados.telefone }).returning({ id: escolas.id });
  return nova.id;
}

export async function listarAdmins() {
  return db.select({ id: utilizadores.id, nome: utilizadores.nome, email: utilizadores.email, ativo: utilizadores.ativo, criadoEm: utilizadores.criadoEm, escola: escolas.nome })
    .from(utilizadores).innerJoin(escolas, eq(escolas.id, utilizadores.escolaId))
    .where(eq(utilizadores.papel, "admin")).orderBy(asc(escolas.nome), asc(utilizadores.nome));
}

export async function criarAdminEmpresa(dados: { nome: string; email: string; password: string; escolaId: string }) {
  const [escola] = await db.select({ id: escolas.id }).from(escolas).where(eq(escolas.id, dados.escolaId)).limit(1);
  if (!escola) throw new ErroNegocio("Escolha uma empresa válida.", "escolaId");
  const [existente] = await db.select({ id: utilizadores.id }).from(utilizadores).where(eq(utilizadores.email, dados.email)).limit(1);
  if (existente) throw new ErroNegocio("Já existe uma conta com este email.", "email");
  const passwordHash = await bcrypt.hash(dados.password, 10);
  await db.insert(utilizadores).values({ escolaId: escola.id, nome: dados.nome, email: dados.email, passwordHash, papel: "admin" });
}
