import "server-only";
import { BusinessError, type FormState } from "@/server/errors";

/** Converte erros em mensagens amigáveis. Nunca expõe detalhes técnicos. */
export function errorToState(e: unknown): FormState {
  if (e instanceof BusinessError) {
    return {
      error: e.message,
      fields: e.field ? { [e.field]: e.message } : undefined,
      link: e.link,
      t: Date.now(),
    };
  }
  console.error("[action]", e instanceof Error ? e.message : e);
  return { error: "Ocorreu um erro inesperado. Tente novamente.", t: Date.now() };
}

export function success(message?: string): FormState {
  return { ok: true, message, t: Date.now() };
}

export function invalid(fields: Record<string, string>): FormState {
  return { error: "Verifique os campos assinalados.", fields, t: Date.now() };
}
