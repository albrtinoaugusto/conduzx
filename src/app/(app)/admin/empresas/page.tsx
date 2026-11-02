import { Badge, Button, Card, CardHeader, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatDate } from "@/lib/labels";
import { requireSuperAdmin } from "@/server/auth/session";
import { schoolBlock, trialDaysLeft, trialEndsAt, MAX_TRIAL_DAYS } from "@/server/domain/school-access";
import { listCompanies } from "@/server/services/super-admin";
import { deleteCompanyAction, saveCompanyAction, setCompanySuspendedAction } from "@/server/actions/super-admin";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  trial: `Os dias de teste devem ser um número inteiro entre 1 e ${MAX_TRIAL_DAYS}, ou ficar vazios para não ter limite.`,
  delete: "Não foi possível eliminar. Confirme que escreveu o nome da empresa exatamente como aparece.",
};
const notices: Record<string, string> = {
  suspended: "Empresa suspensa. Os utilizadores deixaram de ter acesso.",
  reactivated: "Empresa reativada.",
  deleted: "Empresa eliminada.",
};

function CompanyStatus({ suspendedAt, createdAt, trialDays }: { suspendedAt: Date | string | null; createdAt: Date | string; trialDays: number | null }) {
  const block = schoolBlock({ createdAt, suspendedAt, deletedAt: null, trialDays });
  if (block === "suspensa") return <Badge tone="danger">Suspensa</Badge>;
  if (block === "trial_expirado") return <Badge tone="warning">Teste terminado</Badge>;
  return <Badge tone={trialDays === null ? "success" : "info"}>{trialDays === null ? "Ativa" : "Em teste"}</Badge>;
}

function TrialInfo({ createdAt, trialDays }: { createdAt: Date | string; trialDays: number | null }) {
  const end = trialEndsAt(createdAt, trialDays);
  if (!end) return <span className="text-muted">Sem limite</span>;
  const left = trialDaysLeft(end);
  return (
    <span className="text-muted">
      {trialDays} dias · até {formatDate(end)}
      {left > 0 ? ` (faltam ${left})` : ""}
    </span>
  );
}

export default async function CompaniesPage({ searchParams }: { searchParams: { saved?: string; error?: string; done?: string } }) {
  await requireSuperAdmin();
  const companies = await listCompanies();
  const error = searchParams.error ? (errors[searchParams.error] ?? "Não foi possível guardar. Verifique os campos e tente novamente.") : null;
  const msg = error ?? (searchParams.done ? notices[searchParams.done] : null) ?? (searchParams.saved ? "Empresa guardada com sucesso." : null);
  return <div className="flex flex-col gap-5">
    {msg ? <p role="status" className={`rounded-xl px-4 py-3 text-sm font-semibold ${error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>{msg}</p> : null}
    <Card><CardHeader title="Registar empresa" description="Cada empresa terá os seus próprios utilizadores e dados." />
      <form action={saveCompanyAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem_auto]">
        <label className="text-xs font-semibold text-muted">Nome da empresa<input required name="name" maxLength={150} className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" placeholder="Escola de Condução" /></label>
        <label className="text-xs font-semibold text-muted">Telefone<input name="phone" maxLength={30} className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" placeholder="84 000 0000" /></label>
        <label className="text-xs font-semibold text-muted">Dias de teste<input type="number" name="trialDays" min={1} max={MAX_TRIAL_DAYS} defaultValue={45} className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" /></label>
        <Button type="submit" className="self-end">Registar empresa</Button>
      </form>
    </Card>
    <Card><CardHeader title="Empresas registadas" description={`${companies.length} empresa(s)`} />
      <Table><THead><tr><Th>Empresa</Th><Th>Estado</Th><Th>Período de teste</Th><Th>Telefone</Th><Th>Utilizadores ativos</Th><Th>Inscrições</Th><Th>Recebido</Th><Th>Desde</Th><Th /></tr></THead>
        <TBody>{companies.map((e) => <Tr key={e.id} id={e.id}><Td className="font-semibold">{e.name}</Td><Td><CompanyStatus suspendedAt={e.suspended_at} createdAt={e.created_at} trialDays={e.trial_days} /></Td><Td><TrialInfo createdAt={e.created_at} trialDays={e.trial_days} /></Td><Td className="text-muted">{e.phone || "—"}</Td><Td><Badge tone="neutral">{Number(e.users)}</Badge></Td><Td>{Number(e.enrollments)}</Td><Td>{formatMoneyMzn(Number(e.received))}</Td><Td className="text-muted">{formatDate(e.created_at)}</Td><Td><details className="text-right"><summary className="cursor-pointer text-xs font-semibold text-brand">Gerir</summary>
          <div className="mt-2 flex min-w-64 flex-col gap-4 text-left">
            <form action={saveCompanyAction} className="flex flex-col gap-2"><input type="hidden" name="id" value={e.id} /><label className="text-xs text-muted">Nome<input required name="name" defaultValue={e.name} maxLength={150} className="mt-1 h-9 w-full rounded-lg bg-night-700 px-3 text-sm text-ink" /></label><label className="text-xs text-muted">Telefone<input name="phone" defaultValue={e.phone ?? ""} maxLength={30} className="mt-1 h-9 w-full rounded-lg bg-night-700 px-3 text-sm text-ink" /></label><label className="text-xs text-muted">Dias de teste (desde o registo)<input type="number" name="trialDays" min={1} max={MAX_TRIAL_DAYS} defaultValue={e.trial_days ?? ""} placeholder="Sem limite" className="mt-1 h-9 w-full rounded-lg bg-night-700 px-3 text-sm text-ink" /><span className="mt-1 block text-[11px] text-subtle">Deixe vazio para uma empresa sem limite.</span></label><Button type="submit" size="sm">Guardar alterações</Button></form>
            <form action={setCompanySuspendedAction}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="suspend" value={e.suspended_at ? "0" : "1"} /><Button type="submit" size="sm" variant="secondary" className="w-full">{e.suspended_at ? "Reativar empresa" : "Suspender empresa"}</Button></form>
            <form action={deleteCompanyAction} className="flex flex-col gap-2 border-t border-white/10 pt-3"><input type="hidden" name="id" value={e.id} /><label className="text-xs text-muted">Para eliminar, escreva: <strong className="text-ink">{e.name}</strong><input required name="confirmName" autoComplete="off" className="mt-1 h-9 w-full rounded-lg bg-night-700 px-3 text-sm text-ink" /></label><Button type="submit" size="sm" variant="danger">Eliminar empresa</Button></form>
          </div>
        </details></Td></Tr>)}</TBody>
      </Table>
      {!companies.length ? <p className="text-sm text-muted">Ainda não há empresas registadas.</p> : null}
    </Card>
  </div>;
}
