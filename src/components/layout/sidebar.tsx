"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { cn } from "@/lib/cn";
import { iniciais, papelRotulo } from "@/lib/rotulos";
import { IconLogout, IconPalette } from "@/components/ui/icons";
import { sairAction } from "@/server/actions/auth";
import { Logo } from "./logo";
import { navGestao, navPrincipal, navSuperAdmin, type UtilizadorShell } from "./nav-items";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  badge?: number;
};

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = item.href === "/" || item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-full px-4 text-sm font-semibold transition",
        active ? "bg-night-700 text-ink shadow-raised" : "text-muted hover:bg-night-800 hover:text-ink",
      )}
    >
      <Icon size={18} className={active ? "text-brand" : undefined} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="rounded-full bg-brand px-1.5 text-[10px] font-bold leading-4 text-brand-ink">
          {item.badge}
        </span>
      ) : null}
      {active ? (
        <span className="absolute -right-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-brand shadow-glow" />
      ) : null}
    </Link>
  );
}

export function Sidebar({
  utilizador,
  pendentes,
  onNavigate,
}: {
  utilizador: UtilizadorShell;
  pendentes: number;
  onNavigate?: () => void;
}) {
  const gestao = navGestao(utilizador);

  return (
    <div className="flex h-full flex-col gap-8 px-5 py-7">
      <Link href="/" onClick={onNavigate} className="px-2">
        <Logo />
      </Link>

      <div className="flex items-center gap-3 rounded-full bg-night-800 p-1.5 pr-4 shadow-raised">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand font-display text-sm font-bold text-brand-ink">
          {iniciais(utilizador.nome)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{utilizador.nome}</span>
          <span className="block truncate text-[11px] text-muted" title={utilizador.escola}>
            {papelRotulo[utilizador.papel]} · {utilizador.escola}
          </span>
        </span>
      </div>

      <nav className="flex flex-col gap-1.5" aria-label="Principal">
        <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-subtle">{utilizador.superAdmin ? "Administração" : "Operação"}</p>
        {(utilizador.superAdmin ? navSuperAdmin : navPrincipal).map((item) => (
          <NavLink
            key={item.href}
            item={item.href === "/pendencias" ? { ...item, badge: pendentes } : item}
            onNavigate={onNavigate}
          />
        ))}

        {gestao.length ? (
          <>
            <p className="mt-5 px-4 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-subtle">Gestão</p>
            {gestao.map((item) => (
              <NavLink key={item.href} item={item} onNavigate={onNavigate} />
            ))}
          </>
        ) : null}
      </nav>

      <div className="mt-auto flex flex-col gap-1.5">
        {utilizador.admin ? (
          <NavLink item={{ href: "/design-system", label: "Design System", icon: IconPalette }} onNavigate={onNavigate} />
        ) : null}
        <form action={sairAction}>
          <button
            type="submit"
            className="flex h-10 w-full items-center gap-3 rounded-full bg-night-800 px-4 text-sm font-semibold text-muted shadow-raised transition hover:text-ink"
          >
            <IconLogout size={18} />
            Terminar sessão
          </button>
        </form>
      </div>
    </div>
  );
}
