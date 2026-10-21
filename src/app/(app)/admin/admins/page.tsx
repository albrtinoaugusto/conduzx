import { Badge, Button, Card, CardHeader, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import { requireSuperAdmin } from "@/server/auth/session";
import { listAdmins, listCompanies } from "@/server/services/super-admin";
import { createCompanyAdminAction } from "@/server/actions/super-admin";

export default async function AdminsPage({ searchParams }: { searchParams: { created?: string; error?: string } }) {
  await requireSuperAdmin();
  const [admins, companies] = await Promise.all([listAdmins(), listCompanies()]);
  const msg = searchParams.error ? "Não foi possível criar o administrador. Confirme os dados e a empresa selecionada." : searchParams.created ? "Administrador criado com sucesso." : null;
  return <div className="flex flex-col gap-5">
    {msg ? <p role="status" className={`rounded-xl px-4 py-3 text-sm font-semibold ${searchParams.error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>{msg}</p> : null}
    <Card><CardHeader title="Novo administrador" description="A conta fica associada a uma única empresa." />
      {companies.length ? <form action={createCompanyAdminAction} className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-muted">Nome completo<input required name="name" maxLength={100} className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" /></label>
        <label className="text-xs font-semibold text-muted">Email<input required type="email" name="email" autoComplete="email" className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" /></label>
        <label className="text-xs font-semibold text-muted">Palavra-passe inicial<input required type="password" name="password" minLength={8} maxLength={100} autoComplete="new-password" className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" /></label>
        <label className="text-xs font-semibold text-muted">Empresa<select required name="schoolId" defaultValue="" className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink"><option value="" disabled>Selecione uma empresa</option>{companies.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
        <Button type="submit" className="sm:col-span-2 sm:justify-self-start">Criar administrador</Button>
      </form> : <p className="text-sm text-muted">Registe uma empresa antes de criar administradores.</p>}
    </Card>
    <Card><CardHeader title="Administradores" description={`${admins.length} conta(s) com acesso de administrador`} />
      <Table><THead><tr><Th>Nome</Th><Th>Email</Th><Th>Empresa</Th><Th>Estado</Th><Th>Desde</Th></tr></THead><TBody>
        {admins.map((a) => <Tr key={a.id}><Td className="font-semibold">{a.name}</Td><Td className="text-muted">{a.email}</Td><Td>{a.school}</Td><Td>{a.active ? <Badge tone="success" dot>Ativo</Badge> : <Badge tone="danger" dot>Inativo</Badge>}</Td><Td className="text-muted">{formatDate(a.createdAt)}</Td></Tr>)}
      </TBody></Table>
      {!admins.length ? <p className="text-sm text-muted">Ainda não há administradores de empresa.</p> : null}
    </Card>
  </div>;
}
