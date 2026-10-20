import { and, count, eq, isNull, ne } from "drizzle-orm";
import { AppShell } from "@/components/layout/app-shell";
import { exigirContexto } from "@/server/auth/sessao";
import { db } from "@/server/db";
import { inscricoes } from "@/server/db/schema";
import { pode } from "@/server/domain/permissoes";

export const dynamic = "force-dynamic";

export default async function SistemaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await exigirContexto();
  const [{ pendentes }] = ctx.escolaId ? await db
    .select({ pendentes: count() })
    .from(inscricoes)
    .where(
      and(
        eq(inscricoes.escolaId, ctx.escolaId),
        isNull(inscricoes.eliminadoEm),
        eq(inscricoes.estadoInatro, "pendente"),
        ne(inscricoes.estadoAluno, "desistiu"),
      ),
    ) : [{ pendentes: 0 }];

  return (
    <AppShell
      utilizador={{
        nome: ctx.nome,
        papel: ctx.papel,
        escola: ctx.escolaNome,
        verHistorico: pode(ctx.papel, "ver_historico"),
        admin: ctx.papel === "admin",
        superAdmin: ctx.papel === "super_admin",
      }}
      pendentes={pendentes}
    >
      {children}
    </AppShell>
  );
}
