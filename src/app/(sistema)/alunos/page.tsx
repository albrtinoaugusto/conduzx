import Link from "next/link";
import { PageToolbar, Paginacao, Vazio, urlCom } from "@/components/layout/page-toolbar";
import { AlunoBadge, ButtonLink, Card, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { IconArrowRight, IconPlus } from "@/components/ui/icons";
import { iniciais } from "@/lib/rotulos";
import { exigirContexto } from "@/server/auth/sessao";
import { listarAlunos } from "@/server/services/alunos";

const ESTADOS = { ativos: "ativo", concluidos: "concluido", desistiram: "desistiu" } as const;

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: { q?: string; estado?: string; pagina?: string };
}) {
  const ctx = await exigirContexto();
  const q = searchParams.q ?? "";
  const filtro = searchParams.estado as keyof typeof ESTADOS | undefined;
  const pagina = Math.max(1, Number(searchParams.pagina) || 1);
  const { linhas, total, paginas } = await listarAlunos(ctx, {
    q,
    pagina,
    estado: filtro ? ESTADOS[filtro] : undefined,
  });

  const filtros = [
    { label: "Todos", valor: undefined },
    { label: "Ativos", valor: "ativos" },
    { label: "Concluídos", valor: "concluidos" },
    { label: "Desistiram", valor: "desistiram" },
  ].map((f) => ({ label: f.label, href: urlCom("/alunos", { q, estado: f.valor }), ativo: filtro === f.valor }));

  return (
    <>
      <PageToolbar
        filtros={filtros}
        pesquisa={{ placeholder: "Nome, BI ou telefone", valor: q, manter: { estado: filtro } }}
        action={
          <ButtonLink href="/alunos/novo" icon={<IconPlus size={16} />}>
            Novo aluno
          </ButtonLink>
        }
      />

      {linhas.length === 0 ? (
        <Vazio
          titulo={q ? "Nenhum aluno encontrado" : "Ainda não há alunos"}
          texto={q ? `Não encontrámos resultados para “${q}”. Verifique o nome, BI ou telefone.` : "Registe o primeiro aluno para começar."}
        >
          <ButtonLink href="/inscricoes/nova" icon={<IconPlus size={16} />}>
            Nova inscrição
          </ButtonLink>
        </Vazio>
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
              {linhas.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <Link href={`/alunos/${a.id}`} className="flex items-center gap-3 hover:text-brand">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-night-600 text-xs font-bold text-brand">
                        {iniciais(a.nomeCompleto)}
                      </span>
                      <span className="font-semibold">{a.nomeCompleto}</span>
                    </Link>
                  </Td>
                  <Td className="font-mono text-xs text-muted">
                    {a.biNumero ?? <span className="text-subtle">— sem BI —</span>}
                  </Td>
                  <Td className="text-muted">{a.telefone ?? "—"}</Td>
                  <Td className="text-muted">{a.ultima?.categoria ?? <span className="text-subtle">Sem inscrição</span>}</Td>
                  <Td>{a.ultima ? <AlunoBadge estado={a.ultima.estadoAluno} /> : null}</Td>
                  <Td>
                    <Link
                      href={`/alunos/${a.id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-night-600 hover:text-ink"
                      aria-label={`Abrir ${a.nomeCompleto}`}
                    >
                      <IconArrowRight size={16} />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <Paginacao pagina={pagina} paginas={paginas} href={(p) => urlCom("/alunos", { q, estado: filtro, pagina: p })} />
        </Card>
      )}
    </>
  );
}
