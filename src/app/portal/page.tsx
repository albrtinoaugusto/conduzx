import type { Metadata } from "next";
import Link from "next/link";
import { StudentBadge, InatroBadge, PaymentBadge, Progress, Ring } from "@/components/ui";
import { IconArrowRight, IconClipboard } from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatDate } from "@/lib/labels";
import { requireStudent } from "@/server/auth/student-session";
import { summarizeFinancials } from "@/server/domain/finance";
import { THEORY_EXAM_DAYS, theoryExamProgress } from "@/server/domain/theory-exam";
import { listMyEnrollments } from "@/server/services/portal";
import { StudentPhoto } from "./student-photo";
import { PortalShell } from "./portal-shell";

export const metadata: Metadata = { title: "A minha situação - ConduzX" };

export default async function PortalPage() {
  const student = await requireStudent();
  const enrollments = await listMyEnrollments(student);

  return (
    <PortalShell school={student.schoolName} active="situacao">
      <div className="flex items-center gap-4 pb-5 pt-2">
        <StudentPhoto name={student.fullName} className="h-16 w-16 rounded-2xl text-lg" />
        <div className="min-w-0">
          <p className="text-xs text-muted">Olá,</p>
          <h1 className="font-display text-[clamp(1.2rem,5.5vw,1.5rem)] font-extrabold leading-tight text-ink [overflow-wrap:anywhere]">{student.fullName}</h1>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <p className="rounded-3xl bg-night-800 p-5 text-sm text-muted">Ainda não tem inscrições. Fale com a secretaria da sua escola.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {enrollments.map((e) => {
            const f = summarizeFinancials(e.total, e.paid);
            const exam = e.firstLessonDate ? theoryExamProgress(e.firstLessonDate) : null;
            return (
              <section key={e.id} className="rounded-3xl bg-night-800 p-5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-bold text-ink">{e.category}</h2>
                  <StudentBadge status={e.studentStatus} />
                </div>
                <p className="mt-0.5 text-xs text-subtle">Inscrito em {formatDate(e.enrollmentDate)}</p>

                <div className="mt-4 rounded-2xl bg-night-700/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-subtle">Exame teórico</p>
                  {exam?.ready ? (
                    <p className="mt-2 font-display text-base font-bold text-success">Já está pronto para o exame teórico no INATRO</p>
                  ) : exam ? (
                    <div className="mt-2 flex items-center gap-4">
                      <Ring value={exam.percentage} size={68} thickness={7} color="rgb(var(--brand-400))" />
                      <div className="min-w-0">
                        <p className="font-display text-2xl font-extrabold text-brand">{exam.daysLeft} dias</p>
                        <p className="text-xs text-muted">
                          {exam.started ? `Faltam para o exame · a partir de ${formatDate(exam.readyDate)}` : `As aulas começam a ${formatDate(e.firstLessonDate)}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted">A contagem de {THEORY_EXAM_DAYS} dias começa na primeira aula. A escola ainda não indicou a data.</p>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">Pagamentos</p>
                    <PaymentBadge status={e.paymentStatus} />
                  </div>
                  <Progress value={f.percentage} tone={f.paymentStatus === "pago" ? "success" : "warning"} className="mt-2" />
                  <dl className="mt-2 flex justify-between gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-subtle">Pago</dt>
                      <dd className="font-semibold text-success">{formatMoneyMzn(f.paidCents)}</dd>
                    </div>
                    <div className="text-right">
                      <dt className="text-xs text-subtle">Em falta</dt>
                      <dd className="font-semibold text-brand">{formatMoneyMzn(f.balanceCents)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
                  <p className="text-sm font-semibold text-ink">INATRO</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {e.inatroProcessNumber ? <span className="text-xs text-muted">Nº {e.inatroProcessNumber}</span> : null}
                    <InatroBadge status={e.inatroStatus} />
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Link href="/portal/testes" className="mt-4 flex items-center gap-3 rounded-3xl bg-brand p-4 text-brand-ink shadow-glow transition active:scale-[0.98]">
        <IconClipboard size={22} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-extrabold">Treine para o exame</span>
          <span className="block text-xs font-medium">Testes com 25 perguntas em 25 minutos</span>
        </span>
        <IconArrowRight size={20} className="shrink-0" />
      </Link>
    </PortalShell>
  );
}
