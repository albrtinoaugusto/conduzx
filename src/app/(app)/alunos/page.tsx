import Link from "next/link";
import { PageToolbar, Pagination, EmptyState, withQuery } from "@/components/layout/page-toolbar";
import { StudentBadge, ButtonLink, Card, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { IconArrowRight, IconPlus } from "@/components/ui/icons";
import { initials } from "@/lib/labels";
import { requireContext } from "@/server/auth/session";
import { listStudents } from "@/server/services/students";

const STATUS_FILTERS = { ativos: "ativo", concluidos: "concluido", desistiram: "desistiu" } as const;

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string };
}) {
  const ctx = await requireContext();
  const q = searchParams.q ?? "";
  const filter = searchParams.status as keyof typeof STATUS_FILTERS | undefined;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const { rows, total, pages } = await listStudents(ctx, {
    q,
    page,
    status: filter ? STATUS_FILTERS[filter] : undefined,
  });

  const filters = [
    { label: "Todos", value: undefined },
    { label: "Ativos", value: "ativos" },
    { label: "Concluídos", value: "concluidos" },
    { label: "Desistiram", value: "desistiram" },
  ].map((f) => ({ label: f.label, href: withQuery("/alunos", { q, status: f.value }), active: filter === f.value }));

  return (
    <>
      <PageToolbar
        filters={filters}
        search={{ placeholder: "Nome, BI ou telefone", amount: q, keep: { status: filter } }}
        action={
          <ButtonLink href="/alunos/novo" icon={<IconPlus size={16} />}>
            Novo aluno
          </ButtonLink>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title={q ? "Nenhum aluno encontrado" : "Ainda não há alunos"}
          text={q ? `Não encontrámos resultados para “${q}”. Verifique o nome, BI ou telefone.` : "Registe o primeiro aluno para começar."}
        >
          <ButtonLink href="/inscricoes/nova" icon={<IconPlus size={16} />}>
            Nova inscrição
          </ButtonLink>
        </EmptyState>
      ) : (
        <Card>
          <p className="mb-2 text-xs text-subtle">{total} aluno(s)</p>
          <Table>
            <THead>
              <tr>
                <Th>Aluno</Th>
                <Th>BI</Th>
                <Th>Telefone</Th>
                <Th>Última categoria</Th>
                <Th>Estado</Th>
                <Th className="w-10" />
              </tr>
            </THead>
            <TBody>
              {rows.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <Link href={`/alunos/${a.id}`} className="flex items-center gap-3 hover:text-brand">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-night-600 text-xs font-bold text-brand">
                        {initials(a.fullName)}
                      </span>
                      <span className="font-semibold">{a.fullName}</span>
                    </Link>
                  </Td>
                  <Td className="font-mono text-xs text-muted">
                    {a.idNumber ?? <span className="text-subtle">— sem BI —</span>}
                  </Td>
                  <Td className="text-muted">{a.phone ?? "—"}</Td>
                  <Td className="text-muted">{a.latest?.category ?? <span className="text-subtle">Sem inscrição</span>}</Td>
                  <Td>{a.latest ? <StudentBadge status={a.latest.studentStatus} /> : null}</Td>
                  <Td>
                    <Link
                      href={`/alunos/${a.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-night-600 hover:text-ink"
                      aria-label={`Abrir ${a.fullName}`}
                    >
                      <IconArrowRight size={16} />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <Pagination page={page} pages={pages} href={(p) => withQuery("/alunos", { q, status: filter, page: p })} />
        </Card>
      )}
    </>
  );
}
