import type { EstadoInatro } from "@/server/db/schema";

/** Valida a mudança de estado no INATRO. Devolve mensagem de erro ou null. */
export function validarEstadoInatro(
  estado: EstadoInatro,
  numeroProcesso: string | null | undefined,
): string | null {
  if (estado === "registado" && !numeroProcesso?.trim()) {
    return "Indique o número de processo do INATRO para marcar como registado.";
  }
  return null;
}
