import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoryList } from "@/components/history-list";
import { Notice } from "@/components/layout/page-toolbar";
import {
  StudentBadge,
  Badge,
  Card,
  CardHeader,
  PaymentBadge,
  InatroBadge,
  Ring,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatDate, formatDateTime, methodLabel } from "@/lib/labels";
import { requireContext } from "@/server/auth/session";
import { summarizeFinancials } from "@/server/domain/finance";
import { can } from "@/server/domain/permissions";
import { listHistory } from "@/server/services/history";
import { getEnrollment } from "@/server/services/enrollments";
import {
  VoidPayment,
  StudentStatusForm,
  InatroStatusForm,
  RecordPayment,
} from "../enrollment-actions";

export default async function EnrollmentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  const ctx = await requireContext();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const i = await getEnrollment(ctx, params.id);
  if (!i) notFound();

  const f = summarizeFinancials(i.total, i.paid);
  const canVoid = can(ctx.role, "void_payment");
  const history = can(ctx.role, "view_history")
    ? await listHistory(ctx, { entityIds: [i.id, ...i.payments.map((p) => p.id)], limit: 20 })
    : [];

  return (
    <>
      {searchParams.created ? <Notice>Inscrição criada com sucesso.</Notice> : null}

      {/* Cabeçalho */}
      <Card className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-center">
        <Ring value={f.percentage} size={84} thickness={8} color={f.paymentStatus === "pago" ? "rgb(var(--success))" : "rgb(var(--brand-400))"} />
        <div className="min-w-0 flex-1">
          <Link href={`/alunos/${i.studentId}`} className="font-display text-xl font-bold text-ink hover:text-brand">
            {i.student}
          </Link>
          <p className="text-sm text-muted">
            {i.category} · inscrito em {formatDate(i.enrollmentDate)}
            {i.createdBy ? ` por ${i.createdBy}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <PaymentBadge status={i.paymentStatus} />
            <InatroBadge status={i.inatroStatus} />
            <StudentBadge status={i.studentStatus} />
          </div>
        </div>
        <dl className="grid shrink-0 grid-cols-3 gap-4 text-center lg:text-right">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Total</dt>
            <dd className="font-display text-lg font-bold text-ink">{formatMoneyMzn(f.totalCents)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Pago</dt>
            <dd className="font-display text-lg font-bold text-success">{formatMoneyMzn(f.paidCents)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Saldo</dt>
            <dd className="font-display text-lg font-bold text-brand">{formatMoneyMzn(f.balanceCents)}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Pagamentos" description="Registos imutáveis — erros corrigem-se com anulação" />
            {i.payments.length === 0 ? (
              <p className="rounded-xl bg-night-700/50 p-4 text-sm text-muted">Ainda não há pagamentos.</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Método</Th>
                    <Th>Registado por</Th>
                    <Th align="right">Valor</Th>
                    <Th>Estado</Th>
                  </tr>
                </THead>
                <TBody>
                  {i.payments.map((p) => (
                    <Tr key={p.id} className={p.voidedAt ? "opacity-70" : undefined}>
                      <Td className="text-muted">{formatDateTime(p.paidAt)}</Td>
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
                        ) : canVoid ? (
                          <VoidPayment paymentId={p.id} amount={p.amountCents} />
                        ) : (
                          <Badge tone="success" dot>
                            Válido
                          </Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          {history.length ? (
            <Card>
              <CardHeader title="Histórico" />
              <HistoryList rows={history} />
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Registar pagamento" description={`Em falta: ${formatMoneyMzn(f.balanceCents)}`} />
            <RecordPayment enrollmentId={i.id} balanceCents={f.balanceCents} />
          </Card>
          <Card>
            <CardHeader
              title="INATRO"
              description={i.inatroLastAttempt ? `Última tentativa: ${formatDateTime(i.inatroLastAttempt)}` : "Estado manual — não há integração"}
            />
            <InatroStatusForm enrollmentId={i.id} status={i.inatroStatus} processNumber={i.inatroProcessNumber} note={i.inatroNote} />
          </Card>
          <Card>
            <StudentStatusForm enrollmentId={i.id} status={i.studentStatus} />
          </Card>
        </div>
      </div>
    </>
  );
}
