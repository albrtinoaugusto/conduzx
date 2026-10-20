import { Vazio } from "@/components/layout/page-toolbar";
import { ButtonLink } from "@/components/ui";
import { exigirContexto } from "@/server/auth/sessao";
import { obterAluno } from "@/server/services/alunos";
import { listarCategorias } from "@/server/services/categorias";
import { NovaInscricaoForm } from "./nova-inscricao-form";

export default async function NovaInscricaoPage({ searchParams }: { searchParams: { aluno?: string } }) {
  const ctx = await exigirContexto("operar");
  const categorias = await listarCategorias(ctx, { apenasAtivas: true });

  const alunoInicial =
    searchParams.aluno && /^[0-9a-f-]{36}$/i.test(searchParams.aluno)
      ? (await obterAluno(ctx, searchParams.aluno))?.aluno ?? null
      : null;

  if (categorias.length === 0) {
    return (
      <Vazio titulo="Sem categorias ativas" texto="É preciso pelo menos uma categoria de carta com preço para criar inscrições.">
        {ctx.papel === "admin" ? <ButtonLink href="/categorias">Gerir categorias</ButtonLink> : null}
      </Vazio>
    );
  }

  return (
    <NovaInscricaoForm
      categorias={categorias.map((c) => ({ id: c.id, nome: c.nome, precoCentavos: c.precoCentavos }))}
      alunoInicial={
        alunoInicial
          ? { id: alunoInicial.id, nomeCompleto: alunoInicial.nomeCompleto, biNumero: alunoInicial.biNumero, telefone: alunoInicial.telefone }
          : null
      }
    />
  );
}
