import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso } from "@/components/layout/page-toolbar";
import { HistoricoLista } from "@/components/historico-lista";
import {
  AlunoBadge,
  ButtonLink,
  Card,
  CardHeader,
  FinanceiroBadge,
  InatroBadge,
  Progress,
} from "@/components/ui";
import { IconArrowRight, IconPlus } from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatarData, iniciais } from "@/lib/rotulos";
import { exigirContexto } from "@/server/auth/sessao";
import { pode } from "@/server/domain/permissoes";
import { resumoFinanceiro } from "@/server/domain/financeiro";
import { obterAluno } from "@/server/services/alunos";
import { listarDocumentos } from "@/server/services/documentos";
import { listarHistorico } from "@/server/services/historico";
import { CarregarDocumento, ListaDocumentos } from "./documentos";

export default async function AlunoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { criado?: string; atualizado?: string };
}) {
  const ctx = await exigirContexto();
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const dados = await obterAluno(ctx, params.id);
  if (!dados) notFound();
  const { aluno, inscricoes } = dados;

  const documentos = await listarDocumentos(ctx, aluno.id);
  const historico = pode(ctx.papel, "ver_historico")
    ? await listarHistorico(ctx, {
        entidadeIds: [aluno.id, ...inscricoes.map((i) => i.id), ...documentos.map((d) => d.id)],
        limite: 15,
      })
    : [];

  const info: Array<[string, string | null]> = [
    ["Data de nascimento", formatarData(aluno.dataNascimento)],
    ["BI", aluno.biNumero],
    ["Telefone", aluno.telefone],
    ["Email", aluno.email],
    ["Morada", aluno.endereco],
    ["Registado em", formatarData(aluno.criadoEm)],
  ];

  return (
    <>
      {searchParams.criado ? <Aviso>Aluno registado com sucesso.</Aviso> : null}
      {searchParams.atualizado ? <Aviso>Dados do aluno atualizados.</Aviso> : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-5">
          <Card>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand font-display text-lg font-bold text-brand-ink shadow-glow">
                {iniciais(aluno.nomeCompleto)}
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-ink">{aluno.nomeCompleto}</h2>
                <p className="text-xs text-muted">{inscricoes.length} inscrição(ões)</p>
              </div>
            </div>
            <dl className="mt-5 flex flex-col gap-3">
              {info.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line/60 pb-2 text-sm last:border-0">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium text-ink">{v || <span className="text-subtle">—</span>}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink href={`/alunos/${aluno.id}/editar`} variant="secondary" size="sm">
                Editar dados
              </ButtonLink>
              <ButtonLink href={`/inscricoes/nova?aluno=${aluno.id}`} size="sm" icon={<IconPlus size={14} />}>
                Nova inscrição
              </ButtonLink>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Documentos"
              description="BI, fotografia e comprovativos"
              action={
                pode(ctx.papel, "operar") ? (
                  <CarregarDocumento
                    alunoId={aluno.id}
                    inscricoes={inscricoes.map((i) => ({ id: i.id, categoria: i.categoria, dataInscricao: i.dataInscricao }))}
                  />
                ) : null
              }
            />
            <ListaDocumentos documentos={documentos} />
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Inscrições" description="Cada inscrição tem o seu próprio preço e pagamentos" />
            {inscricoes.length === 0 ? (
              <p className="rounded-xl bg-night-700/50 p-4 text-sm text-muted">Este aluno ainda não tem inscrições.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {inscricoes.map((i) => {
                  const f = resumoFinanceiro(i.total, i.pago);
                  return (
                    <li key={i.id}>
                      <Link
                        href={`/inscricoes/${i.id}`}
                        className="group flex flex-col gap-3 rounded-2xl bg-night-700/50 p-4 transition hover:bg-night-700 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display font-bold text-ink">{i.categoria}</span>
                            <AlunoBadge estado={i.estadoAluno} />
                          </div>
                          <p className="mt-0.5 text-xs text-subtle">Inscrito em {formatarData(i.dataInscricao)}</p>
                          <div className="mt-3 flex items-center gap-3">
                            <Progress value={f.percentagem} tone={f.situacao === "pago" ? "success" : f.situacao === "parcial" ? "warning" : "danger"} className="max-w-xs" />
                            <span className="whitespace-nowrap text-xs text-muted">
                              {formatMoneyMzn(f.pagoCentavos)} / {formatMoneyMzn(f.totalCentavos)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FinanceiroBadge estado={i.situacao} />
                          <InatroBadge estado={i.estadoInatro} />
                          <IconArrowRight size={16} className="text-subtle group-hover:text-brand" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {historico.length ? (
            <Card>
              <CardHeader title="Histórico" description="Últimas ações sobre este aluno" />
              <HistoricoLista linhas={historico} />
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
