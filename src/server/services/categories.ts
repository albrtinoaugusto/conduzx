import "server-only";
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/session";
import { BusinessError } from "@/server/errors";
import { logHistory } from "./history";

type CategoryInput = { code: string; name: string; price: number | null; active: boolean };

export async function listCategories(ctx: Ctx, { activeOnly = false } = {}) {
  const conds = [eq(categories.schoolId, ctx.schoolId)];
  if (activeOnly) conds.push(eq(categories.active, true));
  return db
    .select()
    .from(categories)
    .where(and(...conds))
    .orderBy(asc(categories.code));
}

async function ensureCodeAvailable(ctx: Ctx, code: string, excludeId?: string) {
  const conds = [eq(categories.schoolId, ctx.schoolId), eq(categories.code, code)];
  if (excludeId) conds.push(ne(categories.id, excludeId));
  const [found] = await db.select({ id: categories.id }).from(categories).where(and(...conds)).limit(1);
  if (found) throw new BusinessError("Já existe uma categoria com este código.", "code");
}

export async function createCategory(ctx: Ctx, data: CategoryInput) {
  await ensureCodeAvailable(ctx, data.code);
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(categories)
      .values({
        schoolId: ctx.schoolId,
        code: data.code,
        name: data.name,
        priceCents: data.price ?? 0,
        active: true,
      })
      .returning({ id: categories.id });
    await logHistory(tx, ctx, "categoria", created.id, "criou", {
      code: data.code,
      priceCents: data.price,
    });
    return created.id;
  });
}

export async function updateCategory(ctx: Ctx, id: string, data: CategoryInput) {
  await ensureCodeAvailable(ctx, data.code, id);
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.schoolId, ctx.schoolId)))
      .limit(1);
    if (!current) throw new BusinessError("Categoria não encontrada.");

    await tx
      .update(categories)
      .set({ code: data.code, name: data.name, priceCents: data.price ?? 0, active: data.active })
      .where(and(eq(categories.id, id), eq(categories.schoolId, ctx.schoolId)));

    await logHistory(tx, ctx, "categoria", id, "atualizou", {
      code: data.code,
      ...(current.priceCents !== data.price
        ? { previousPrice: current.priceCents, newPrice: data.price }
        : {}),
      ...(current.active !== data.active ? { active: data.active } : {}),
    });
  });
}
