import "server-only";
import { ErroNegocio, type EstadoForm } from "@/server/erros";

/** Converte erros em mensagens amigáveis. Nunca expõe detalhes técnicos. */
export function erroParaEstado(e: unknown): EstadoForm {
  if (e instanceof ErroNegocio) {
    return {
      erro: e.message,
      campos: e.campo ? { [e.campo]: e.message } : undefined,
      link: e.link,
      t: Date.now(),
    };
  }
  console.error("[action]", e instanceof Error ? e.message : e);
  return { erro: "Ocorreu um erro inesperado. Tente novamente.", t: Date.now() };
}

export function sucesso(mensagem?: string): EstadoForm {
  return { ok: true, mensagem, t: Date.now() };
}

export function invalido(campos: Record<string, string>): EstadoForm {
  return { erro: "Verifique os campos assinalados.", campos, t: Date.now() };
}
