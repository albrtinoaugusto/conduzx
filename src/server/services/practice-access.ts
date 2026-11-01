import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { practiceAccess, students, users, type PaymentMethod } from "@/server/db/schema";
import type { Ctx } from "@/server/auth/session";
import { BusinessError } from "@/server/errors";
import { logHistory } from "./history";

export async function getPracticeAccess(ctx: Ctx, studentId: string) {
  const [row] = await db
    .select({
      id: practiceAccess.id,
      amountCents: practiceAccess.amountCents,
      method: practiceAccess.method,
      reference: practiceAccess.reference,
      createdAt: practiceAccess.createdAt,
      grantedBy: users.name,
    })
    .from(practiceAccess)
    .leftJoin(users, eq(users.id, practiceAccess.grantedBy))
    .where(and(eq(practiceAccess.schoolId, ctx.schoolId), eq(practiceAccess.studentId, studentId), isNull(practiceAccess.voidedAt)))
    .orderBy(desc(practiceAccess.createdAt))
    .limit(1);
  return row ?? null;
}

/** A venda é registada pela secretaria depois de receber o valor (não há pagamento online). */
export async function grantPracticeAccess(
  ctx: Ctx,
  data: { studentId: string; amountCents: number; method: PaymentMethod; reference: string | null },
) {
  if (data.amountCents <= 0) throw new BusinessError("O valor deve ser maior que zero.", "amount");
  await db.transaction(async (tx) => {
    const [student] = await tx
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, data.studentId), eq(students.schoolId, ctx.schoolId), isNull(students.deletedAt)))
      .limit(1);
    if (!student) throw new BusinessError("Aluno não encontrado.");

    const created = await tx
      .insert(practiceAccess)
      .values({ ...data, schoolId: ctx.schoolId, grantedBy: ctx.userId })
      .onConflictDoNothing()
      .returning({ id: practiceAccess.id });
    if (created.length === 0) throw new BusinessError("Este aluno já tem acesso aos testes.");

    await logHistory(tx, ctx, "aluno", data.studentId, "ativou_testes", {
      amountCents: data.amountCents,
      method: data.method,
    });
  });
}

export async function voidPracticeAccess(ctx: Ctx, { accessId, studentId, reason }: { accessId: string; studentId: string; reason: string }) {
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(practiceAccess)
      .set({ voidedAt: new Date(), voidedBy: ctx.userId, voidReason: reason })
      .where(
        and(
          eq(practiceAccess.id, accessId),
          eq(practiceAccess.studentId, studentId),
          eq(practiceAccess.schoolId, ctx.schoolId),
          isNull(practiceAccess.voidedAt),
        ),
      )
      .returning({ id: practiceAccess.id });
    if (updated.length === 0) throw new BusinessError("Acesso não encontrado ou já anulado.");
    await logHistory(tx, ctx, "aluno", studentId, "anulou_testes", { reason });
  });
}
