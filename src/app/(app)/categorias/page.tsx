import { Badge, Card, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { formatMoneyMzn } from "@/lib/format-money";
import { centsToInput } from "@/lib/money";
import { requireContext } from "@/server/auth/session";
import { listCategories } from "@/server/services/categories";
import { CategoryModal } from "./category-modal";

export default async function CategoriesPage() {
  const ctx = await requireContext("manage_categories");
  const categories = await listCategories(ctx);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted">
          Mudar um preço só afeta inscrições novas - as antigas mantêm o preço do dia em que foram criadas.
        </p>
        <CategoryModal />
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
            {categories.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-brand px-2 font-display text-sm font-black text-brand-ink">
                    {c.code}
                  </span>
                </Td>
                <Td className="font-semibold">{c.name}</Td>
                <Td align="right" className="font-semibold">
                  {formatMoneyMzn(c.priceCents)}
                </Td>
                <Td>{c.active ? <Badge tone="success">Ativa</Badge> : <Badge>Inativa</Badge>}</Td>
                <Td>
                  <CategoryModal
                    category={{ id: c.id, code: c.code, name: c.name, price: centsToInput(c.priceCents), active: c.active }}
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
