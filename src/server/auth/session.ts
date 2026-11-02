import "server-only";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/server/db";
import { schools, users, type UserRole } from "@/server/db/schema";
import { can, type Permission } from "@/server/domain/permissions";
import { schoolBlock, type SchoolBlock } from "@/server/domain/school-access";
import { SESSION_COOKIE, SESSION_DURATION_S, createToken, readToken } from "./token";

/** Contexto por pedido; contas globais não têm escola associada. */
export type Ctx = {
  userId: string;
  schoolId: string;
  role: UserRole;
  name: string;
  schoolName: string;
  /** Motivo pelo qual a escola não pode usar o sistema (suspensa, eliminada, teste terminado). */
  blocked: SchoolBlock | null;
};

export function startSession(userId: string) {
  cookies().set(SESSION_COOKIE, createToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_S,
  });
}

export function endSession() {
  cookies().delete(SESSION_COOKIE);
}

/** Utilizador autenticado (ou null). Memorizado durante o pedido. */
export const getContext = cache(async (): Promise<Ctx | null> => {
  const uid = readToken(cookies().get(SESSION_COOKIE)?.value);
  if (!uid) return null;

  const [row] = await db
    .select({
      userId: users.id,
      schoolId: users.schoolId,
      role: users.role,
      name: users.name,
      schoolName: schools.name,
      schoolCreatedAt: schools.createdAt,
      suspendedAt: schools.suspendedAt,
      deletedAt: schools.deletedAt,
      trialDays: schools.trialDays,
    })
    .from(users)
    .leftJoin(schools, eq(schools.id, users.schoolId))
    .where(and(eq(users.id, uid), eq(users.active, true)))
    .limit(1);

  if (!row) return null;
  return {
    userId: row.userId,
    schoolId: row.schoolId ?? "",
    role: row.role,
    name: row.name,
    schoolName: row.schoolName ?? "Administração ConduzX",
    blocked: row.schoolCreatedAt
      ? schoolBlock({ createdAt: row.schoolCreatedAt, suspendedAt: row.suspendedAt, deletedAt: row.deletedAt, trialDays: row.trialDays })
      : null,
  };
});

/** Para páginas e server actions: exige sessão (e permissão, se indicada). */
export async function requireContext(action?: Permission): Promise<Ctx> {
  const ctx = await getContext();
  if (!ctx) redirect("/login");
  if (ctx.blocked) redirect("/acesso-bloqueado");
  if (action && !ctx.schoolId) redirect("/admin?forbidden=1");
  if (action && !can(ctx.role, action)) redirect("/?forbidden=1");
  return ctx;
}

export async function requireSuperAdmin(): Promise<Ctx> {
  const ctx = await requireContext();
  if (ctx.role !== "super_admin" || ctx.schoolId !== "") redirect("/?forbidden=1");
  return ctx;
}
