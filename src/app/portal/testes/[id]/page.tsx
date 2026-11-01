import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/cn";
import { requireStudent } from "@/server/auth/student-session";
import { getAttemptView } from "@/server/services/practice-exams";
import { ExamClient } from "./exam-client";

export const metadata: Metadata = { title: "Teste - ConduzX" };

export default async function ExamPage({ params }: { params: { id: string } }) {
  const student = await requireStudent();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const view = await getAttemptView(student, params.id);
  if (!view) notFound();

  if (view.status === "finished") {
    const total = view.correct + view.wrong;
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-night-900 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-center">
        <p className="animate-fade-up text-sm font-semibold uppercase tracking-[0.2em] text-muted">Resultado do teste</p>
        <h1 className={cn("mt-3 animate-pop font-display text-[clamp(2.25rem,12.5vw,5.5rem)] font-black leading-none", view.passed ? "text-success" : "text-danger")}>
          {view.passed ? "APROVADO" : "REPROVADO"}
        </h1>
        <dl className="mt-8 grid w-full max-w-sm animate-fade-up grid-cols-2 gap-3 [animation-delay:200ms]">
          <div className="rounded-3xl bg-night-800 p-4 shadow-card">
            <dt className="text-xs text-muted">Respostas corretas</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold text-success">
              {view.correct}/{total}
            </dd>
          </div>
          <div className="rounded-3xl bg-night-800 p-4 shadow-card">
            <dt className="text-xs text-muted">Respostas erradas</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold text-danger">
              {view.wrong}/{total}
            </dd>
          </div>
        </dl>
        <Link href="/portal/testes" className="mt-8 flex h-14 w-full max-w-sm animate-fade-up items-center justify-center rounded-full bg-brand text-base font-bold text-brand-ink shadow-glow transition [animation-delay:300ms] active:scale-[0.98]">
          Fechar
        </Link>
      </main>
    );
  }

  return (
    <ExamClient
      attemptId={params.id}
      student={{ name: student.fullName, idNumber: student.idNumber }}
      questions={view.questions}
      initialAnswers={view.answers}
      remainingMs={view.remainingMs}
    />
  );
}
