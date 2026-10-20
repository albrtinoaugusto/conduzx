import Link from "next/link";
import { PageToolbar, Paginacao, Vazio, urlCom } from "@/components/layout/page-toolbar";
import {
  ButtonLink,
  Card,
  FinanceiroBadge,
  InatroBadge,
  Progress,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { IconPlus } from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatarData } from "@/lib/rotulos";
import { exigirContexto } from "@/server/auth/sessao";
import { resumoFinanceiro } from "@/server/domain/financeiro";
import { listarInscricoes, type FiltroSituacao } from "@/server/services/inscricoes";

const SITUACOES: FiltroSituacao[] = ["sem_pagamento", "parcial", "pago"];

export default async function InscricoesPage({
  searchParams,
}: {
  searchParams: { q?: string; situacao?: string; pagina?: string };
}) {
  const ctx = await exigirContexto();
  const q = searchParams.q ?? "";
  const situacao = SITUACOES.includes(searchParams.situacao as FiltroSituacao)
    ? (searchParams.situacao as FiltroSituacao)
    : undefined;
  const pagina = Math.max(1, Number(searchParams.pagina) || 1);
  const { linhas, total, paginas } = await listarInscricoes(ctx, { q, situacao, pagina });

  const filtros = [
    { label: "Todas", valor: undefined },
    { label: "Sem pagamento", valor: "sem_pagamento" },
    { label: "Parcial", valor: "parcial" },
    { label: "Pago", valor: "pago" },
  ].map((f) => ({ label: f.label, href: urlCom("/inscricoes", { q, situacao: f.valor }), ativo: situacao === f.valor }));

  return (
    <>
      <PageToolbar
        filtros={filtros}
        pesquisa={{ placeholder: "Aluno, BI ou categoria", valor: q, manter: { situacao } }}
        action={
          <ButtonLink href="/inscricoes/nova" icon={<IconPlus size={16} />}>
            Nova inscrição
          </ButtonLink>
        }
      />
      {linhas.length === 0 ? (
        <Vazio titulo="Nenhuma inscrição encontrada" texto="Ajuste os filtros ou crie uma nova inscrição." />
      ) : (
        <Card>
          <p className="mb-2 text-xs text-subtle">{total} inscrição(ões)</p>
          <Table className="min-w-[860px]">
            <THead>
              <tr>
                <Th>Aluno</Th>
                <Th>Categoria</Th>
                <Th align="right">Total</Th>
                <Th className="w-44">Pago</Th>
                <Th>Pagamento</Th>
                <Th>INATRO</Th>
              </tr>
            </THead>
            <TBody>
              {linhas.map((i) => {
                const f = resumoFinanceiro(i.total, i.pago);
                return (
                  <Tr key={i.id}>
                    <Td>
                      <Link href={`/inscricoes/${i.id}`} className="font-semibold hover:text-brand">
                        {i.aluno}
                      </Link>
                      <span className="block text-[11px] text-subtle">Inscrito em {formatarData(i.dataInscricao)}</span>
                    </Td>
                    <Td className="text-muted">{i.categoria}</Td>
                    <Td align="right" className="font-semibold">
                      {formatMoneyMzn(i.total)}
                    </Td>
                    <Td>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="text-muted">{formatMoneyMzn(i.pago)}</span>
                        <span className="font-bold text-ink">{f.percentagem}%</span>
                      </div>
                      <Progress value={f.percentagem} tone={f.situacao === "pago" ? "success" : f.situacao === "parcial" ? "warning" : "danger"} />
                    </Td>
                    <Td>
                      <FinanceiroBadge estado={i.situacao} />
                    </Td>
                    <Td>
                      <InatroBadge estado={i.estadoInatro} />
                      {i.inatroNumeroProcesso ? (
                        <span className="mt-1 block font-mono text-[10px] text-subtle">{i.inatroNumeroProcesso}</span>
                      ) : null}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
          <Paginacao pagina={pagina} paginas={paginas} href={(p) => urlCom("/inscricoes", { q, situacao, pagina: p })} />
        </Card>
      )}
    </>
  );
}
