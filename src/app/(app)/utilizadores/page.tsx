import { Badge, Card, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { formatDate, initials, roleLabel } from "@/lib/labels";
import { requireContext } from "@/server/auth/session";
import { listUsers } from "@/server/services/users";
import { EditUser, NewUser } from "./user-modals";

export default async function UsersPage() {
  const ctx = await requireContext("manage_users");
  const list = await listUsers(ctx);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Atendentes registam alunos, inscrições e pagamentos. Gestores podem também anular pagamentos. Administradores gerem utilizadores e categorias.
        </p>
        <NewUser />
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
            {list.map((u) => (
              <Tr key={u.id} className={u.active ? undefined : "opacity-60"}>
                <Td>
                  <span className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-night-600 text-xs font-bold text-brand">{initials(u.name)}</span>
                    <span className="font-semibold">
                      {u.name}
                      {u.id === ctx.userId ? <span className="ml-2 text-[10px] font-semibold text-subtle">(a sua conta)</span> : null}
                    </span>
                  </span>
                </Td>
                <Td className="text-muted">{u.email}</Td>
                <Td>
                  <Badge tone={u.role === "admin" ? "brand" : u.role === "gestor" ? "info" : "neutral"}>{roleLabel[u.role]}</Badge>
                </Td>
                <Td>{u.active ? <Badge tone="success" dot>Ativo</Badge> : <Badge tone="danger" dot>Inativo</Badge>}</Td>
                <Td className="text-muted">{formatDate(u.createdAt)}</Td>
                <Td>
                  <EditUser user={{ id: u.id, name: u.name, role: u.role, active: u.active }} isSelf={u.id === ctx.userId} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
