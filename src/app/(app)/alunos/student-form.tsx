"use client";

import { ActionForm, FormAlert, SubmitButton } from "@/components/forms/form";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconCheck } from "@/components/ui/icons";
import { updateStudentAction, createStudentAction } from "@/server/actions/students";
import { StudentFields, type StudentValues } from "./student-fields";

export function StudentForm({ studentId, initialValues }: { studentId?: string; initialValues?: StudentValues }) {
  return (
    <Card className="max-w-3xl p-6">
      <ActionForm action={studentId ? updateStudentAction : createStudentAction} className="flex flex-col gap-5">
        {studentId ? <input type="hidden" name="studentId" value={studentId} /> : null}
        <FormAlert />
        <StudentFields v={initialValues} />
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-5">
          <ButtonLink href={studentId ? `/alunos/${studentId}` : "/alunos"} variant="ghost">
            Cancelar
          </ButtonLink>
          <SubmitButton icon={<IconCheck size={16} />}>{studentId ? "Guardar alterações" : "Registar aluno"}</SubmitButton>
        </div>
      </ActionForm>
    </Card>
  );
}
