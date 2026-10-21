import { Badge, Button, Card, CardHeader, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatDate } from "@/lib/labels";
import { requireSuperAdmin } from "@/server/auth/session";
import { listCompanies } from "@/server/services/super-admin";
import { saveCompanyAction } from "@/server/actions/super-admin";

export default async function CompaniesPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  await requireSuperAdmin();
  const companies = await listCompanies();
  const msg = searchParams.error ? "Não foi possível guardar. Verifique os campos e tente novamente." : searchParams.saved ? "Empresa guardada com sucesso." : null;
  return <div className="flex flex-col gap-5">
    {msg ? <p role="status" className={`rounded-xl px-4 py-3 text-sm font-semibold ${searchParams.error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>{msg}</p> : null}
    <Card><CardHeader title="Registar empresa" description="Cada empresa terá os seus próprios utilizadores e dados." />
      <form action={saveCompanyAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-xs font-semibold text-muted">Nome da empresa<input required name="name" maxLength={150} className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" placeholder="Escola de Condução" /></label>
        <label className="text-xs font-semibold text-muted">Telefone<input name="phone" maxLength={30} className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" placeholder="84 000 0000" /></label>
        <Button type="submit" className="self-end">Registar empresa</Button>
      </form>
    </Card>
    <Card><CardHeader title="Empresas registadas" description={`${companies.length} empresa(s)`} />
      <Table><THead><tr><Th>Empresa</Th><Th>Telefone</Th><Th>Utilizadores ativos</Th><Th>Inscrições</Th><Th>Recebido</Th><Th>Desde</Th><Th /></tr></THead>
        <TBody>{companies.map((e) => <Tr key={e.id} id={e.id}><Td className="font-semibold">{e.name}</Td><Td className="text-muted">{e.phone || "—"}</Td><Td><Badge tone="neutral">{Number(e.users)}</Badge></Td><Td>{Number(e.enrollments)}</Td><Td>{formatMoneyMzn(Number(e.received))}</Td><Td className="text-muted">{formatDate(e.created_at)}</Td><Td><details className="text-right"><summary className="cursor-pointer text-xs font-semibold text-brand">Editar</summary>
          <form action={saveCompanyAction} className="mt-2 flex min-w-56 flex-col gap-2 text-left"><input type="hidden" name="id" value={e.id} /><label className="text-xs text-muted">Nome<input required name="name" defaultValue={e.name} maxLength={150} className="mt-1 h-9 w-full rounded-lg bg-night-700 px-3 text-sm text-ink" /></label><label className="text-xs text-muted">Telefone<input name="phone" defaultValue={e.phone ?? ""} maxLength={30} className="mt-1 h-9 w-full rounded-lg bg-night-700 px-3 text-sm text-ink" /></label><Button type="submit" size="sm">Guardar alterações</Button></form>
        </details></Td></Tr>)}</TBody>
      </Table>
      {!companies.length ? <p className="text-sm text-muted">Ainda não há empresas registadas.</p> : null}
    </Card>
  </div>;
}
