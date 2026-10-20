import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconSteering } from "@/components/ui/icons";
import { obterContexto } from "@/server/auth/sessao";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar - ConduzX" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await obterContexto()) redirect("/");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night-900 px-4 py-12">
      <span aria-hidden="true" className="pointer-events-none absolute -left-10 top-16 h-24 w-24 rounded-full border-[6px] border-brand" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-10 left-8 h-20 w-36 bg-dots opacity-80 [background-size:16px_16px]" />
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 top-1/3 h-72 w-72 rounded-full bg-stripes opacity-40 [mask-image:radial-gradient(circle,black_40%,transparent_70%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-[20%] h-0 w-0 border-x-[40px] border-b-[40px] border-x-transparent border-b-brand" />

      <div className="relative w-full max-w-md">
        <Link href="/landing" className="mx-auto mb-8 flex w-fit flex-col items-center rounded-3xl bg-brand px-6 py-4 text-brand-ink shadow-glow">
          <IconSteering size={30} strokeWidth={2.4} />
          <span className="mt-1 font-display text-sm font-extrabold tracking-tight">CONDUZX</span>
        </Link>

        <div className="rounded-4xl border border-white/5 bg-night-800 p-7 shadow-shell sm:p-9">
          <h1 className="font-display text-2xl font-extrabold uppercase text-ink">Entrar</h1>
          <p className="mt-1 text-sm text-muted">Aceda à gestão da sua escola de condução.</p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-subtle">
          Problemas a entrar? Fale com o administrador da sua escola.
        </p>
      </div>
    </main>
  );
}
