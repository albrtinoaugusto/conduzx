export const MAX_TRIAL_DAYS = 3650;

const DAY_MS = 24 * 60 * 60 * 1000;

export type SchoolBlock = "eliminada" | "suspensa" | "trial_expirado";

export type SchoolAccessData = {
  createdAt: Date | string;
  suspendedAt: Date | string | null;
  deletedAt: Date | string | null;
  trialDays: number | null;
};

/** Fim do período de teste; null quando a empresa não tem limite. */
export function trialEndsAt(createdAt: Date | string, trialDays: number | null) {
  return trialDays === null ? null : new Date(new Date(createdAt).getTime() + trialDays * DAY_MS);
}

/** Dias inteiros que faltam (arredondado para cima); 0 quando já terminou. */
export function trialDaysLeft(endsAt: Date, now = new Date()) {
  return Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY_MS));
}

/** Motivo pelo qual a empresa não pode usar o sistema, ou null se pode. */
export function schoolBlock(school: SchoolAccessData, now = new Date()): SchoolBlock | null {
  if (school.deletedAt) return "eliminada";
  if (school.suspendedAt) return "suspensa";
  const end = trialEndsAt(school.createdAt, school.trialDays);
  return end && now >= end ? "trial_expirado" : null;
}
