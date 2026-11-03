"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconArrowRight, IconBell, IconClock, IconShield } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatDate, inatroLabel } from "@/lib/labels";
import type { ExamNotice } from "./exam-ready-popup";

export type InatroNotice = {
  total: number;
  rows: Array<{ id: string; student: string; category: string; inatroStatus: string; enrollmentDate: string }>;
};

function Group({
  icon,
  title,
  total,
  empty,
  href,
  hrefLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  total: number;
  empty: string;
  href: string;
  hrefLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/15 text-brand">{icon}</span>
        <h3 className="flex-1 text-sm font-bold text-ink">{title}</h3>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", total ? "bg-brand text-brand-ink" : "bg-night-700 text-subtle")}>{total}</span>
      </div>
      {total === 0 ? (
        <p className="px-1 py-2 text-xs text-muted">{empty}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-1">{children}</ul>
          <Link href={href} className="mt-2 inline-flex items-center gap-1 px-1 text-xs font-semibold text-brand hover:underline">
            {hrefLabel} <IconArrowRight size={12} />
          </Link>
        </>
      )}
    </section>
  );
}

function Row({ href, title, sub, side }: { href: string; title: string; sub: string; side: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 transition hover:bg-night-700">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{title}</span>
          <span className="block truncate text-[11px] text-subtle">{sub}</span>
        </span>
        <span className="shrink-0 text-[11px] text-muted">{side}</span>
      </Link>
    </li>
  );
}

/** Sino do topo: alunos por registar no INATRO e alunos prontos para o exame teórico. */
export function NotificationsMenu({ inatro, exam }: { inatro: InatroNotice; exam: ExamNotice }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const total = inatro.total + exam.total;

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${total} notificações`}
        title="Notificações"
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-night-700 text-ink shadow-raised transition hover:bg-night-600"
      >
        <IconBell size={18} />
        {total > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-ink ring-2 ring-night-900">
            {total > 99 ? "99+" : total}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-x-3 top-20 z-50 max-h-[75vh] overflow-y-auto rounded-3xl border border-white/[0.06] bg-night-800 shadow-shell sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[24rem]">
          <p className="border-b border-line px-4 py-3 font-display text-base font-bold text-ink">Notificações</p>
          <Group
            icon={<IconClock size={14} />}
            title="Por registar no INATRO"
            total={inatro.total}
            empty="Todos os alunos estão registados no INATRO."
            href="/pendencias"
            hrefLabel="Ver pendências"
          >
            {inatro.rows.map((r) => (
              <Row key={r.id} href={`/inscricoes/${r.id}`} title={r.student} sub={`${r.category} · ${inatroLabel[r.inatroStatus] ?? r.inatroStatus}`} side={formatDate(r.enrollmentDate)} />
            ))}
          </Group>
          <div className="border-t border-line" />
          <Group
            icon={<IconShield size={14} />}
            title="Prontos para o exame"
            total={exam.total}
            empty="Nenhum aluno novo pronto para o exame teórico."
            href="/exames"
            hrefLabel="Ver exame teórico"
          >
            {exam.rows.slice(0, 6).map((r) => (
              <Row key={r.id} href={`/inscricoes/${r.id}`} title={r.student} sub={r.category} side={`desde ${formatDate(r.readyDate)}`} />
            ))}
          </Group>
        </div>
      ) : null}
    </div>
  );
}
