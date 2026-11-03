import { AppShell } from "@/components/layout/app-shell";
import { requireContext } from "@/server/auth/session";
import { can } from "@/server/domain/permissions";
import { getInatroNotice } from "@/server/services/enrollments";
import { getExamNotice } from "@/server/services/theory-exam";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const ctx = await requireContext();
  const [inatroNotice, examNotice] = ctx.schoolId
    ? await Promise.all([getInatroNotice(ctx), getExamNotice(ctx)])
    : [{ total: 0, rows: [] }, { total: 0, rows: [] }];

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
      pending={inatroNotice.total}
      inatroNotice={inatroNotice}
      examNotice={examNotice}
    >
      {children}
    </AppShell>
  );
}
