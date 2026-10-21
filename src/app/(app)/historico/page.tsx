import { HistoryList } from "@/components/history-list";
import { PageToolbar, EmptyState, withQuery } from "@/components/layout/page-toolbar";
import { Card } from "@/components/ui";
import { requireContext } from "@/server/auth/session";
import { listHistory, type Entity } from "@/server/services/history";

const FILTERS: Array<[Entity | undefined, string]> = [
  [undefined, "Tudo"],
  ["aluno", "Alunos"],
  ["inscricao", "Inscrições"],
  ["pagamento", "Pagamentos"],
  ["documento", "Documentos"],
  ["categoria", "Categorias"],
  ["utilizador", "Utilizadores"],
];

export default async function HistoryPage({ searchParams }: { searchParams: { entity?: string } }) {
  const ctx = await requireContext("view_history");
  const entity = FILTERS.find(([e]) => e === searchParams.entity)?.[0];
  const rows = await listHistory(ctx, { entity, limit: 150 });

  return (
    <>
      <PageToolbar filters={FILTERS.map(([e, l]) => ({ label: l, href: withQuery("/historico", { entity: e }), active: e === entity }))} />
      {rows.length === 0 ? (
        <EmptyState title="Sem registos" />
      ) : (
        <Card className="p-6">
          <p className="mb-5 text-xs text-subtle">Últimas {rows.length} ações · mais recentes primeiro</p>
          <HistoryList rows={rows} />
        </Card>
      )}
    </>
  );
}
