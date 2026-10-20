import type { PapelUtilizador } from "@/server/db/schema";

export type Acao =
  | "operar" // alunos, inscrições, pagamentos, estado INATRO
  | "anular_pagamento"
  | "gerir_categorias"
  | "gerir_utilizadores"
  | "ver_historico";

const regras: Record<Acao, PapelUtilizador[]> = {
  operar: ["atendente", "gestor", "admin"],
  anular_pagamento: ["gestor", "admin"],
  gerir_categorias: ["admin"],
  gerir_utilizadores: ["admin"],
  ver_historico: ["gestor", "admin"],
};

export function pode(papel: PapelUtilizador, acao: Acao): boolean {
  return regras[acao].includes(papel);
}

export const nomePapel: Record<PapelUtilizador, string> = {
  atendente: "Atendente",
  gestor: "Gestor",
  admin: "Administrador",
  super_admin: "Super-Admin",
};
