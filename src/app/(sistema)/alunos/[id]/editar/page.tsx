import { notFound } from "next/navigation";
import { exigirContexto } from "@/server/auth/sessao";
import { obterAluno } from "@/server/services/alunos";
import { AlunoForm } from "../../aluno-form";

export default async function EditarAlunoPage({ params }: { params: { id: string } }) {
  const ctx = await exigirContexto("operar");
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const dados = await obterAluno(ctx, params.id);
  if (!dados) notFound();
  return <AlunoForm alunoId={dados.aluno.id} valores={dados.aluno} />;
}
