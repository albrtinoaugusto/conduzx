import type { InatroStatus } from "@/server/db/schema";

/** Valida a mudança de estado no INATRO. Devolve mensagem de erro ou null. */
export function validateInatroStatus(
  status: InatroStatus,
  processNumber: string | null | undefined,
): string | null {
  if (status === "registado" && !processNumber?.trim()) {
    return "Indique o número de processo do INATRO para marcar como registado.";
  }
  return null;
}
