"use client";

import { ActionForm, FormAlert, SubmitButton } from "@/components/forms/form";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconCheck } from "@/components/ui/icons";
import { atualizarAlunoAction, criarAlunoAction } from "@/server/actions/alunos";
import { AlunoCampos, type AlunoValores } from "./aluno-campos";

export function AlunoForm({ alunoId, valores }: { alunoId?: string; valores?: AlunoValores }) {
  return (
    <Card className="max-w-3xl p-6">
      <ActionForm action={alunoId ? atualizarAlunoAction : criarAlunoAction} className="flex flex-col gap-5">
        {alunoId ? <input type="hidden" name="alunoId" value={alunoId} /> : null}
        <FormAlert />
        <AlunoCampos v={valores} />
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-5">
          <ButtonLink href={alunoId ? `/alunos/${alunoId}` : "/alunos"} variant="ghost">
            Cancelar
          </ButtonLink>
          <SubmitButton icon={<IconCheck size={16} />}>{alunoId ? "Guardar alterações" : "Registar aluno"}</SubmitButton>
        </div>
      </ActionForm>
    </Card>
  );
}
