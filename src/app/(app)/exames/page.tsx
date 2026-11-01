import Link from "next/link";
import { EmptyState, PageToolbar, withQuery } from "@/components/layout/page-toolbar";
import { ActionForm, SubmitButton } from "@/components/forms/form";
import { Badge, Card, Progress } from "@/components/ui";
import { IconCheck, IconShield } from "@/components/ui/icons";
import { formatDate } from "@/lib/labels";
import { acknowledgeExamNoticeAction } from "@/server/actions/enrollments";
import { requireContext } from "@/server/auth/session";
import { THEORY_EXAM_DAYS, theoryExamProgress, todayInMaputo } from "@/server/domain/theory-exam";
import { listExamTracking } from "@/server/services/theory-exam";

const FILTERS = [
  ["prontos", "Prontos"],
  ["contagem", "Em contagem"],
  ["sem_data", "Sem primeira aula"],
] as const;

export default async function TheoryExamPage({ searchParams }: { searchParams: { filter?: string } }) {
  const ctx = await requireContext("operate");
  const filter = FILTERS.find(([f]) => f === searchParams.filter)?.[0] ?? "prontos";
  const today = todayInMaputo();

  const rows = (await listExamTracking(ctx)).map((r) => ({
    ...r,
    progress: r.firstLessonDate ? theoryExamProgress(r.firstLessonDate, today) : null,
  }));
  const groups = {
    prontos: rows.filter((r) => r.progress?.ready),
    contagem: rows.filter((r) => r.progress && !r.progress.ready).sort((a, b) => a.progress!.daysLeft - b.progress!.daysLeft),
    sem_data: rows.filter((r) => !r.progress),
  };
  const list = groups[filter];

  return (
    <>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink">
          <IconShield size={18} />
        </span>
        <p className="text-sm text-ink">
          A contagem de <strong>{THEORY_EXAM_DAYS} dias</strong> começa na primeira aula. Ao terminar, o aluno fica pronto para fazer o exame teórico nas instalações do INATRO.
        </p>
      </div>

      <PageToolbar
        filters={FILTERS.map(([f, l]) => ({
          label: `${l} (${groups[f].length})`,
          href: withQuery("/exames", { filter: f === "prontos" ? undefined : f }),
          active: f === filter,
        }))}
      />

      {list.length === 0 ? (
        <EmptyState
          title={filter === "prontos" ? "Nenhum aluno pronto" : filter === "contagem" ? "Nenhuma contagem a decorrer" : "Todas as inscrições têm data"}
          text={filter === "sem_data" ? "Todas as inscrições ativas já têm a data da primeira aula." : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/inscricoes/${r.id}`} className="block truncate font-display text-base font-bold text-ink hover:text-brand">
                    {r.student}
                  </Link>
                  <p className="text-xs text-subtle">
                    {r.category}
                    {r.phone ? ` · ${r.phone}` : ""}
                  </p>
                </div>
                {r.progress?.ready ? (
                  <Badge tone={r.noticeSeenAt ? "neutral" : "success"} dot>
                    {r.noticeSeenAt ? "Avisado" : "Pronto"}
                  </Badge>
                ) : null}
              </div>

              {r.progress ? (
                <>
                  <Progress value={r.progress.percentage} tone={r.progress.ready ? "success" : "warning"} />
                  <p className="text-xs text-muted">
                    Primeira aula: {formatDate(r.firstLessonDate)} ·{" "}
                    {r.progress.ready
                      ? `pronto desde ${formatDate(r.progress.readyDate)}`
                      : r.progress.started
                        ? `faltam ${r.progress.daysLeft} dia(s)`
                        : "aulas ainda não começaram"}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted">
                  Inscrito em {formatDate(r.enrollmentDate)}.{" "}
                  <Link href={`/inscricoes/${r.id}`} className="font-semibold text-brand hover:underline">
                    Indicar primeira aula
                  </Link>
                </p>
              )}

              {r.progress?.ready && !r.noticeSeenAt ? (
                <ActionForm action={acknowledgeExamNoticeAction} className="mt-auto flex justify-end">
                  <input type="hidden" name="enrollmentId" value={r.id} />
                  <SubmitButton variant="secondary" size="sm" icon={<IconCheck size={14} />} pendingLabel="A confirmar…">
                    Já avisei
                  </SubmitButton>
                </ActionForm>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
