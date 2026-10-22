"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ActionForm,
  FormAlert,
  FormInput,
  FormSelect,
  FormTextarea,
  SubmitButton,
  useFormFeedback,
} from "@/components/forms/form";
import { ButtonLink, Card, CardHeader } from "@/components/ui";
import { IconCheck, IconSearch, IconUsers } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatMoneyMzn } from "@/lib/format-money";
import { parseMeticais } from "@/lib/money";
import { methodLabel } from "@/lib/labels";
import { searchStudentsAction } from "@/server/actions/students";
import { createEnrollmentAction } from "@/server/actions/enrollments";
import { StudentFields } from "../../alunos/student-fields";

type Category = { id: string; name: string; priceCents: number };
type StudentSummary = { id: string; fullName: string; idNumber: string | null; phone: string | null };

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand font-display text-sm font-black text-brand-ink">{n}</span>
        <h2 className="font-display text-base font-bold text-ink">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function StudentPicker({ initial }: { initial: StudentSummary | null }) {
  const status = useFormFeedback();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StudentSummary[]>([]);
  const [selected, setSelected] = useState<StudentSummary | null>(initial);
  const [searching, startSearch] = useTransition();

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      startSearch(async () => setResults(await searchStudentsAction(q)));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-night-700/60 p-4 ring-1 ring-brand/40">
        <input type="hidden" name="studentId" value={selected.id} />
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-ink">
          <IconCheck size={18} strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{selected.fullName}</p>
          <p className="text-xs text-subtle">
            {selected.idNumber ?? "sem BI"} · {selected.phone ?? "sem telefone"}
          </p>
        </div>
        <button type="button" onClick={() => setSelected(null)} className="text-xs font-semibold text-brand hover:underline">
          Alterar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Escreva o nome, BI ou telefone…"
          className={cn(
            "h-11 w-full rounded-xl border border-transparent bg-night-700 px-4 pr-11 text-sm text-ink shadow-pressed placeholder:text-subtle focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/25",
            status.fields?.studentId && "border-danger/70",
          )}
          aria-label="Pesquisar aluno"
          autoFocus
        />
        <IconSearch size={16} className={cn("absolute right-4 top-1/2 -translate-y-1/2", searching ? "animate-pulse text-brand" : "text-muted")} />
      </div>
      {status.fields?.studentId ? <p className="mt-1.5 text-xs font-medium text-danger">{status.fields.studentId}</p> : null}
      {results.length > 0 ? (
        <ul className="mt-2 overflow-hidden rounded-xl bg-night-700/60 ring-1 ring-white/5">
          {results.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setSelected(a)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-night-600"
              >
                <span className="font-semibold text-ink">{a.fullName}</span>
                <span className="text-xs text-subtle">
                  {a.idNumber ?? "sem BI"} · {a.phone ?? "—"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : q.trim().length >= 2 && !searching ? (
        <p className="mt-2 text-xs text-muted">Nenhum aluno encontrado. Escolha “Aluno novo”.</p>
      ) : null}
    </div>
  );
}

export function NewEnrollmentForm({ categories, initialStudent }: { categories: Category[]; initialStudent: StudentSummary | null }) {
  const [mode, setMode] = useState<"existente" | "novo">(initialStudent ? "existente" : "novo");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [inatro, setInatro] = useState<"nao_registado" | "pendente" | "registado">("nao_registado");

  const category = categories.find((c) => c.id === categoryId);
  const amountCents = amount ? parseMeticais(amount) : 0;
  const price = category?.priceCents ?? 0;

  return (
    <ActionForm action={createEnrollmentAction} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <input type="hidden" name="studentMode" value={mode} />

      <div className="flex flex-col gap-5">
        <FormAlert />

        <Step n={1} title="Aluno">
          <div className="mb-5 inline-flex flex-wrap gap-1.5 rounded-3xl bg-night-900 p-1 shadow-pressed">
            {(
              [
                ["novo", "Aluno novo"],
                ["existente", "Aluno já registado"],
              ] as const
            ).map(([m, l]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold transition",
                  mode === m ? "bg-brand text-brand-ink" : "text-muted hover:text-ink",
                )}
              >
                {m === "existente" ? <IconSearch size={14} /> : <IconUsers size={14} />}
                {l}
              </button>
            ))}
          </div>
          {mode === "novo" ? <StudentFields /> : <StudentPicker initial={initialStudent} />}
        </Step>

        <Step n={2} title="Categoria de carta">
          <FormSelect name="categoryId" label="Categoria *" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {formatMoneyMzn(c.priceCents)}
              </option>
            ))}
          </FormSelect>
          <p className="mt-2 text-xs text-subtle">O preço fica guardado nesta inscrição, mesmo que a tabela de preços mude depois.</p>
        </Step>

        <Step n={3} title="Primeiro pagamento (opcional)">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormInput
              name="firstPayment"
              label="Valor recebido (MT)"
              inputMode="decimal"
              placeholder="Ex.: 5.000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hint="Deixe vazio se ainda não pagou."
            />
            <FormSelect name="method" label="Método" defaultValue="dinheiro">
              {Object.entries(methodLabel).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </FormSelect>
            <FormInput name="reference" label="Referência / recibo" placeholder="opcional" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[30, 50, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(String(Math.floor((price * p) / 100) / 100).replace(".", ","))}
                className="rounded-full bg-night-700 px-3 py-1.5 text-xs font-semibold text-muted shadow-raised hover:text-ink"
              >
                {p === 100 ? "Pagou tudo" : `${p}%`}
              </button>
            ))}
          </div>
        </Step>

        <Step n={4} title="Estado no INATRO">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                ["nao_registado", "Não registado", "Ainda não foi tentado"],
                ["pendente", "Pendente", "INATRO falhou ou está lento"],
                ["registado", "Registado", "Já tem número de processo"],
              ] as const
            ).map(([v, l, d]) => (
              <label
                key={v}
                className={cn(
                  "cursor-pointer rounded-2xl p-4 ring-1 transition",
                  inatro === v ? "bg-brand/10 ring-brand" : "bg-night-700/50 ring-white/5 hover:ring-white/20",
                )}
              >
                <input type="radio" name="inatroStatus" value={v} checked={inatro === v} onChange={() => setInatro(v)} className="sr-only" />
                <span className="block font-semibold text-ink">{l}</span>
                <span className="mt-0.5 block text-xs text-muted">{d}</span>
              </label>
            ))}
          </div>
          {inatro === "registado" ? (
            <div className="mt-4">
              <FormInput name="inatroProcessNumber" label="Número de processo *" placeholder="Ex.: MPT-2026-08812" />
            </div>
          ) : null}
          {inatro !== "nao_registado" ? (
            <div className="mt-4">
              <FormTextarea name="inatroNote" label="Nota (opcional)" rows={2} placeholder="Ex.: INATRO indisponível às 10h, tentar amanhã." />
            </div>
          ) : null}
        </Step>
      </div>

      {/* Resumo fixo */}
      <aside className="xl:sticky xl:top-28 xl:self-start">
        <Card className="p-6">
          <CardHeader title="Resumo" />
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Categoria</dt>
              <dd className="text-right font-semibold text-ink">{category?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Preço total</dt>
              <dd className="font-semibold text-ink">{formatMoneyMzn(price)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Pago agora</dt>
              <dd className={cn("font-semibold", amountCents === null ? "text-danger" : "text-success")}>
                {amountCents === null ? "valor inválido" : formatMoneyMzn(amountCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-3">
              <dt className="font-semibold text-ink">Saldo em falta</dt>
              <dd className="font-display text-xl font-bold text-brand">{formatMoneyMzn(Math.max(0, price - (amountCents ?? 0)))}</dd>
            </div>
            {amountCents && amountCents > price ? (
              <p className="rounded-xl bg-danger/10 px-3 py-2 text-xs font-semibold text-danger">O valor é superior ao preço da categoria.</p>
            ) : null}
          </dl>
          <div className="mt-6 flex flex-col gap-2">
            <SubmitButton size="lg" className="w-full" icon={<IconCheck size={18} />}>
              Criar inscrição
            </SubmitButton>
            <ButtonLink href="/inscricoes" variant="ghost" className="w-full">
              Cancelar
            </ButtonLink>
          </div>
        </Card>
      </aside>
    </ActionForm>
  );
}
