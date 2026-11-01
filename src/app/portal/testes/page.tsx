import type { Metadata } from "next";
import { Badge } from "@/components/ui";
import { IconClock, IconLock, IconShield } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/labels";
import { requireStudent } from "@/server/auth/student-session";
import { EXAM_DURATION_S, EXAM_PASS_MARK, EXAM_QUESTIONS } from "@/server/domain/practice-exam";
import { getPracticeHome } from "@/server/services/practice-exams";
import { PortalShell } from "../portal-shell";
import { StartExamButton } from "./start-exam-button";

export const metadata: Metadata = { title: "Testes - ConduzX" };

export default async function PracticeHomePage() {
  const student = await requireStudent();
  const { access, open, finished, bankReady } = await getPracticeHome(student);

  const rules = [
    [IconShield, `${EXAM_QUESTIONS} perguntas`],
    [IconClock, `${EXAM_DURATION_S / 60} minutos`],
    [IconShield, `Aprova com ${EXAM_PASS_MARK} certas`],
  ] as const;

  return (
    <PortalShell school={student.schoolName} active="testes">
      <h1 className="pb-1 pt-2 font-display text-[clamp(1.5rem,7vw,2rem)] font-extrabold leading-tight text-ink">Testes de prática</h1>
      <p className="text-sm text-muted">Treine nas mesmas condições do exame teórico. Este simulador não é o exame oficial do INATRO.</p>

      <ul className="mt-4 grid grid-cols-3 gap-2">
        {rules.map(([Icon, label]) => (
          <li key={label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-night-800 p-3 text-center text-xs font-semibold text-ink shadow-card">
            <Icon size={18} className="text-brand" />
            {label}
          </li>
        ))}
      </ul>

      <section className="mt-4 rounded-3xl bg-night-800 p-5 shadow-card">
        {!access ? (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-night-700 text-brand">
              <IconLock size={22} />
            </span>
            <h2 className="mt-3 font-display text-lg font-bold text-ink">Ative o acesso aos testes</h2>
            <p className="mt-1 text-sm text-muted">
              Peça a ativação na secretaria de {student.schoolName} e faça o pagamento lá. O acesso fica disponível logo a seguir.
            </p>
            {student.schoolPhone ? (
              <a href={`tel:${student.schoolPhone.replace(/\s/g, "")}`} className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-brand font-semibold text-brand-ink shadow-glow transition active:scale-[0.98]">
                Ligar para a escola
              </a>
            ) : null}
          </>
        ) : !bankReady ? (
          <p className="text-sm text-muted">Os testes ainda não estão disponíveis. Tente novamente mais tarde.</p>
        ) : (
          <>
            <h2 className="font-display text-lg font-bold text-ink">{open ? "Tem um teste a decorrer" : "Pronto para começar?"}</h2>
            <p className="mb-4 mt-1 text-sm text-muted">
              {open ? "O tempo continua a contar. Volte ao teste para o terminar." : "O tempo começa a contar assim que iniciar."}
            </p>
            <StartExamButton resume={Boolean(open)} />
          </>
        )}
      </section>

      {finished.length ? (
        <section className="mt-6">
          <h2 className="mb-2 font-display text-base font-bold text-ink">Últimos resultados</h2>
          <ul className="flex flex-col gap-2">
            {finished.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-night-800 p-4">
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold text-ink">{a.correct}/{EXAM_QUESTIONS}</p>
                  <p className="text-xs text-subtle">{formatDateTime(a.finishedAt)}</p>
                </div>
                <Badge tone={a.passed ? "success" : "danger"} dot>
                  {a.passed ? "Aprovado" : "Reprovado"}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PortalShell>
  );
}
