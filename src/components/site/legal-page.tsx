import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrowRight, IconSteering } from "@/components/ui/icons";
import { LEGAL_LINKS } from "./contact";
import { SiteFooter } from "./site-footer";

/** Estrutura comum das páginas legais (privacidade, termos). */
export function LegalPage({
  title,
  intro,
  updatedAt,
  children,
}: {
  title: string;
  intro: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-night-900 text-ink">
      <header className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 sm:px-8">
        <Link href="/landing" className="flex flex-col items-center rounded-b-3xl bg-brand px-5 pb-4 pt-5 text-brand-ink shadow-glow">
          <IconSteering size={28} strokeWidth={2.4} />
          <span className="mt-1 font-display text-sm font-extrabold tracking-tight">CONDUZX</span>
        </Link>
        <Link href="/landing" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-ink/90 hover:text-brand">
          Voltar ao início <IconArrowRight size={16} />
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-14 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand">Informação legal</p>
        <h1 className="mt-3 font-display text-4xl font-black uppercase leading-tight text-ink sm:text-5xl">{title}</h1>
        <p className="mt-4 text-base leading-relaxed text-muted">{intro}</p>
        <p className="mt-4 text-xs text-subtle">Última atualização: {updatedAt}</p>

        <nav aria-label="Documentos legais" className="mt-8 flex flex-wrap gap-2">
          {LEGAL_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={
                l.label === title
                  ? "rounded-full bg-brand px-4 py-2 text-xs font-semibold text-brand-ink"
                  : "rounded-full bg-night-700 px-4 py-2 text-xs font-semibold text-muted transition hover:text-ink"
              }
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-12 flex flex-col gap-10">{children}</div>
      </main>

      <SiteFooter activeSection="" />
    </div>
  );
}

/** Secção numerada de um documento legal. */
export function LegalSection({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="flex items-baseline gap-3 font-display text-xl font-bold text-ink">
        <span className="font-display text-sm font-black text-brand">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-muted [&_a]:font-semibold [&_a]:text-brand hover:[&_a]:underline [&_li]:pl-1 [&_strong]:text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
