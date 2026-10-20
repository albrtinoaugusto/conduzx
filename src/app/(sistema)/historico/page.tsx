import { HistoricoLista } from "@/components/historico-lista";
import { PageToolbar, Vazio, urlCom } from "@/components/layout/page-toolbar";
import { Card } from "@/components/ui";
import { exigirContexto } from "@/server/auth/sessao";
import { listarHistorico, type Entidade } from "@/server/services/historico";

const FILTROS: Array<[Entidade | undefined, string]> = [
  [undefined, "Tudo"],
  ["aluno", "Alunos"],
  ["inscricao", "Inscrições"],
  ["pagamento", "Pagamentos"],
  ["documento", "Documentos"],
  ["categoria", "Categorias"],
  ["utilizador", "Utilizadores"],
];

export default async function HistoricoPage({ searchParams }: { searchParams: { entidade?: string } }) {
  const ctx = await exigirContexto("ver_historico");
  const entidade = FILTROS.find(([e]) => e === searchParams.entidade)?.[0];
  const linhas = await listarHistorico(ctx, { entidade, limite: 150 });

  return (
    <>
      <PageToolbar filtros={FILTROS.map(([e, l]) => ({ label: l, href: urlCom("/historico", { entidade: e }), ativo: e === entidade }))} />
      {linhas.length === 0 ? (
        <Vazio titulo="Sem registos" />
      ) : (
        <Card className="p-6">
          <p className="mb-5 text-xs text-subtle">Últimas {linhas.length} ações · mais recentes primeiro</p>
          <HistoricoLista linhas={linhas} />
        </Card>
      )}
    </>
  );
}
