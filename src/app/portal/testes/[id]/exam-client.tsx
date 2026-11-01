"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { IconAlert, IconArrowLeft, IconArrowRight, IconSteering } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { finishExamAction, saveExamAnswersAction } from "@/server/actions/portal";
import { StudentPhoto } from "../../student-photo";

type Question = { id: string; text: string; imageUrl: string | null; options: string[] };
type Answers = Record<string, number>;

const LETTERS = ["A", "B", "C", "D"];

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ExamClient({
  attemptId,
  student,
  questions,
  initialAnswers,
  remainingMs,
}: {
  attemptId: string;
  student: { name: string; idNumber: string | null };
  questions: Question[];
  initialAnswers: Answers;
  remainingMs: number;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const [secondsLeft, setSecondsLeft] = useState(() => Math.ceil(remainingMs / 1000));
  const [confirming, setConfirming] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const dirty = useRef(false);
  const submitted = useRef(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const question = questions[index];
  const unanswered = questions.filter((q) => answers[q.id] === undefined).length;
  const last = questions.length - 1;

  /** Guarda só quando há algo novo: poupa dados móveis. Sem rede, volta a tentar na próxima mudança. */
  const flush = useCallback(() => {
    if (!dirty.current || submitted.current) return;
    dirty.current = false;
    saveExamAnswersAction(attemptId, answersRef.current).catch(() => {
      dirty.current = true;
    });
  }, [attemptId]);

  const finish = useCallback(() => {
    submitted.current = true;
    setConfirming(false);
    setFinishError(null);
    startSubmit(async () => {
      try {
        const res = await finishExamAction(attemptId, answersRef.current);
        if (res.error) throw new Error(res.error);
        router.refresh();
      } catch {
        submitted.current = false;
        setFinishError("Não foi possível enviar o teste. Verifique a ligação e tente novamente.");
      }
    });
  }, [attemptId, router]);

  // O relógio é calculado a partir de um prazo fixo: não atrasa se o telemóvel suspender a página
  useEffect(() => {
    const deadline = Date.now() + remainingMs;
    const update = () => setSecondsLeft(Math.max(Math.ceil((deadline - Date.now()) / 1000), 0));
    update();
    const timer = setInterval(update, 1000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [remainingMs]);

  const timeUp = secondsLeft === 0;
  useEffect(() => {
    if (timeUp && !submitted.current) finish();
  }, [timeUp, finish]);

  // Guarda ao sair da aplicação (chamada, troca de app)
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [flush]);

  // Mantém o número atual visível no mapa
  useEffect(() => {
    mapRef.current?.querySelector(`[data-q="${index}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  const goTo = (next: number) => {
    if (next < 0 || next > last || next === index) return;
    flush();
    setDirection(next > index ? "next" : "prev");
    setIndex(next);
    setVisited((v) => new Set(v).add(next));
  };

  const select = (option: number) => {
    dirty.current = true;
    setAnswers((a) => ({ ...a, [question.id]: option }));
  };

  const locked = submitting || submitted.current;
  const lowTime = secondsLeft <= 60;

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-6xl flex-col bg-night-900">
      <header className="shrink-0 px-3 pb-2 pt-[max(0.625rem,env(safe-area-inset-top))] sm:px-5">
        <div className="flex items-center gap-3">
          <StudentPhoto name={student.name} className="h-10 w-10 rounded-xl text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{student.name}</p>
            <p className="truncate text-[11px] text-subtle">{student.idNumber ? `BI ${student.idNumber}` : "Teste de prática"}</p>
          </div>
          <p
            role="timer"
            aria-label={`Tempo restante: ${formatTime(secondsLeft)}`}
            className={cn(
              "shrink-0 rounded-2xl px-3 py-1.5 font-display text-xl font-extrabold tabular-nums sm:text-2xl",
              lowTime ? "animate-tick-alert bg-danger text-night-950" : secondsLeft <= 300 ? "bg-warning/20 text-warning" : "bg-night-700 text-brand",
            )}
          >
            {formatTime(secondsLeft)}
          </p>
        </div>

        <div ref={mapRef} role="navigation" aria-label="Perguntas" className="-mx-3 mt-1.5 flex gap-1.5 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] sm:-mx-5 sm:px-5 lg:overflow-visible">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              data-q={i}
              onClick={() => goTo(i)}
              aria-label={`Pergunta ${i + 1}${answers[q.id] !== undefined ? ", respondida" : ""}`}
              aria-current={i === index ? "true" : undefined}
              className={cn(
                "h-10 w-10 shrink-0 rounded-xl text-sm font-bold transition duration-150 active:scale-90 lg:w-auto lg:flex-1",
                answers[q.id] !== undefined
                  ? "bg-brand text-brand-ink"
                  : visited.has(i)
                    ? "bg-brand/20 text-brand"
                    : "bg-night-700 text-muted",
                i === index && "ring-2 ring-ink ring-offset-2 ring-offset-night-900",
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-5">
        <div key={question.id} className={cn("grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]", direction === "next" ? "animate-slide-next" : "animate-slide-prev")}>
          <div className="flex h-[clamp(9rem,26dvh,16rem)] items-center justify-center overflow-hidden rounded-3xl bg-night-800 p-2 shadow-card lg:h-[min(60dvh,28rem)]">
            {question.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={question.imageUrl} alt="Imagem de apoio à pergunta" className="h-full w-full rounded-2xl object-contain" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-night-600" aria-hidden="true">
                <IconSteering size={56} />
                <span className="font-display text-xs font-extrabold tracking-[0.2em]">CONDUZX</span>
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-subtle">
              Pergunta {index + 1} de {questions.length}
            </p>
            <h1 className="mt-1 text-[clamp(1.05rem,4.6vw,1.5rem)] font-semibold leading-snug text-ink [overflow-wrap:anywhere]">{question.text}</h1>

            <div role="radiogroup" aria-label="Opções de resposta" className="mt-4 flex flex-col gap-2.5">
              {question.options.map((option, i) => {
                const selected = answers[question.id] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={locked}
                    onClick={() => select(i)}
                    className={cn(
                      "flex min-h-[3.5rem] w-full items-center gap-3 rounded-2xl p-2.5 text-left transition duration-150 active:scale-[0.98]",
                      selected ? "bg-brand text-brand-ink shadow-glow" : "bg-night-800 text-ink shadow-card",
                    )}
                  >
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-base font-extrabold transition", selected ? "bg-brand-ink text-brand" : "bg-night-700 text-brand")}>
                      {LETTERS[i]}
                    </span>
                    <span className="min-w-0 flex-1 text-[clamp(0.9375rem,3.9vw,1.0625rem)] font-medium leading-snug [overflow-wrap:anywhere]">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <footer className="shrink-0 border-t border-line/60 bg-night-850 px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-5">
        {finishError ? (
          <div role="alert" className="mb-2 flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">
            <IconAlert size={16} className="shrink-0" />
            <span className="min-w-0 flex-1">{finishError}</span>
            <button type="button" onClick={finish} className="shrink-0 font-bold underline">
              Tentar de novo
            </button>
          </div>
        ) : null}
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-2">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0 || locked}
            aria-label="Anterior"
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-night-700 px-4 font-semibold text-ink transition active:scale-95 disabled:opacity-40"
          >
            <IconArrowLeft size={20} />
            <span className="hidden sm:inline">Anterior</span>
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === last || locked}
            className="flex h-14 min-w-0 items-center justify-center gap-2 rounded-2xl bg-brand px-3 font-bold text-brand-ink shadow-glow transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
          >
            Seguinte
            <IconArrowRight size={20} className="shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={locked}
            className="flex h-14 items-center justify-center rounded-2xl bg-success px-3.5 text-sm font-bold text-night-950 transition active:scale-95 disabled:opacity-40 sm:px-6 sm:text-base"
          >
            {submitting ? "A enviar…" : "Terminar"}
          </button>
        </div>
      </footer>

      {confirming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="finish-title">
          <div className="w-full max-w-md animate-pop rounded-3xl bg-night-800 p-6 text-center shadow-shell">
            {unanswered > 0 ? (
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
                <IconAlert size={24} />
              </span>
            ) : null}
            <h2 id="finish-title" className="font-display text-lg font-bold leading-snug text-ink">
              {unanswered > 0
                ? `Ainda tem ${unanswered} ${unanswered === 1 ? "pergunta" : "perguntas"} por responder. Deseja finalizar assim mesmo?`
                : "Tem a certeza que deseja finalizar o seu exame? Não poderá alterar as suas respostas."}
            </h2>
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" onClick={finish} className="h-14 rounded-2xl bg-success font-bold text-night-950 transition active:scale-[0.98]">
                Sim, Terminar
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="h-14 rounded-2xl bg-night-700 font-semibold text-ink transition active:scale-[0.98]">
                Não, Voltar ao Exame
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
