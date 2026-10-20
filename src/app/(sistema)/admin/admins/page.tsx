import { Badge, Button, Card, CardHeader, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { formatarData } from "@/lib/rotulos";
import { exigirSuperAdmin } from "@/server/auth/sessao";
import { listarAdmins, listarEmpresas } from "@/server/services/super-admin";
import { criarAdminEmpresaAction } from "@/server/actions/super-admin";

export default async function AdminsPage({ searchParams }: { searchParams: { criado?: string; erro?: string } }) {
  await exigirSuperAdmin();
  const [admins, empresas] = await Promise.all([listarAdmins(), listarEmpresas()]);
  const msg = searchParams.erro ? "Não foi possível criar o administrador. Confirme os dados e a empresa seleccionada." : searchParams.criado ? "Administrador criado com sucesso." : null;
  return <div className="flex flex-col gap-5">
    {msg ? <p role="status" className={`rounded-xl px-4 py-3 text-sm font-semibold ${searchParams.erro ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>{msg}</p> : null}
    <Card><CardHeader title="Novo administrador" description="A conta fica associada a uma única empresa." />
      {empresas.length ? <form action={criarAdminEmpresaAction} className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-muted">Nome completo<input required name="nome" maxLength={100} className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" /></label>
        <label className="text-xs font-semibold text-muted">Email<input required type="email" name="email" autoComplete="email" className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" /></label>
        <label className="text-xs font-semibold text-muted">Palavra-passe inicial<input required type="password" name="password" minLength={8} maxLength={100} autoComplete="new-password" className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" /></label>
        <label className="text-xs font-semibold text-muted">Empresa<select required name="escolaId" defaultValue="" className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink"><option value="" disabled>Seleccione uma empresa</option>{empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
        <Button type="submit" className="sm:col-span-2 sm:justify-self-start">Criar administrador</Button>
      </form> : <p className="text-sm text-muted">Cadastre uma empresa antes de criar administradores.</p>}
    </Card>
    <Card><CardHeader title="Administradores" description={`${admins.length} conta(s) com acesso de administrador`} />
      <Table><THead><tr><Th>Nome</Th><Th>Email</Th><Th>Empresa</Th><Th>Estado</Th><Th>Desde</Th></tr></THead><TBody>
        {admins.map((a) => <Tr key={a.id}><Td className="font-semibold">{a.nome}</Td><Td className="text-muted">{a.email}</Td><Td>{a.escola}</Td><Td>{a.ativo ? <Badge tone="success" dot>Activo</Badge> : <Badge tone="danger" dot>Inactivo</Badge>}</Td><Td className="text-muted">{formatarData(a.criadoEm)}</Td></Tr>)}
      </TBody></Table>
      {!admins.length ? <p className="text-sm text-muted">Ainda não há administradores de empresa.</p> : null}
    </Card>
  </div>;
}
