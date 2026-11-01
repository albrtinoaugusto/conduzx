import Link from "next/link";
import type { ReactNode } from "react";
import { IconClipboard, IconDashboard, IconLogout } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { studentSignOutAction } from "@/server/actions/portal";

const TABS = [
  { id: "situacao", href: "/portal", label: "Situação", icon: IconDashboard },
  { id: "testes", href: "/portal/testes", label: "Testes", icon: IconClipboard },
] as const;

export function PortalShell({ school, active, children }: { school: string; active: (typeof TABS)[number]["id"]; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl flex-col bg-night-900">
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-night-900/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <p className="min-w-0 flex-1 truncate font-display text-sm font-bold text-muted">{school}</p>
        <form action={studentSignOutAction}>
          <button type="submit" aria-label="Sair" className="flex h-11 w-11 items-center justify-center rounded-full bg-night-700 text-muted shadow-raised transition active:scale-95">
            <IconLogout size={18} />
          </button>
        </form>
      </header>

      <main className="flex-1 animate-fade-up px-4 pb-28">{children}</main>

      <nav aria-label="Portal do aluno" className="fixed inset-x-0 bottom-0 z-20 mx-auto grid max-w-xl grid-cols-2 gap-2 border-t border-line/60 bg-night-850/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        {TABS.map(({ id, href, label, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            aria-current={active === id ? "page" : undefined}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold transition active:scale-95",
              active === id ? "bg-brand text-brand-ink shadow-glow" : "bg-night-700 text-muted",
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
