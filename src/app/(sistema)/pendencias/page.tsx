import Link from "next/link";
import { PageToolbar, Vazio, urlCom } from "@/components/layout/page-toolbar";
import { Card, FinanceiroBadge, InatroBadge } from "@/components/ui";
import { IconAlert } from "@/components/ui/icons";
import { formatarData, formatarDataHora } from "@/lib/rotulos";
import { exigirContexto } from "@/server/auth/sessao";
import { listarPendencias } from "@/server/services/inscricoes";
import { ManterPendente, MarcarRegistado } from "../inscricoes/acoes-inscricao";

const FILTROS = [
  ["todos", "Por registar"],
  ["pendente", "Pendentes"],
  ["nao_registado", "Não registados"],
] as const;

export default async function PendenciasPage({ searchParams }: { searchParams: { filtro?: string } }) {
  const ctx = await exigirContexto();
  const filtro = FILTROS.find(([f]) => f === searchParams.filtro)?.[0] ?? "todos";
  const lista = await listarPendencias(ctx, filtro);

  return (
    <>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-ink">
          <IconAlert size={18} />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">O estado do INATRO é registado manualmente.</p>
          <p className="text-xs text-muted">
            Quando o sistema oficial voltar, conclua o registo e marque como “Registado” com o número de processo. As mais antigas aparecem primeiro.
          </p>
        </div>
      </div>

      <PageToolbar filtros={FILTROS.map(([f, l]) => ({ label: l, href: urlCom("/pendencias", { filtro: f === "todos" ? undefined : f }), ativo: f === filtro }))} />

      {lista.length === 0 ? (
        <Vazio titulo="Sem pendências" texto="Todas as inscrições ativas estão registadas no INATRO." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lista.map((i) => (
            <Card key={i.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/inscricoes/${i.id}`} className="block truncate font-display text-base font-bold text-ink hover:text-brand">
                    {i.aluno}
                  </Link>
                  <p className="text-xs text-subtle">
                    {i.categoria} · desde {formatarData(i.dataInscricao)}
                  </p>
                </div>
                <InatroBadge estado={i.estadoInatro} />
              </div>
              <div className="min-h-[2.5rem] rounded-xl bg-night-700/60 px-3 py-2 text-xs text-muted shadow-pressed">
                {i.inatroNota ?? "Sem notas sobre tentativas de registo."}
                {i.inatroUltimaTentativa ? (
                  <span className="mt-1 block text-[10px] text-subtle">Última tentativa: {formatarDataHora(i.inatroUltimaTentativa)}</span>
                ) : null}
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                <FinanceiroBadge estado={i.situacao} />
                <div className="flex gap-2">
                  <ManterPendente inscricaoId={i.id} nota={i.inatroNota} />
                  <MarcarRegistado inscricaoId={i.id} compacto />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
