"use client";

import { useEffect, useState, useTransition } from "react";
import {
  ActionForm,
  FormAlert,
  FormInput,
  FormSelect,
  FormTextarea,
  SubmitButton,
  useEstadoForm,
} from "@/components/forms/form";
import { ButtonLink, Card, CardHeader } from "@/components/ui";
import { IconCheck, IconSearch, IconUsers } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatMoneyMzn } from "@/lib/format-money";
import { parseMeticais } from "@/lib/money";
import { metodoRotulo } from "@/lib/rotulos";
import { pesquisarAlunosAction } from "@/server/actions/alunos";
import { criarInscricaoAction } from "@/server/actions/inscricoes";
import { AlunoCampos } from "../../alunos/aluno-campos";

type Categoria = { id: string; nome: string; precoCentavos: number };
type AlunoResumo = { id: string; nomeCompleto: string; biNumero: string | null; telefone: string | null };

function Passo({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand font-display text-sm font-black text-brand-ink">{n}</span>
        <h2 className="font-display text-base font-bold text-ink">{titulo}</h2>
      </div>
      {children}
    </Card>
  );
}

function SeletorAluno({ inicial }: { inicial: AlunoResumo | null }) {
  const estado = useEstadoForm();
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<AlunoResumo[]>([]);
  const [escolhido, setEscolhido] = useState<AlunoResumo | null>(inicial);
  const [aProcurar, iniciar] = useTransition();

  useEffect(() => {
    if (q.trim().length < 2) {
      setResultados([]);
      return;
    }
    const t = setTimeout(() => {
      iniciar(async () => setResultados(await pesquisarAlunosAction(q)));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  if (escolhido) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-night-700/60 p-4 ring-1 ring-brand/40">
        <input type="hidden" name="alunoId" value={escolhido.id} />
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-ink">
          <IconCheck size={18} strokeWidth={3} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{escolhido.nomeCompleto}</p>
          <p className="text-xs text-subtle">
            {escolhido.biNumero ?? "sem BI"} · {escolhido.telefone ?? "sem telefone"}
          </p>
        </div>
        <button type="button" onClick={() => setEscolhido(null)} className="text-xs font-semibold text-brand hover:underline">
          Trocar
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
            estado.campos?.alunoId && "border-danger/70",
          )}
          aria-label="Pesquisar aluno"
          autoFocus
        />
        <IconSearch size={16} className={cn("absolute right-4 top-1/2 -translate-y-1/2", aProcurar ? "animate-pulse text-brand" : "text-muted")} />
      </div>
      {estado.campos?.alunoId ? <p className="mt-1.5 text-xs font-medium text-danger">{estado.campos.alunoId}</p> : null}
      {resultados.length > 0 ? (
        <ul className="mt-2 overflow-hidden rounded-xl bg-night-700/60 ring-1 ring-white/5">
          {resultados.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setEscolhido(a)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-night-600"
              >
                <span className="font-semibold text-ink">{a.nomeCompleto}</span>
                <span className="text-xs text-subtle">
                  {a.biNumero ?? "sem BI"} · {a.telefone ?? "—"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : q.trim().length >= 2 && !aProcurar ? (
        <p className="mt-2 text-xs text-muted">Nenhum aluno encontrado. Escolha “Aluno novo”.</p>
      ) : null}
    </div>
  );
}

export function NovaInscricaoForm({ categorias, alunoInicial }: { categorias: Categoria[]; alunoInicial: AlunoResumo | null }) {
  const [modo, setModo] = useState<"existente" | "novo">(alunoInicial ? "existente" : "novo");
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [valor, setValor] = useState("");
  const [inatro, setInatro] = useState<"nao_registado" | "pendente" | "registado">("nao_registado");

  const categoria = categorias.find((c) => c.id === categoriaId);
  const valorCentavos = valor ? parseMeticais(valor) : 0;
  const preco = categoria?.precoCentavos ?? 0;

  return (
    <ActionForm action={criarInscricaoAction} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <input type="hidden" name="modoAluno" value={modo} />

      <div className="flex flex-col gap-5">
        <FormAlert />

        <Passo n={1} titulo="Aluno">
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
                onClick={() => setModo(m)}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-4 text-xs font-semibold transition",
                  modo === m ? "bg-brand text-brand-ink" : "text-muted hover:text-ink",
                )}
              >
                {m === "existente" ? <IconSearch size={14} /> : <IconUsers size={14} />}
                {l}
              </button>
            ))}
          </div>
          {modo === "novo" ? <AlunoCampos /> : <SeletorAluno inicial={alunoInicial} />}
        </Passo>

        <Passo n={2} titulo="Categoria de carta">
          <FormSelect name="categoriaId" label="Categoria *" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} — {formatMoneyMzn(c.precoCentavos)}
              </option>
            ))}
          </FormSelect>
          <p className="mt-2 text-xs text-subtle">O preço fica guardado nesta inscrição, mesmo que a tabela de preços mude depois.</p>
        </Passo>

        <Passo n={3} titulo="Primeiro pagamento (opcional)">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormInput
              name="primeiroPagamento"
              label="Valor recebido (MT)"
              inputMode="decimal"
              placeholder="Ex.: 5.000"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              hint="Deixe vazio se ainda não pagou."
            />
            <FormSelect name="metodo" label="Método" defaultValue="dinheiro">
              {Object.entries(metodoRotulo).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </FormSelect>
            <FormInput name="referencia" label="Referência / recibo" placeholder="opcional" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[30, 50, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValor(String(Math.floor((preco * p) / 100) / 100).replace(".", ","))}
                className="rounded-full bg-night-700 px-3 py-1.5 text-xs font-semibold text-muted shadow-raised hover:text-ink"
              >
                {p === 100 ? "Pagou tudo" : `${p}%`}
              </button>
            ))}
          </div>
        </Passo>

        <Passo n={4} titulo="Estado no INATRO">
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
                <input type="radio" name="estadoInatro" value={v} checked={inatro === v} onChange={() => setInatro(v)} className="sr-only" />
                <span className="block font-semibold text-ink">{l}</span>
                <span className="mt-0.5 block text-xs text-muted">{d}</span>
              </label>
            ))}
          </div>
          {inatro === "registado" ? (
            <div className="mt-4">
              <FormInput name="inatroNumeroProcesso" label="Número de processo *" placeholder="Ex.: MPT-2026-08812" />
            </div>
          ) : null}
          {inatro !== "nao_registado" ? (
            <div className="mt-4">
              <FormTextarea name="inatroNota" label="Nota (opcional)" rows={2} placeholder="Ex.: INATRO indisponível às 10h, tentar amanhã." />
            </div>
          ) : null}
        </Passo>
      </div>

      {/* Resumo fixo */}
      <aside className="xl:sticky xl:top-28 xl:self-start">
        <Card className="p-6">
          <CardHeader title="Resumo" />
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Categoria</dt>
              <dd className="text-right font-semibold text-ink">{categoria?.nome ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Preço total</dt>
              <dd className="font-semibold text-ink">{formatMoneyMzn(preco)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Pago agora</dt>
              <dd className={cn("font-semibold", valorCentavos === null ? "text-danger" : "text-success")}>
                {valorCentavos === null ? "valor inválido" : formatMoneyMzn(valorCentavos)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-3">
              <dt className="font-semibold text-ink">Saldo em falta</dt>
              <dd className="font-display text-xl font-bold text-brand">{formatMoneyMzn(Math.max(0, preco - (valorCentavos ?? 0)))}</dd>
            </div>
            {valorCentavos && valorCentavos > preco ? (
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
