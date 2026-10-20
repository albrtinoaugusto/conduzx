import { Badge, Card, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { formatarData, iniciais, papelRotulo } from "@/lib/rotulos";
import { exigirContexto } from "@/server/auth/sessao";
import { listarUtilizadores } from "@/server/services/utilizadores";
import { EditarUtilizador, NovoUtilizador } from "./utilizador-modais";

export default async function UtilizadoresPage() {
  const ctx = await exigirContexto("gerir_utilizadores");
  const lista = await listarUtilizadores(ctx);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Atendentes registam alunos, inscrições e pagamentos. Gestores podem também anular pagamentos. Administradores gerem utilizadores e categorias.
        </p>
        <NovoUtilizador />
      </div>
      <Card>
        <Table>
          <THead>
            <tr>
              <Th>Nome</Th>
              <Th>Email</Th>
              <Th>Papel</Th>
              <Th>Estado</Th>
              <Th>Desde</Th>
              <Th className="w-24" />
            </tr>
          </THead>
          <TBody>
            {lista.map((u) => (
              <Tr key={u.id} className={u.ativo ? undefined : "opacity-60"}>
                <Td>
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-night-600 text-xs font-bold text-brand">{iniciais(u.nome)}</span>
                    <span className="font-semibold">
                      {u.nome}
                      {u.id === ctx.userId ? <span className="ml-2 text-[10px] font-semibold text-subtle">(a sua conta)</span> : null}
                    </span>
                  </span>
                </Td>
                <Td className="text-muted">{u.email}</Td>
                <Td>
                  <Badge tone={u.papel === "admin" ? "brand" : u.papel === "gestor" ? "info" : "neutral"}>{papelRotulo[u.papel]}</Badge>
                </Td>
                <Td>{u.ativo ? <Badge tone="success" dot>Ativo</Badge> : <Badge tone="danger" dot>Inativo</Badge>}</Td>
                <Td className="text-muted">{formatarData(u.criadoEm)}</Td>
                <Td>
                  <EditarUtilizador utilizador={{ id: u.id, nome: u.nome, papel: u.papel, ativo: u.ativo }} proprio={u.id === ctx.userId} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
