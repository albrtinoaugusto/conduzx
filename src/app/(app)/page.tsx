import Link from "next/link";
import { Notice } from "@/components/layout/page-toolbar";
import {
  ButtonLink,
  Card,
  CardHeader,
  Donut,
  PaymentBadge,
  Progress,
  Ring,
  Sparkline,
  StatCard,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import {
  IconArrowRight,
  IconArrowUp,
  IconClipboard,
  IconClock,
  IconPlus,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { longDate, formatDateTime, methodLabel } from "@/lib/labels";
import { requireContext } from "@/server/auth/session";
import { redirect } from "next/navigation";
import { listPending } from "@/server/services/enrollments";
import { getDashboard } from "@/server/services/dashboard";
import { listPayments } from "@/server/services/payments";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("pt-PT", { hour: "numeric", hour12: false, timeZone: "Africa/Maputo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 19 ? "Boa tarde" : "Boa noite";
}

export default async function DashboardPage({ searchParams }: { searchParams: { forbidden?: string } }) {
  const ctx = await requireContext();
  if (ctx.role === "super_admin") redirect("/admin");
  if (!ctx.schoolId) redirect("/admin");
  const [p, recentPayments, pendingItems] = await Promise.all([
    getDashboard(ctx),
    listPayments(ctx, { period: "todos" }),
    listPending(ctx, "pendente"),
  ]);
  const today = longDate();

  const financial = [
    { label: "Pago", value: p.statusCounts.paid, color: "rgb(var(--brand-400))" },
    { label: "Parcial", value: p.statusCounts.partial, color: "rgb(var(--warning))" },
    { label: "Sem pagamento", value: p.statusCounts.unpaid, color: "rgb(var(--danger))" },
  ];
  const financialTotal = financial.reduce((s, f) => s + f.value, 0);

  return (
    <div className="flex flex-col gap-5">
      {searchParams.forbidden ? (
        <Notice tone="brand">Não tem permissão para aceder a essa página.</Notice>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {greeting()}, {ctx.name.split(" ")[0]}. Aqui está o resumo da escola hoje.
        </p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/alunos/novo" variant="secondary" icon={<IconUsers size={16} />}>
            Novo aluno
          </ButtonLink>
          <ButtonLink href="/inscricoes/nova" icon={<IconPlus size={16} />}>
            Nova inscrição
          </ButtonLink>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[repeat(4,minmax(0,1fr))_1.15fr]">
        <StatCard
          label="Recebido este mês"
          value={formatMoneyMzn(p.receivedThisMonth)}
          icon={<IconWallet size={18} />}
          trend={p.receivedChange !== null ? { value: `${p.receivedChange > 0 ? "+" : ""}${p.receivedChange}%`, positive: p.receivedChange >= 0 } : undefined}
          footer={today}
        />
        <StatCard label="Alunos ativos" value={p.activeStudents} icon={<IconUsers size={18} />} footer={today} />
        <StatCard label="Inscrições do mês" value={p.enrollmentsThisMonth} icon={<IconClipboard size={18} />} footer={today} />
        <StatCard
          label="Por registar no INATRO"
          value={p.pending}
          icon={<IconClock size={18} />}
          trend={p.pendingToday ? { value: `${p.pendingToday} hoje`, positive: false } : undefined}
          footer={today}
        />
        <Card className="flex flex-col justify-between gap-3 p-4 sm:col-span-2 xl:col-span-4 xl:flex-row xl:items-center 2xl:col-span-1 2xl:flex-col 2xl:items-stretch">
          <p className="font-display text-base font-bold text-ink">Saldo por receber</p>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success text-night-950 shadow-raised">
              <IconArrowUp size={20} strokeWidth={3} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Em aberto (alunos ativos)</p>
              <p className="font-display text-xl font-bold text-ink">{formatMoneyMzn(p.openBalance)}</p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="text-xs font-semibold text-muted">Recebimentos · 7 dias</span>
            <Sparkline points={p.receipts7Days} width={110} height={36} />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader title="Estado financeiro" description="Inscrições (exceto desistências)" />
          <div className="flex justify-center py-2">
            <Donut
              slices={financial}
              size={170}
              thickness={20}
              center={
                <>
                  <span className="font-display text-3xl font-bold text-ink">{financialTotal}</span>
                  <span className="text-[11px] text-muted">inscrições</span>
                </>
              }
            />
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-3">
            {financial.map((f) => (
              <li key={f.label}>
                <span className="flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.color }} />
                  {f.label}
                </span>
                <span className="mt-1 block font-display text-xl font-bold text-ink">
                  {financialTotal ? Math.round((f.value / financialTotal) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Últimos pagamentos"
            description="Registos imutáveis - anulações ficam visíveis"
            action={
              <Link href="/pagamentos?period=todos" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                Ver todos <IconArrowRight size={14} />
              </Link>
            }
          />
          {recentPayments.rows.length === 0 ? (
            <p className="rounded-xl bg-night-700/50 p-4 text-sm text-muted">Ainda não há pagamentos.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Aluno</Th>
                  <Th>Método</Th>
                  <Th>Data</Th>
                  <Th align="right">Valor</Th>
                </tr>
              </THead>
              <TBody>
                {recentPayments.rows.slice(0, 5).map((pg) => (
                  <Tr key={pg.id}>
                    <Td>
                      <Link href={`/inscricoes/${pg.enrollmentId}`} className="font-semibold hover:text-brand">
                        {pg.student}
                      </Link>
                      <span className="block text-[11px] text-subtle">Categoria {pg.category}</span>
                    </Td>
                    <Td className="text-muted">{methodLabel[pg.method]}</Td>
                    <Td className="text-muted">{formatDateTime(pg.paidAt)}</Td>
                    <Td align="right" className={pg.voidedAt ? "text-subtle line-through" : "font-semibold"}>
                      {formatMoneyMzn(pg.amountCents)}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader
            title="Pendências INATRO"
            description="Para concluir quando o sistema voltar"
            action={
              <Link href="/pendencias" className="text-xs font-semibold text-brand hover:underline">
                Ver todas
              </Link>
            }
          />
          {pendingItems.length === 0 ? (
            <p className="rounded-xl bg-night-700/50 p-4 text-sm text-muted">Sem pendências. Bom trabalho!</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {pendingItems.slice(0, 4).map((i) => (
                <li key={i.id}>
                  <Link href={`/inscricoes/${i.id}`} className="flex items-center gap-3 rounded-xl bg-night-700/50 px-3 py-2.5 transition hover:bg-night-700">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-brand" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{i.student}</span>
                      <span className="block truncate text-[11px] text-subtle">
                        {i.category}
                        {i.inatroNote ? ` · ${i.inatroNote}` : ""}
                      </span>
                    </span>
                    <PaymentBadge status={i.paymentStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Indicadores da operação" description="Todas as inscrições" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Taxa de cobrança", sub: "Pago vs total", value: p.collectionRate, color: "rgb(var(--brand-400))" },
              { label: "Registados INATRO", sub: "Do total de inscrições", value: p.registrationRate, color: "rgb(var(--info))" },
              { label: "Alunos concluídos", sub: "Do total de inscrições", value: p.completionRate, color: "rgb(var(--success))" },
            ].map((k) => (
              <div key={k.label} className="flex items-center gap-3 rounded-xl bg-night-700/40 p-3">
                <Ring value={k.value} color={k.color} size={54} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight text-ink">{k.label}</p>
                  <p className="text-[11px] leading-tight text-subtle">{k.sub}</p>
                </div>
              </div>
            ))}
          </div>
          {p.byCategory.length ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {p.byCategory.map((c) => (
                <div key={c.name}>
                  <div className="mb-1.5 flex justify-between gap-2 text-xs">
                    <span className="truncate font-semibold text-ink">{c.name}</span>
                    <span className="whitespace-nowrap text-muted">
                      {c.students} aluno(s) · {c.paidPct}% pago
                    </span>
                  </div>
                  <Progress value={c.paidPct} />
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
