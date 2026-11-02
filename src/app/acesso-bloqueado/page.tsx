import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CONTACT } from "@/components/site/contact";
import { Button } from "@/components/ui";
import { IconAlert } from "@/components/ui/icons";
import { signOutAction } from "@/server/actions/auth";
import { studentSignOutAction } from "@/server/actions/portal";
import { getContext } from "@/server/auth/session";
import { getStudentContext } from "@/server/auth/student-session";
import type { SchoolBlock } from "@/server/domain/school-access";

export const metadata: Metadata = { title: "Acesso indisponível - ConduzX" };
export const dynamic = "force-dynamic";

const staffMessages: Record<SchoolBlock, { title: string; text: string }> = {
  trial_expirado: {
    title: "O período de teste terminou",
    text: "O período de teste da sua escola chegou ao fim. Os seus dados estão guardados. Contacte o suporte para continuar a usar o ConduzX.",
  },
  suspensa: {
    title: "Acesso suspenso",
    text: "O acesso da sua escola ao ConduzX está suspenso. Os seus dados estão guardados. Contacte o suporte para resolver a situação.",
  },
  eliminada: {
    title: "Escola indisponível",
    text: "Esta escola já não está ativa no ConduzX. Contacte o suporte para mais informações.",
  },
};

export default async function BlockedAccessPage() {
  const [staff, student] = await Promise.all([getContext(), getStudentContext()]);
  if (!staff?.blocked && !student?.blocked) redirect(staff ? "/" : student ? "/portal" : "/login");

  const staffBlock = staff?.blocked;
  const message = staffBlock
    ? staffMessages[staffBlock]
    : {
        title: "Portal indisponível",
        text: `O portal de ${student?.schoolName} está indisponível de momento. Fale com a secretaria da sua escola${student?.schoolPhone ? ` pelo ${student.schoolPhone}` : ""}.`,
      };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-night-900 px-4 py-12">
      <div className="w-full max-w-md rounded-4xl border border-white/5 bg-night-800 p-7 text-center shadow-shell sm:p-9">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
          <IconAlert size={24} />
        </span>
        <h1 className="font-display text-xl font-extrabold text-ink">{message.title}</h1>
        <p className="mt-2 text-sm text-muted">{message.text}</p>
        {staffBlock ? (
          <div className="mt-5 rounded-2xl bg-night-700/50 p-4 text-sm">
            <p className="font-semibold text-ink">Suporte ConduzX</p>
            <p className="mt-1">
              <a href={CONTACT.phoneHref} className="font-semibold text-brand hover:underline">{CONTACT.phone}</a>
            </p>
            <p className="mt-1">
              <a href={`mailto:${CONTACT.email}`} className="font-semibold text-brand hover:underline">{CONTACT.email}</a>
            </p>
          </div>
        ) : null}
        <form action={staffBlock ? signOutAction : studentSignOutAction} className="mt-5">
          <Button type="submit" variant="ghost">Sair</Button>
        </form>
      </div>
    </main>
  );
}
