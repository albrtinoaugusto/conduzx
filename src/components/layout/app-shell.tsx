"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconBell, IconMenu, IconSearch } from "@/components/ui/icons";
import { Logo } from "./logo";
import { pageTitles, type UtilizadorShell } from "./nav-items";
import { Sidebar } from "./sidebar";

function titleFor(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (/^\/alunos\/[^/]+\/editar$/.test(pathname)) return "Editar aluno";
  if (/^\/alunos\/[^/]+$/.test(pathname)) return "Ficha do aluno";
  if (/^\/inscricoes\/[^/]+$/.test(pathname)) return "Inscrição";
  const key = Object.keys(pageTitles).find((k) => k !== "/" && pathname.startsWith(k));
  return key ? pageTitles[key] : "ConduzX";
}

export function AppShell({
  children,
  utilizador,
  pendentes,
}: {
  children: ReactNode;
  utilizador: UtilizadorShell;
  pendentes: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen p-0 lg:p-5">
      <div className="mx-auto flex min-h-screen max-w-[1500px] overflow-clip bg-night-900 lg:min-h-[calc(100vh-2.5rem)] lg:rounded-4xl lg:border lg:border-white/[0.05] lg:shadow-shell">
        {/* Barra lateral — desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-5 h-[calc(100vh-2.5rem)] overflow-y-auto">
            <Sidebar utilizador={utilizador} pendentes={pendentes} />
          </div>
        </aside>

        {/* Barra lateral — mobile (gaveta) */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-night-850 transition-transform lg:hidden",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar utilizador={utilizador} pendentes={pendentes} onNavigate={() => setOpen(false)} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 bg-night-900 px-4 py-4 sm:px-6 lg:px-8 lg:pt-7">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-night-700 text-ink shadow-raised lg:hidden"
              aria-label="Abrir menu"
            >
              <IconMenu size={18} />
            </button>
            <span className="lg:hidden">
              <Logo compact />
            </span>
            <h1 className="hidden font-display text-2xl font-bold text-ink lg:block">{titleFor(pathname)}</h1>
            <div className="ml-auto flex items-center gap-3">
              {!utilizador.superAdmin ? <form action="/alunos" method="get" role="search" className="relative hidden w-80 md:block">
                <input
                  type="search"
                  name="q"
                  placeholder="Pesquisar aluno, BI, telefone…"
                  className="h-10 w-full rounded-full border border-transparent bg-night-700 px-4 pr-11 text-sm text-ink shadow-pressed placeholder:text-subtle focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/25"
                />
                <button type="submit" aria-label="Pesquisar" className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-night-600">
                  <IconSearch size={16} />
                </button>
              </form> : null}
              {!utilizador.superAdmin ? <Link
                href="/pendencias"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-night-700 text-ink shadow-raised transition hover:bg-night-600"
                aria-label={`${pendentes} pendências no INATRO`}
                title={`${pendentes} pendências no INATRO`}
              >
                <IconBell size={18} />
                {pendentes > 0 ? (
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand ring-2 ring-night-700" />
                ) : null}
              </Link> : null}
            </div>
          </header>

          <main className="flex-1 px-4 pb-10 sm:px-6 lg:px-8">
            <h1 className="mb-4 font-display text-2xl font-bold text-ink lg:hidden">{titleFor(pathname)}</h1>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
