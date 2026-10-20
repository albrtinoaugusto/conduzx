import Link from "next/link";
import { notFound } from "next/navigation";
import { HistoricoLista } from "@/components/historico-lista";
import { Aviso } from "@/components/layout/page-toolbar";
import {
  AlunoBadge,
  Badge,
  Card,
  CardHeader,
  FinanceiroBadge,
  InatroBadge,
  Ring,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatarData, formatarDataHora, metodoRotulo } from "@/lib/rotulos";
import { exigirContexto } from "@/server/auth/sessao";
import { resumoFinanceiro } from "@/server/domain/financeiro";
import { pode } from "@/server/domain/permissoes";
import { listarHistorico } from "@/server/services/historico";
import { obterInscricao } from "@/server/services/inscricoes";
import {
  AnularPagamento,
  EstadoAlunoForm,
  EstadoInatroForm,
  RegistarPagamento,
} from "../acoes-inscricao";

export default async function InscricaoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { criada?: string };
}) {
  const ctx = await exigirContexto();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const i = await obterInscricao(ctx, params.id);
  if (!i) notFound();

  const f = resumoFinanceiro(i.total, i.pago);
  const podeAnular = pode(ctx.papel, "anular_pagamento");
  const historico = pode(ctx.papel, "ver_historico")
    ? await listarHistorico(ctx, { entidadeIds: [i.id, ...i.pagamentos.map((p) => p.id)], limite: 20 })
    : [];

  return (
    <>
      {searchParams.criada ? <Aviso>Inscrição criada com sucesso.</Aviso> : null}

      {/* Cabeçalho */}
      <Card className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-center">
        <Ring value={f.percentagem} size={84} thickness={8} color={f.situacao === "pago" ? "rgb(var(--success))" : "rgb(var(--brand-400))"} />
        <div className="min-w-0 flex-1">
          <Link href={`/alunos/${i.alunoId}`} className="font-display text-xl font-bold text-ink hover:text-brand">
            {i.aluno}
          </Link>
          <p className="text-sm text-muted">
            {i.categoria} · inscrito em {formatarData(i.dataInscricao)}
            {i.criadoPor ? ` por ${i.criadoPor}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <FinanceiroBadge estado={i.situacao} />
            <InatroBadge estado={i.estadoInatro} />
            <AlunoBadge estado={i.estadoAluno} />
          </div>
        </div>
        <dl className="grid shrink-0 grid-cols-3 gap-4 text-center lg:text-right">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Total</dt>
            <dd className="font-display text-lg font-bold text-ink">{formatMoneyMzn(f.totalCentavos)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Pago</dt>
            <dd className="font-display text-lg font-bold text-success">{formatMoneyMzn(f.pagoCentavos)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-subtle">Saldo</dt>
            <dd className="font-display text-lg font-bold text-brand">{formatMoneyMzn(f.saldoCentavos)}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Pagamentos" description="Registos imutáveis — erros corrigem-se com anulação" />
            {i.pagamentos.length === 0 ? (
              <p className="rounded-xl bg-night-700/50 p-4 text-sm text-muted">Ainda não há pagamentos.</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <Th>Data</Th>
                    <Th>Método</Th>
                    <Th>Registado por</Th>
                    <Th align="right">Valor</Th>
                    <Th>Estado</Th>
                  </tr>
                </THead>
                <TBody>
                  {i.pagamentos.map((p) => (
                    <Tr key={p.id} className={p.anuladoEm ? "opacity-70" : undefined}>
                      <Td className="text-muted">{formatarDataHora(p.pagoEm)}</Td>
                      <Td className="text-muted">
                        {metodoRotulo[p.metodo]}
                        {p.referencia ? <span className="block text-[10px] text-subtle">Ref. {p.referencia}</span> : null}
                      </Td>
                      <Td className="text-muted">{p.registadoPor ?? "—"}</Td>
                      <Td align="right" className={p.anuladoEm ? "text-subtle line-through" : "font-semibold"}>
                        {formatMoneyMzn(p.valorCentavos)}
                      </Td>
                      <Td>
                        {p.anuladoEm ? (
                          <>
                            <Badge tone="danger" dot>
                              Anulado
                            </Badge>
                            <span className="mt-1 block max-w-[14rem] text-[10px] text-subtle">
                              {p.motivoAnulacao} · {p.anuladoPor}
                            </span>
                          </>
                        ) : podeAnular ? (
                          <AnularPagamento pagamentoId={p.id} valor={p.valorCentavos} />
                        ) : (
                          <Badge tone="success" dot>
                            Válido
                          </Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          {historico.length ? (
            <Card>
              <CardHeader title="Histórico" />
              <HistoricoLista linhas={historico} />
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Registar pagamento" description={`Em falta: ${formatMoneyMzn(f.saldoCentavos)}`} />
            <RegistarPagamento inscricaoId={i.id} saldoCentavos={f.saldoCentavos} />
          </Card>
          <Card>
            <CardHeader
              title="INATRO"
              description={i.inatroUltimaTentativa ? `Última tentativa: ${formatarDataHora(i.inatroUltimaTentativa)}` : "Estado manual — não há integração"}
            />
            <EstadoInatroForm inscricaoId={i.id} estado={i.estadoInatro} numeroProcesso={i.inatroNumeroProcesso} nota={i.inatroNota} />
          </Card>
          <Card>
            <EstadoAlunoForm inscricaoId={i.id} estado={i.estadoAluno} />
          </Card>
        </div>
      </div>
    </>
  );
}
