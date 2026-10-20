import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconSearch } from "@/components/ui/icons";

export type Filtro = { label: string; href: string; ativo: boolean };

/** Barra por cima das listas: filtros (links) + pesquisa (GET) + ação principal. */
export function PageToolbar({
  filtros,
  pesquisa,
  action,
}: {
  filtros?: Filtro[];
  pesquisa?: { placeholder: string; valor?: string; manter?: Record<string, string | undefined> };
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">
      {filtros ? (
        <nav className="flex flex-wrap gap-1.5 self-start rounded-3xl bg-night-800 p-1 shadow-pressed" aria-label="Filtros">
          {filtros.map((f) => (
            <Link
              key={f.label}
              href={f.href}
              aria-current={f.ativo ? "page" : undefined}
              className={cn(
                "flex h-8 items-center rounded-full px-4 text-xs font-semibold transition",
                f.ativo ? "bg-brand text-brand-ink" : "text-muted hover:text-ink",
              )}
            >
              {f.label}
            </Link>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
        {pesquisa ? (
          <form method="get" className="relative sm:w-72" role="search">
            {Object.entries(pesquisa.manter ?? {}).map(([k, v]) =>
              v ? <input key={k} type="hidden" name={k} value={v} /> : null,
            )}
            <input
              type="search"
              name="q"
              defaultValue={pesquisa.valor}
              placeholder={pesquisa.placeholder}
              className="h-10 w-full rounded-full border border-transparent bg-night-700 px-4 pr-11 text-sm text-ink shadow-pressed placeholder:text-subtle focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
            <button type="submit" aria-label="Pesquisar" className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-night-600">
              <IconSearch size={16} />
            </button>
          </form>
        ) : null}
        {action}
      </div>
    </div>
  );
}

/** Construtor de URLs de lista mantendo os parâmetros atuais. */
export function urlCom(base: string, params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "" && !(k === "pagina" && Number(v) === 1)) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `${base}?${s}` : base;
}

export function Paginacao({
  pagina,
  paginas,
  href,
}: {
  pagina: number;
  paginas: number;
  href: (p: number) => string;
}) {
  if (paginas <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 text-sm">
      <span className="text-muted">
        Página {pagina} de {paginas}
      </span>
      <div className="flex gap-2">
        {pagina > 1 ? (
          <Link href={href(pagina - 1)} className="rounded-full bg-night-700 px-4 py-2 font-semibold shadow-raised hover:bg-night-600">
            Anterior
          </Link>
        ) : null}
        {pagina < paginas ? (
          <Link href={href(pagina + 1)} className="rounded-full bg-night-700 px-4 py-2 font-semibold shadow-raised hover:bg-night-600">
            Seguinte
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function Vazio({ titulo, texto, children }: { titulo: string; texto?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line px-6 py-14 text-center">
      <span className="mb-4 h-3 w-24 rounded-full bg-stripes opacity-70" />
      <h2 className="font-display text-lg font-bold text-ink">{titulo}</h2>
      {texto ? <p className="mt-2 max-w-md text-sm text-muted">{texto}</p> : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

export function Aviso({ children, tom = "success" }: { children: ReactNode; tom?: "success" | "brand" }) {
  return (
    <div
      role="status"
      className={cn(
        "mb-5 rounded-xl px-4 py-3 text-sm font-semibold ring-1 ring-inset",
        tom === "success" ? "bg-success/10 text-success ring-success/30" : "bg-brand/10 text-brand ring-brand/30",
      )}
    >
      {children}
    </div>
  );
}
