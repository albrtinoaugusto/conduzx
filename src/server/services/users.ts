import "server-only";
import bcrypt from "bcryptjs";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { users, type UserRole } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/session";
import { BusinessError } from "@/server/errors";
import { logHistory } from "./history";

// Hash usado quando o email não existe, para o tempo de resposta não revelar contas.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.qdQKZ3uS0b/1.7PPlaV0zrHhb3eK";

/** Login: devolve o id do utilizador ou null (mensagem genérica no ecrã). */
export async function authenticate(email: string, password: string): Promise<string | null> {
  const [u] = await db
    .select({ id: users.id, hash: users.passwordHash, active: users.active })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const ok = await bcrypt.compare(password, u?.hash ?? DUMMY_HASH);
  return u && ok && u.active ? u.id : null;
}

export async function listUsers(ctx: Ctx) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.schoolId, ctx.schoolId!))
    .orderBy(asc(users.name));
}

export async function createUser(
  ctx: Ctx,
  data: { name: string; email: string; role: UserRole; password: string },
) {
  const [found] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);
  if (found) throw new BusinessError("Já existe uma conta com este email.", "email");

  const passwordHash = await bcrypt.hash(data.password, 10);
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(users)
      .values({ schoolId: ctx.schoolId!, name: data.name, email: data.email, role: data.role, passwordHash })
      .returning({ id: users.id });
    await logHistory(tx, ctx, "utilizador", created.id, "criou", { name: data.name, role: data.role });
    return created.id;
  });
}

export async function updateUser(
  ctx: Ctx,
  data: { userId: string; role: UserRole; active: boolean; password: string | null },
) {
  if (data.userId === ctx.userId && (!data.active || data.role !== "admin")) {
    throw new BusinessError("Não pode desativar a sua própria conta nem retirar-se de administrador.");
  }
  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;

  await db.transaction(async (tx) => {
    const [current] = await tx
      .select({ role: users.role, active: users.active })
      .from(users)
      .where(and(eq(users.id, data.userId), eq(users.schoolId, ctx.schoolId!)))
      .limit(1);
    if (!current) throw new BusinessError("Utilizador não encontrado.");

    await tx
      .update(users)
      .set({ role: data.role, active: data.active, ...(passwordHash ? { passwordHash } : {}) })
      .where(and(eq(users.id, data.userId), eq(users.schoolId, ctx.schoolId!)));

    await logHistory(tx, ctx, "utilizador", data.userId, "atualizou", {
      ...(current.role !== data.role ? { role: { from: current.role, to: data.role } } : {}),
      ...(current.active !== data.active ? { active: data.active } : {}),
      ...(passwordHash ? { passwordReset: true } : {}),
    });
  });
}
