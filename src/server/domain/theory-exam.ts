/** Dias de calendário, contados a partir da primeira aula, até o aluno poder ir ao exame teórico. */
export const THEORY_EXAM_DAYS = 45;

const DAY_MS = 86_400_000;
const toUtc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/** Data de hoje (AAAA-MM-DD) em Moçambique, independentemente do fuso do servidor. */
export function todayInMaputo(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Maputo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(iso: string, days: number) {
  return new Date(toUtc(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string) {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

export type TheoryExamProgress = {
  readyDate: string;
  /** Dias até ficar pronto (0 quando já está pronto). */
  daysLeft: number;
  /** Dias contados desde a primeira aula, entre 0 e 45. */
  elapsedDays: number;
  /** false enquanto a primeira aula ainda não aconteceu. */
  started: boolean;
  ready: boolean;
  percentage: number;
};

export function theoryExamProgress(firstLessonDate: string, today = todayInMaputo()): TheoryExamProgress {
  const readyDate = addDays(firstLessonDate, THEORY_EXAM_DAYS);
  const elapsed = daysBetween(firstLessonDate, today);
  const elapsedDays = Math.min(Math.max(elapsed, 0), THEORY_EXAM_DAYS);
  return {
    readyDate,
    daysLeft: Math.max(daysBetween(today, readyDate), 0),
    elapsedDays,
    started: elapsed >= 0,
    ready: elapsed >= THEORY_EXAM_DAYS,
    percentage: Math.round((elapsedDays / THEORY_EXAM_DAYS) * 100),
  };
}
