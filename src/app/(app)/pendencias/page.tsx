import Link from "next/link";
import { PageToolbar, EmptyState, withQuery } from "@/components/layout/page-toolbar";
import { Card, PaymentBadge, InatroBadge } from "@/components/ui";
import { IconAlert } from "@/components/ui/icons";
import { formatDate, formatDateTime } from "@/lib/labels";
import { requireContext } from "@/server/auth/session";
import { listPending } from "@/server/services/enrollments";
import { KeepPending, MarkRegistered } from "../inscricoes/enrollment-actions";

const FILTERS = [
  ["todos", "Por registar"],
  ["pendente", "Pendentes"],
  ["nao_registado", "Não registados"],
] as const;

export default async function PendingPage({ searchParams }: { searchParams: { filter?: string } }) {
  const ctx = await requireContext();
  const filter = FILTERS.find(([f]) => f === searchParams.filter)?.[0] ?? "todos";
  const list = await listPending(ctx, filter);

  return (
    <>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink">
          <IconAlert size={18} />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">O estado do INATRO é registado manualmente.</p>
          <p className="text-xs text-muted">
            Quando o sistema oficial voltar, conclua o registo e marque como “Registado” com o número de processo. As mais antigas aparecem primeiro.
          </p>
        </div>
      </div>

      <PageToolbar filters={FILTERS.map(([f, l]) => ({ label: l, href: withQuery("/pendencias", { filter: f === "todos" ? undefined : f }), active: f === filter }))} />

      {list.length === 0 ? (
        <EmptyState title="Sem pendências" text="Todas as inscrições ativas estão registadas no INATRO." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((i) => (
            <Card key={i.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/inscricoes/${i.id}`} className="block truncate font-display text-base font-bold text-ink hover:text-brand">
                    {i.student}
                  </Link>
                  <p className="text-xs text-subtle">
                    {i.category} · desde {formatDate(i.enrollmentDate)}
                  </p>
                </div>
                <InatroBadge status={i.inatroStatus} />
              </div>
              <div className="min-h-[2.5rem] rounded-xl bg-night-700/60 px-3 py-2 text-xs text-muted shadow-pressed">
                {i.inatroNote ?? "Sem notas sobre tentativas de registo."}
                {i.inatroLastAttempt ? (
                  <span className="mt-1 block text-[10px] text-subtle">Última tentativa: {formatDateTime(i.inatroLastAttempt)}</span>
                ) : null}
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                <PaymentBadge status={i.paymentStatus} />
                <div className="flex gap-2">
                  <KeepPending enrollmentId={i.id} note={i.inatroNote} />
                  <MarkRegistered enrollmentId={i.id} compact />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
