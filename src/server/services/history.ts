import "server-only";
import { and, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db, type Tx } from "@/server/db";
import { history, users } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/session";

export type Entity = "aluno" | "inscricao" | "pagamento" | "categoria" | "utilizador" | "documento";

/**
 * Regista uma ação no histórico. Chamar SEMPRE dentro da mesma transação da alteração.
 * Não guardar dados pessoais sensíveis em `dados` (BI, telefone, morada).
 */
export async function logHistory(
  tx: Tx,
  ctx: Pick<Ctx, "schoolId" | "userId">,
  entity: Entity,
  entityId: string,
  action: string,
  data?: Record<string, unknown>,
) {
  await tx.insert(history).values({
    schoolId: ctx.schoolId,
    userId: ctx.userId,
    source: "app",
    entity,
    entityId,
    action,
    data: data ?? null,
  });
}

const columns = {
  id: history.id,
  entity: history.entity,
  entityId: history.entityId,
  action: history.action,
  data: history.data,
  createdAt: history.createdAt,
  user: users.name,
};

export type HistoryRow = Awaited<ReturnType<typeof listHistory>>[number];

export async function listHistory(
  ctx: Ctx,
  filter: { entity?: Entity; entityIds?: string[]; limit?: number } = {},
) {
  const conds: SQL[] = [eq(history.schoolId, ctx.schoolId)];
  if (filter.entity) conds.push(eq(history.entity, filter.entity));
  if (filter.entityIds) {
    if (filter.entityIds.length === 0) return [];
    conds.push(inArray(history.entityId, filter.entityIds));
  }

  return db
    .select(columns)
    .from(history)
    .leftJoin(users, eq(users.id, history.userId))
    .where(and(...conds))
    .orderBy(desc(history.createdAt), desc(history.id))
    .limit(filter.limit ?? 100);
}
