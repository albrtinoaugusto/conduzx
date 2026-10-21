import type { UserRole } from "@/server/db/schema";

export type Permission =
  | "operate" // alunos, inscrições, pagamentos, estado INATRO
  | "void_payment"
  | "manage_categories"
  | "manage_users"
  | "view_history";

const rules: Record<Permission, UserRole[]> = {
  operate: ["atendente", "gestor", "admin"],
  void_payment: ["gestor", "admin"],
  manage_categories: ["admin"],
  manage_users: ["admin"],
  view_history: ["gestor", "admin"],
};

export function can(role: UserRole, action: Permission): boolean {
  return rules[action].includes(role);
}

export const roleName: Record<UserRole, string> = {
  atendente: "Atendente",
  gestor: "Gestor",
  admin: "Administrador",
  super_admin: "Super-Admin",
};
