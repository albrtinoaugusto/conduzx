import Link from "next/link";
import { Aviso } from "@/components/layout/page-toolbar";
import {
  ButtonLink,
  Card,
  CardHeader,
  Donut,
  FinanceiroBadge,
  Progress,
  Ring,
  Sparkline,
  StatCard,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import {
  IconArrowRight,
  IconArrowUp,
  IconClipboard,
  IconClock,
  IconPlus,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { dataExtenso, formatarDataHora, metodoRotulo } from "@/lib/rotulos";
import { exigirContexto } from "@/server/auth/sessao";
import { redirect } from "next/navigation";
import { listarPendencias } from "@/server/services/inscricoes";
import { obterPainel } from "@/server/services/painel";
import { listarPagamentos } from "@/server/services/pagamentos";

function saudacao() {
  const h = Number(new Intl.DateTimeFormat("pt-PT", { hour: "numeric", hour12: false, timeZone: "Africa/Maputo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 19 ? "Boa tarde" : "Boa noite";
}

export default async function PainelPage({ searchParams }: { searchParams: { "sem-permissao"?: string } }) {
  const ctx = await exigirContexto();
  if (ctx.papel === "super_admin") redirect("/admin");
  if (!ctx.escolaId) redirect("/admin");
  const [p, ultimos, pendencias] = await Promise.all([
    obterPainel(ctx),
    listarPagamentos(ctx, { periodo: "todos" }),
    listarPendencias(ctx, "pendente"),
  ]);
  const hoje = dataExtenso();

  const financeiro = [
    { label: "Pago", value: p.situacoes.pago, color: "rgb(var(--brand-400))" },
    { label: "Parcial", value: p.situacoes.parcial, color: "rgb(var(--warning))" },
    { label: "Sem pagamento", value: p.situacoes.sem_pagamento, color: "rgb(var(--danger))" },
  ];
  const totalFin = financeiro.reduce((s, f) => s + f.value, 0);

  return (
    <div className="flex flex-col gap-5">
      {searchParams["sem-permissao"] ? (
        <Aviso tom="brand">Não tem permissão para aceder a essa página.</Aviso>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {saudacao()}, {ctx.nome.split(" ")[0]}. Aqui está o resumo da escola hoje.
        </p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/alunos/novo" variant="secondary" icon={<IconUsers size={16} />}>
            Novo aluno
          </ButtonLink>
          <ButtonLink href="/inscricoes/nova" icon={<IconPlus size={16} />}>
            Nova inscrição
          </ButtonLink>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[repeat(4,minmax(0,1fr))_1.15fr]">
        <StatCard
          label="Recebido este mês"
          value={formatMoneyMzn(p.recebidoMes)}
          icon={<IconWallet size={18} />}
          trend={p.variacaoRecebido !== null ? { value: `${p.variacaoRecebido > 0 ? "+" : ""}${p.variacaoRecebido}%`, positive: p.variacaoRecebido >= 0 } : undefined}
          footer={hoje}
        />
        <StatCard label="Alunos ativos" value={p.alunosAtivos} icon={<IconUsers size={18} />} footer={hoje} />
        <StatCard label="Inscrições do mês" value={p.inscricoesMes} icon={<IconClipboard size={18} />} footer={hoje} />
        <StatCard
          label="Por registar no INATRO"
          value={p.pendentes}
          icon={<IconClock size={18} />}
          trend={p.pendentesHoje ? { value: `${p.pendentesHoje} hoje`, positive: false } : undefined}
          footer={hoje}
        />
        <Card className="flex flex-col justify-between gap-3 p-4 sm:col-span-2 xl:col-span-4 xl:flex-row xl:items-center 2xl:col-span-1 2xl:flex-col 2xl:items-stretch">
          <p className="font-display text-base font-bold text-ink">Saldo por receber</p>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-success text-night-950 shadow-raised">
              <IconArrowUp size={20} strokeWidth={3} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-subtle">Em aberto (alunos ativos)</p>
              <p className="font-display text-xl font-bold text-ink">{formatMoneyMzn(p.saldoAberto)}</p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="text-xs font-semibold text-muted">Recebimentos · 7 dias</span>
            <Sparkline points={p.recebimentos7dias} width={110} height={36} />
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader title="Estado financeiro" description="Inscrições (exceto desistências)" />
          <div className="flex justify-center py-2">
            <Donut
              slices={financeiro}
              size={170}
              thickness={20}
              center={
                <>
                  <span className="font-display text-3xl font-bold text-ink">{totalFin}</span>
                  <span className="text-[11px] text-muted">inscrições</span>
                </>
              }
            />
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-3">
            {financeiro.map((f) => (
              <li key={f.label}>
                <span className="flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.color }} />
                  {f.label}
                </span>
                <span className="mt-1 block font-display text-xl font-bold text-ink">
                  {totalFin ? Math.round((f.value / totalFin) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Últimos pagamentos"
            description="Registos imutáveis — anulações ficam visíveis"
            action={
              <Link href="/pagamentos?periodo=todos" className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                Ver todos <IconArrowRight size={14} />
              </Link>
            }
          />
          {ultimos.linhas.length === 0 ? (
            <p className="rounded-xl bg-night-700/50 p-4 text-sm text-muted">Ainda não há pagamentos.</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Aluno</Th>
                  <Th>Método</Th>
                  <Th>Data</Th>
                  <Th align="right">Valor</Th>
                </tr>
              </THead>
              <TBody>
                {ultimos.linhas.slice(0, 5).map((pg) => (
                  <Tr key={pg.id}>
                    <Td>
                      <Link href={`/inscricoes/${pg.inscricaoId}`} className="font-semibold hover:text-brand">
                        {pg.aluno}
                      </Link>
                      <span className="block text-[11px] text-subtle">Categoria {pg.categoria}</span>
                    </Td>
                    <Td className="text-muted">{metodoRotulo[pg.metodo]}</Td>
                    <Td className="text-muted">{formatarDataHora(pg.pagoEm)}</Td>
                    <Td align="right" className={pg.anuladoEm ? "text-subtle line-through" : "font-semibold"}>
                      {formatMoneyMzn(pg.valorCentavos)}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader
            title="Pendências INATRO"
            description="Para concluir quando o sistema voltar"
            action={
              <Link href="/pendencias" className="text-xs font-semibold text-brand hover:underline">
                Ver todas
              </Link>
            }
          />
          {pendencias.length === 0 ? (
            <p className="rounded-xl bg-night-700/50 p-4 text-sm text-muted">Sem pendências. Bom trabalho!</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {pendencias.slice(0, 4).map((i) => (
                <li key={i.id}>
                  <Link href={`/inscricoes/${i.id}`} className="flex items-center gap-3 rounded-xl bg-night-700/50 px-3 py-2.5 transition hover:bg-night-700">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-brand" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{i.aluno}</span>
                      <span className="block truncate text-[11px] text-subtle">
                        {i.categoria}
                        {i.inatroNota ? ` · ${i.inatroNota}` : ""}
                      </span>
                    </span>
                    <FinanceiroBadge estado={i.situacao} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Indicadores da operação" description="Todas as inscrições" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Taxa de cobrança", sub: "Pago vs total", value: p.taxaCobranca, color: "rgb(var(--brand-400))" },
              { label: "Registados INATRO", sub: "Do total de inscrições", value: p.taxaRegistados, color: "rgb(var(--info))" },
              { label: "Alunos concluídos", sub: "Do total de inscrições", value: p.taxaConcluidos, color: "rgb(var(--success))" },
            ].map((k) => (
              <div key={k.label} className="flex items-center gap-3 rounded-xl bg-night-700/40 p-3">
                <Ring value={k.value} color={k.color} size={54} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight text-ink">{k.label}</p>
                  <p className="text-[11px] leading-tight text-subtle">{k.sub}</p>
                </div>
              </div>
            ))}
          </div>
          {p.porCategoria.length ? (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {p.porCategoria.map((c) => (
                <div key={c.nome}>
                  <div className="mb-1.5 flex justify-between gap-2 text-xs">
                    <span className="truncate font-semibold text-ink">{c.nome}</span>
                    <span className="whitespace-nowrap text-muted">
                      {c.alunos} aluno(s) · {c.pctPago}% pago
                    </span>
                  </div>
                  <Progress value={c.pctPago} />
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
