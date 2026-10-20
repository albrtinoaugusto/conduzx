import { Badge, Card, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { formatMoneyMzn } from "@/lib/format-money";
import { centavosParaInput } from "@/lib/money";
import { exigirContexto } from "@/server/auth/sessao";
import { listarCategorias } from "@/server/services/categorias";
import { CategoriaModal } from "./categoria-modal";

export default async function CategoriasPage() {
  const ctx = await exigirContexto("gerir_categorias");
  const categorias = await listarCategorias(ctx);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Mudar um preço só afeta inscrições novas — as antigas mantêm o preço do dia em que foram criadas.
        </p>
        <CategoriaModal />
      </div>
      <Card>
        <Table>
          <THead>
            <tr>
              <Th>Código</Th>
              <Th>Nome</Th>
              <Th align="right">Preço</Th>
              <Th>Estado</Th>
              <Th className="w-24" />
            </tr>
          </THead>
          <TBody>
            {categorias.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-brand px-2 font-display text-sm font-black text-brand-ink">
                    {c.codigo}
                  </span>
                </Td>
                <Td className="font-semibold">{c.nome}</Td>
                <Td align="right" className="font-semibold">
                  {formatMoneyMzn(c.precoCentavos)}
                </Td>
                <Td>{c.ativo ? <Badge tone="success">Ativa</Badge> : <Badge>Inativa</Badge>}</Td>
                <Td>
                  <CategoriaModal
                    categoria={{ id: c.id, codigo: c.codigo, nome: c.nome, preco: centavosParaInput(c.precoCentavos), ativo: c.ativo }}
                  />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
