"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionForm, SubmitButton } from "@/components/forms/form";
import { Button } from "@/components/ui/button";
import { IconCheck, IconShield } from "@/components/ui/icons";
import { formatDate } from "@/lib/labels";
import { acknowledgeExamNoticeAction } from "@/server/actions/enrollments";
import { THEORY_EXAM_DAYS } from "@/server/domain/theory-exam";

export type ExamNotice = {
  total: number;
  rows: Array<{ id: string; student: string; category: string; readyDate: string }>;
};

const STORAGE_KEY = "conduzx_aviso_exame_adiado";

function readDismissed() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Aviso dos alunos prontos para o exame teórico. "Mais tarde" esconde-o até fechar
 * o browser, a menos que surjam alunos novos; "Já avisei" confirma-o de vez.
 */
export function ExamReadyPopup({ notice }: { notice: ExamNotice }) {
  const pathname = usePathname();
  const signature = notice.rows.map((r) => r.id).join(",");
  // Só decide depois de montar: o sessionStorage não existe no servidor
  const [dismissed, setDismissed] = useState<string | null | undefined>(undefined);

  useEffect(() => setDismissed(readDismissed()), []);

  if (notice.total === 0 || dismissed === undefined || dismissed === signature || pathname === "/exames") return null;

  const remaining = notice.total - notice.rows.length;
  const later = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, signature);
    } catch {
      // Sem armazenamento: esconde só até recarregar a página
    }
    setDismissed(signature);
  };

  return (
    <aside
      role="status"
      aria-label="Alunos prontos para o exame teórico"
      className="fixed inset-x-3 bottom-3 z-50 animate-fade-up rounded-3xl border border-brand/40 bg-night-800 p-5 shadow-shell sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[26rem]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand text-brand-ink shadow-glow">
          <IconShield size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-ink">
            {notice.total === 1 ? "1 aluno pronto" : `${notice.total} alunos prontos`} para o exame teórico
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {notice.total === 1
              ? `Completou ${THEORY_EXAM_DAYS} dias de aulas e já pode fazer o exame nas instalações do INATRO.`
              : `Completaram ${THEORY_EXAM_DAYS} dias de aulas e já podem fazer o exame nas instalações do INATRO.`}
          </p>
        </div>
      </div>

      <ul className="mt-4 flex max-h-44 flex-col gap-1.5 overflow-y-auto">
        {notice.rows.map((r) => (
          <li key={r.id}>
            <Link href={`/inscricoes/${r.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-night-700/60 px-3 py-2 transition hover:bg-night-700">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{r.student}</span>
                <span className="block truncate text-[11px] text-subtle">{r.category}</span>
              </span>
              <span className="shrink-0 text-[11px] text-muted">desde {formatDate(r.readyDate)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {remaining > 0 ? <p className="mt-2 text-xs text-muted">E mais {remaining}. Veja todos em Exame teórico.</p> : null}

      <ActionForm action={acknowledgeExamNoticeAction} className="mt-4 flex flex-wrap justify-end gap-2">
        {notice.rows.map((r) => (
          <input key={r.id} type="hidden" name="enrollmentId" value={r.id} />
        ))}
        <Button variant="ghost" size="sm" onClick={later}>
          Mais tarde
        </Button>
        <Link href="/exames" className="inline-flex h-8 items-center rounded-full bg-night-700 px-3.5 text-xs font-semibold text-ink shadow-raised hover:bg-night-600">
          Ver lista
        </Link>
        <SubmitButton size="sm" icon={<IconCheck size={14} />} pendingLabel="A confirmar…">
          Já avisei
        </SubmitButton>
      </ActionForm>
    </aside>
  );
}
