import { exigirContexto } from "@/server/auth/sessao";
import { AlunoForm } from "../aluno-form";

export default async function NovoAlunoPage() {
  await exigirContexto("operar");
  return (
    <>
      <p className="mb-5 max-w-2xl text-sm text-muted">
        Registe só o aluno. Para inscrever e receber o primeiro pagamento de uma vez, use{" "}
        <a href="/inscricoes/nova" className="font-semibold text-brand hover:underline">
          Nova inscrição
        </a>
        .
      </p>
      <AlunoForm />
    </>
  );
}
