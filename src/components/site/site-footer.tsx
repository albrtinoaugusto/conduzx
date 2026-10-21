import Link from "next/link";
import { CONTACT, LEGAL_LINKS, SOCIALS } from "./contact";

const sectionNav = [
  { href: "/landing#inicio", label: "Início" },
  { href: "/landing#funcionalidades", label: "Funcionalidades" },
  { href: "/landing#como-funciona", label: "Como funciona" },
  { href: "/landing#contacto", label: "Contacto" },
];

function ColumnTitle({ children }: { children: string }) {
  return <p className="mb-2 text-xs font-semibold text-subtle">{children}</p>;
}

const linkClass = "block w-fit text-sm text-ink/90 transition hover:text-brand";

/** Rodapé público (landing e páginas legais). Estrutura: painel de destaque, colunas de contactos, barra final. */
export function SiteFooter({ activeSection = "Início" }: { activeSection?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-night-950 px-3 pb-6 pt-3 sm:px-5" aria-labelledby="footer-title">
      {/* Painel de destaque */}
      <div className="relative overflow-hidden rounded-[28px] bg-brand px-6 pb-14 pt-6 text-brand-ink sm:rounded-[36px] sm:px-10 sm:pb-20">
        <span aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[22px] border-night-950/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-brand-ink/20 pb-4">
          <p id="footer-title" className="text-sm font-semibold">
            ConduzX - Gestão inteligente para escolas de condução
          </p>
          <p className="text-sm font-semibold opacity-70">{CONTACT.city}</p>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-12 sm:mt-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
          <div>
            <div className="flex items-center gap-3 border-b border-brand-ink pb-2">
              <span className="rounded-full border border-brand-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Ligue-nos
              </span>
            </div>
            <a
              href={CONTACT.phoneHref}
              className="mt-3 block font-display text-4xl font-bold tracking-tight transition hover:opacity-70 sm:text-5xl xl:pl-[18%]"
            >
              {CONTACT.phone}
            </a>
          </div>
          <div>
            <div className="flex items-center gap-3 border-b border-brand-ink pb-2">
              <span className="rounded-full border border-brand-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Escreva-nos
              </span>
            </div>
            <a
              href={`mailto:${CONTACT.email}`}
              className="mt-3 block font-display text-[1.45rem] font-bold tracking-tight transition [overflow-wrap:anywhere] hover:opacity-70 sm:text-4xl sm:[overflow-wrap:normal] xl:pl-[8%] xl:text-5xl"
            >
              {CONTACT.email}
            </a>
          </div>
        </div>
      </div>

      {/* Colunas */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-16 pt-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1fr_0.8fr_1.1fr_1fr]">
        <div>
          <ColumnTitle>Fale connosco</ColumnTitle>
          <a href={`mailto:${CONTACT.email}`} className={linkClass}>
            {CONTACT.email}
          </a>
          <a href={CONTACT.phoneHref} className={linkClass}>
            +258 {CONTACT.phone}
          </a>
        </div>
        <div>
          <ColumnTitle>Redes sociais</ColumnTitle>
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {s.label}
            </a>
          ))}
        </div>
        <div>
          <ColumnTitle>Morada</ColumnTitle>
          <address className="text-sm not-italic leading-relaxed text-ink/90">
            ConduzX
            <br />
            {CONTACT.addressLine}
            <br />
            {CONTACT.city}
          </address>
        </div>
        <div>
          <ColumnTitle>Produto</ColumnTitle>
          <Link href="/landing#funcionalidades" className={linkClass}>
            Funcionalidades
          </Link>
          <Link href="/landing#inatro" className={linkClass}>
            Pendências do INATRO
          </Link>
          <Link href="/login" className={linkClass}>
            Entrar no sistema
          </Link>
        </div>
      </div>

      {/* Barra final */}
      <div className="mx-auto flex max-w-7xl flex-col-reverse items-center gap-6 px-4 sm:px-8 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:items-end">
        <div className="text-center text-xs text-subtle xl:text-left">
          <p>Feito em Maputo para escolas de condução</p>
          <p className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 xl:justify-start">
            <span>© {year} ConduzX</span>
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="transition hover:text-ink">
                {l.label}
              </Link>
            ))}
          </p>
        </div>

        <nav aria-label="Secções" className="max-w-full overflow-x-auto">
          <ul className="flex items-center gap-1 rounded-full bg-ink p-1 shadow-shell">
            {sectionNav.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={n.label === activeSection ? "true" : undefined}
                  className={
                    n.label === activeSection
                      ? "block whitespace-nowrap rounded-full bg-night-950 px-4 py-2 text-sm font-semibold text-ink"
                      : "block whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-night-950 transition hover:bg-night-950/10"
                  }
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <span className="hidden xl:block" />
      </div>
    </footer>
  );
}
