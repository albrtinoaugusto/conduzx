import Link from "next/link";
import { PageToolbar, Pagination, EmptyState, withQuery } from "@/components/layout/page-toolbar";
import { Badge, ButtonLink, Card, StatCard, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { IconAlert, IconCheck, IconPlus, IconWallet } from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatDateTime, methodLabel } from "@/lib/labels";
import { requireContext } from "@/server/auth/session";
import { can } from "@/server/domain/permissions";
import { listPayments, type Period } from "@/server/services/payments";
import { VoidPayment } from "../inscricoes/enrollment-actions";

const PERIODS: Array<[Period, string]> = [
  ["hoje", "Hoje"],
  ["semana", "Esta semana"],
  ["mes", "Este mês"],
  ["todos", "Todos"],
  ["anulados", "Anulados"],
];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { period?: string; q?: string; page?: string };
}) {
  const ctx = await requireContext();
  const period = (PERIODS.find(([p]) => p === searchParams.period)?.[0] ?? "mes") as Period;
  const q = searchParams.q ?? "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const r = await listPayments(ctx, { period, q, page });
  const canVoid = can(ctx.role, "void_payment");

  return (
    <>
      <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Recebido no período" value={formatMoneyMzn(r.received)} icon={<IconWallet size={18} />} />
        <StatCard label="Pagamentos válidos" value={r.validCount} icon={<IconCheck size={18} />} />
        <StatCard label="Anulados" value={r.voidedCount} icon={<IconAlert size={18} />} />
      </section>

      <PageToolbar
        filters={PERIODS.map(([p, l]) => ({ label: l, href: withQuery("/pagamentos", { period: p, q }), active: p === period }))}
        search={{ placeholder: "Aluno ou referência", amount: q, keep: { period } }}
        action={
          <ButtonLink href="/inscricoes" icon={<IconPlus size={16} />} variant="secondary">
            Registar pagamento
          </ButtonLink>
        }
      />
      <p className="-mt-2 mb-4 text-xs text-subtle">Para registar um pagamento, abra a inscrição do aluno.</p>

      {r.rows.length === 0 ? (
        <EmptyState title="Sem pagamentos neste período" text="Experimente outro filtro." />
      ) : (
        <Card>
          <Table className="min-w-[820px]">
            <THead>
              <tr>
                <Th>Data</Th>
                <Th>Aluno</Th>
                <Th>Método</Th>
                <Th>Registado por</Th>
                <Th align="right">Valor</Th>
                <Th>Estado</Th>
              </tr>
            </THead>
            <TBody>
              {r.rows.map((p) => (
                <Tr key={p.id} className={p.voidedAt ? "opacity-70" : undefined}>
                  <Td className="text-muted">{formatDateTime(p.paidAt)}</Td>
                  <Td>
                    <Link href={`/inscricoes/${p.enrollmentId}`} className="font-semibold hover:text-brand">
                      {p.student}
                    </Link>
                    <span className="block text-[11px] text-subtle">Categoria {p.category}</span>
                  </Td>
                  <Td className="text-muted">
                    {methodLabel[p.method]}
                    {p.reference ? <span className="block text-[10px] text-subtle">Ref. {p.reference}</span> : null}
                  </Td>
                  <Td className="text-muted">{p.recordedBy ?? "—"}</Td>
                  <Td align="right" className={p.voidedAt ? "text-subtle line-through" : "font-semibold"}>
                    {formatMoneyMzn(p.amountCents)}
                  </Td>
                  <Td>
                    {p.voidedAt ? (
                      <>
                        <Badge tone="danger" dot>
                          Anulado
                        </Badge>
                        <span className="mt-1 block max-w-[14rem] text-[10px] text-subtle">
                          {p.voidReason} · {p.voidedBy}
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge tone="success" dot>
                          Válido
                        </Badge>
                        {canVoid ? <VoidPayment paymentId={p.id} amount={p.amountCents} /> : null}
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <Pagination page={page} pages={r.pages} href={(n) => withQuery("/pagamentos", { period, q, page: n })} />
        </Card>
      )}
    </>
  );
}
