import Link from "next/link";
import { PageToolbar, Paginacao, Vazio, urlCom } from "@/components/layout/page-toolbar";
import { Badge, ButtonLink, Card, StatCard, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { IconAlert, IconCheck, IconPlus, IconWallet } from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatarDataHora, metodoRotulo } from "@/lib/rotulos";
import { exigirContexto } from "@/server/auth/sessao";
import { pode } from "@/server/domain/permissoes";
import { listarPagamentos, type Periodo } from "@/server/services/pagamentos";
import { AnularPagamento } from "../inscricoes/acoes-inscricao";

const PERIODOS: Array<[Periodo, string]> = [
  ["hoje", "Hoje"],
  ["semana", "Esta semana"],
  ["mes", "Este mês"],
  ["todos", "Todos"],
  ["anulados", "Anulados"],
];

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: { periodo?: string; q?: string; pagina?: string };
}) {
  const ctx = await exigirContexto();
  const periodo = (PERIODOS.find(([p]) => p === searchParams.periodo)?.[0] ?? "mes") as Periodo;
  const q = searchParams.q ?? "";
  const pagina = Math.max(1, Number(searchParams.pagina) || 1);
  const r = await listarPagamentos(ctx, { periodo, q, pagina });
  const podeAnular = pode(ctx.papel, "anular_pagamento");

  return (
    <>
      <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Recebido no período" value={formatMoneyMzn(r.recebido)} icon={<IconWallet size={18} />} />
        <StatCard label="Pagamentos válidos" value={r.validos} icon={<IconCheck size={18} />} />
        <StatCard label="Anulados" value={r.anulados} icon={<IconAlert size={18} />} />
      </section>

      <PageToolbar
        filtros={PERIODOS.map(([p, l]) => ({ label: l, href: urlCom("/pagamentos", { periodo: p, q }), ativo: p === periodo }))}
        pesquisa={{ placeholder: "Aluno ou referência", valor: q, manter: { periodo } }}
        action={
          <ButtonLink href="/inscricoes" icon={<IconPlus size={16} />} variant="secondary">
            Registar pagamento
          </ButtonLink>
        }
      />
      <p className="-mt-2 mb-4 text-xs text-subtle">Para registar um pagamento, abra a inscrição do aluno.</p>

      {r.linhas.length === 0 ? (
        <Vazio titulo="Sem pagamentos neste período" texto="Experimente outro filtro." />
      ) : (
        <Card>
          <Table className="min-w-[820px]">
            <THead>
              <tr>
                <Th>Data</Th>
                <Th>Aluno</Th>
                <Th>Método</Th>
                <Th>Registado por</Th>
                <Th align="right">Valor</Th>
                <Th>Estado</Th>
              </tr>
            </THead>
            <TBody>
              {r.linhas.map((p) => (
                <Tr key={p.id} className={p.anuladoEm ? "opacity-70" : undefined}>
                  <Td className="text-muted">{formatarDataHora(p.pagoEm)}</Td>
                  <Td>
                    <Link href={`/inscricoes/${p.inscricaoId}`} className="font-semibold hover:text-brand">
                      {p.aluno}
                    </Link>
                    <span className="block text-[11px] text-subtle">Categoria {p.categoria}</span>
                  </Td>
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
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge tone="success" dot>
                          Válido
                        </Badge>
                        {podeAnular ? <AnularPagamento pagamentoId={p.id} valor={p.valorCentavos} /> : null}
                      </div>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <Paginacao pagina={pagina} paginas={r.paginas} href={(n) => urlCom("/pagamentos", { periodo, q, pagina: n })} />
        </Card>
      )}
    </>
  );
}
