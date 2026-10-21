import Link from "next/link";
import { Badge, ButtonLink, Card, CardHeader, StatCard, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { IconPlus, IconUsers, IconWallet, IconClipboard } from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatDate } from "@/lib/labels";
import { requireSuperAdmin } from "@/server/auth/session";
import { listCompanies, globalSummary } from "@/server/services/super-admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireSuperAdmin();
  const [r, companies] = await Promise.all([globalSummary(), listCompanies()]);
  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">Resumo geral das empresas registadas no ConduzX.</p>
      <ButtonLink href="/admin/empresas" icon={<IconPlus size={16} />}>Nova empresa</ButtonLink>
    </div>
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Empresas" value={r.companies} icon={<IconUsers size={18} />} />
      <StatCard label="Administradores ativos" value={r.admins} icon={<IconUsers size={18} />} />
      <StatCard label="Inscrições" value={r.enrollments} icon={<IconClipboard size={18} />} />
      <StatCard label="Recebido este mês" value={formatMoneyMzn(r.receivedThisMonth)} icon={<IconWallet size={18} />} />
    </section>
    <Card>
      <CardHeader title="Empresas" description="Indicadores acumulados por empresa" action={<Link href="/admin/empresas" className="text-xs font-semibold text-brand hover:underline">Ver empresas</Link>} />
      <Table><THead><tr><Th>Empresa</Th><Th>Utilizadores ativos</Th><Th>Inscrições</Th><Th>Recebido</Th><Th>Desde</Th></tr></THead>
        <TBody>{companies.slice(0, 8).map((e) => <Tr key={e.id}><Td><Link className="font-semibold hover:text-brand" href={`/admin/empresas#${e.id}`}>{e.name}</Link></Td><Td><Badge tone="neutral">{Number(e.users)}</Badge></Td><Td>{Number(e.enrollments)}</Td><Td className="font-semibold">{formatMoneyMzn(Number(e.received))}</Td><Td className="text-muted">{formatDate(e.created_at)}</Td></Tr>)}</TBody>
      </Table>
      {companies.length === 0 ? <p className="text-sm text-muted">Ainda não há empresas registadas.</p> : null}
    </Card>
  </div>;
}
