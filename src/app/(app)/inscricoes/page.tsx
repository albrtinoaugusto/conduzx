import Link from "next/link";
import { PageToolbar, Pagination, EmptyState, withQuery } from "@/components/layout/page-toolbar";
import {
  ButtonLink,
  Card,
  PaymentBadge,
  InatroBadge,
  Progress,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { IconPlus } from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatDate } from "@/lib/labels";
import { requireContext } from "@/server/auth/session";
import { summarizeFinancials } from "@/server/domain/finance";
import { listEnrollments, type PaymentStatusFilter } from "@/server/services/enrollments";

const PAYMENT_STATUSES: PaymentStatusFilter[] = ["sem_pagamento", "parcial", "pago"];

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: { q?: string; paymentStatus?: string; page?: string };
}) {
  const ctx = await requireContext();
  const q = searchParams.q ?? "";
  const paymentStatus = PAYMENT_STATUSES.includes(searchParams.paymentStatus as PaymentStatusFilter)
    ? (searchParams.paymentStatus as PaymentStatusFilter)
    : undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const { rows, total, pages } = await listEnrollments(ctx, { q, paymentStatus, page });

  const filters = [
    { label: "Todas", value: undefined },
    { label: "Sem pagamento", value: "sem_pagamento" },
    { label: "Parcial", value: "parcial" },
    { label: "Pago", value: "pago" },
  ].map((f) => ({ label: f.label, href: withQuery("/inscricoes", { q, paymentStatus: f.value }), active: paymentStatus === f.value }));

  return (
    <>
      <PageToolbar
        filters={filters}
        search={{ placeholder: "Aluno, BI ou categoria", amount: q, keep: { paymentStatus } }}
        action={
          <ButtonLink href="/inscricoes/nova" icon={<IconPlus size={16} />}>
            Nova inscrição
          </ButtonLink>
        }
      />
      {rows.length === 0 ? (
        <EmptyState title="Nenhuma inscrição encontrada" text="Ajuste os filtros ou crie uma nova inscrição." />
      ) : (
        <Card>
          <p className="mb-2 text-xs text-subtle">{total} inscrição(ões)</p>
          <Table className="min-w-[860px]">
            <THead>
              <tr>
                <Th>Aluno</Th>
                <Th>Categoria</Th>
                <Th align="right">Total</Th>
                <Th className="w-44">Pago</Th>
                <Th>Pagamento</Th>
                <Th>INATRO</Th>
              </tr>
            </THead>
            <TBody>
              {rows.map((i) => {
                const f = summarizeFinancials(i.total, i.paid);
                return (
                  <Tr key={i.id}>
                    <Td>
                      <Link href={`/inscricoes/${i.id}`} className="font-semibold hover:text-brand">
                        {i.student}
                      </Link>
                      <span className="block text-[11px] text-subtle">Inscrito em {formatDate(i.enrollmentDate)}</span>
                    </Td>
                    <Td className="text-muted">{i.category}</Td>
                    <Td align="right" className="font-semibold">
                      {formatMoneyMzn(i.total)}
                    </Td>
                    <Td>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="text-muted">{formatMoneyMzn(i.paid)}</span>
                        <span className="font-bold text-ink">{f.percentage}%</span>
                      </div>
                      <Progress value={f.percentage} tone={f.paymentStatus === "pago" ? "success" : f.paymentStatus === "parcial" ? "warning" : "danger"} />
                    </Td>
                    <Td>
                      <PaymentBadge status={i.paymentStatus} />
                    </Td>
                    <Td>
                      <InatroBadge status={i.inatroStatus} />
                      {i.inatroProcessNumber ? (
                        <span className="mt-1 block font-mono text-[10px] text-subtle">{i.inatroProcessNumber}</span>
                      ) : null}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
          <Pagination page={page} pages={pages} href={(p) => withQuery("/inscricoes", { q, paymentStatus, page: p })} />
        </Card>
      )}
    </>
  );
}
