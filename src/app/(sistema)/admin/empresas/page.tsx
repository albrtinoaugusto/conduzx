import { Badge, Button, Card, CardHeader, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatarData } from "@/lib/rotulos";
import { exigirSuperAdmin } from "@/server/auth/sessao";
import { listarEmpresas } from "@/server/services/super-admin";
import { guardarEmpresaAction } from "@/server/actions/super-admin";

export default async function EmpresasPage({ searchParams }: { searchParams: { guardada?: string; erro?: string } }) {
  await exigirSuperAdmin();
  const empresas = await listarEmpresas();
  const msg = searchParams.erro ? "Não foi possível guardar. Verifique os campos e tente novamente." : searchParams.guardada ? "Empresa guardada com sucesso." : null;
  return <div className="flex flex-col gap-5">
    {msg ? <p role="status" className={`rounded-xl px-4 py-3 text-sm font-semibold ${searchParams.erro ? "bg-danger/10 text-danger" : "bg-success/10 text-success"}`}>{msg}</p> : null}
    <Card><CardHeader title="Cadastrar empresa" description="Cada empresa terá os seus próprios utilizadores e dados." />
      <form action={guardarEmpresaAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="text-xs font-semibold text-muted">Nome da empresa<input required name="nome" maxLength={150} className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" placeholder="Escola de Condução" /></label>
        <label className="text-xs font-semibold text-muted">Telefone<input name="telefone" maxLength={30} className="mt-1 h-10 w-full rounded-xl bg-night-700 px-3 text-sm text-ink" placeholder="84 000 0000" /></label>
        <Button type="submit" className="self-end">Cadastrar empresa</Button>
      </form>
    </Card>
    <Card><CardHeader title="Empresas registadas" description={`${empresas.length} empresa(s)`} />
      <Table><THead><tr><Th>Empresa</Th><Th>Telefone</Th><Th>Utilizadores activos</Th><Th>Inscrições</Th><Th>Recebido</Th><Th>Desde</Th><Th /></tr></THead>
        <TBody>{empresas.map((e) => <Tr key={e.id} id={e.id}><Td className="font-semibold">{e.nome}</Td><Td className="text-muted">{e.telefone || "—"}</Td><Td><Badge tone="neutral">{Number(e.utilizadores)}</Badge></Td><Td>{Number(e.inscricoes)}</Td><Td>{formatMoneyMzn(Number(e.recebido))}</Td><Td className="text-muted">{formatarData(e.criado_em)}</Td><Td><details className="text-right"><summary className="cursor-pointer text-xs font-semibold text-brand">Editar</summary>
          <form action={guardarEmpresaAction} className="mt-2 flex min-w-56 flex-col gap-2 text-left"><input type="hidden" name="id" value={e.id} /><label className="text-xs text-muted">Nome<input required name="nome" defaultValue={e.nome} maxLength={150} className="mt-1 h-9 w-full rounded-lg bg-night-700 px-3 text-sm text-ink" /></label><label className="text-xs text-muted">Telefone<input name="telefone" defaultValue={e.telefone ?? ""} maxLength={30} className="mt-1 h-9 w-full rounded-lg bg-night-700 px-3 text-sm text-ink" /></label><Button type="submit" size="sm">Guardar alterações</Button></form>
        </details></Td></Tr>)}</TBody>
      </Table>
      {!empresas.length ? <p className="text-sm text-muted">Ainda não há empresas registadas.</p> : null}
    </Card>
  </div>;
}
