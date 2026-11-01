import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { IconSteering } from "@/components/ui/icons";
import { getContext } from "@/server/auth/session";
import { getStudentContext } from "@/server/auth/student-session";
import { listSchoolsForLogin } from "@/server/services/portal";
import { EntryForm } from "./entry-form";

export const metadata: Metadata = { title: "Entrar - ConduzX" };
export const dynamic = "force-dynamic";

/** Entrada no telemóvel: Aluno (escolhido por omissão) ou Escola. */
export default async function EntryPage() {
  if (await getContext()) redirect("/");
  if (await getStudentContext()) redirect("/portal");
  const schools = await listSchoolsForLogin();

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-night-900 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <span aria-hidden="true" className="pointer-events-none absolute -left-10 top-10 h-24 w-24 rounded-full border-[6px] border-brand" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-stripes opacity-30 [mask-image:radial-gradient(circle,black_40%,transparent_70%)]" />

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mx-auto mb-6 flex w-fit flex-col items-center rounded-3xl bg-brand px-5 py-3 text-brand-ink shadow-glow">
          <IconSteering size={26} strokeWidth={2.4} />
          <span className="mt-0.5 font-display text-xs font-extrabold tracking-tight">CONDUZX</span>
        </div>
        <EntryForm schools={schools} />
      </div>
    </main>
  );
}
