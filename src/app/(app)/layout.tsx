import { and, count, eq, isNull, ne } from "drizzle-orm";
import { AppShell } from "@/components/layout/app-shell";
import { requireContext } from "@/server/auth/session";
import { db } from "@/server/db";
import { enrollments } from "@/server/db/schema";
import { can } from "@/server/domain/permissions";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await requireContext();
  const [{ pending }] = ctx.schoolId ? await db
    .select({ pending: count() })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.schoolId, ctx.schoolId),
        isNull(enrollments.deletedAt),
        eq(enrollments.inatroStatus, "pendente"),
        ne(enrollments.studentStatus, "desistiu"),
      ),
    ) : [{ pending: 0 }];

  return (
    <AppShell
      user={{
        name: ctx.name,
        role: ctx.role,
        school: ctx.schoolName,
        canViewHistory: can(ctx.role, "view_history"),
        admin: ctx.role === "admin",
        superAdmin: ctx.role === "super_admin",
      }}
      pending={pending}
    >
      {children}
    </AppShell>
  );
}
