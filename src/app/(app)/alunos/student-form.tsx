"use client";

import { DateInput } from "@/components/forms/date-input";
import { ActionForm, FormAlert, SubmitButton } from "@/components/forms/form";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconCheck } from "@/components/ui/icons";
import { formatDate } from "@/lib/labels";
import { updateStudentAction, createStudentAction } from "@/server/actions/students";
import { DocumentPickers } from "./document-pickers";
import { StudentFields, type StudentValues } from "./student-fields";

type EditableEnrollment = { id: string; category: string; enrollmentDate: string; firstLessonDate: string | null };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-5 first:border-0 first:pt-0">
      <h2 className="font-display text-base font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function StudentForm({
  studentId,
  initialValues,
  enrollments = [],
  photoUrl,
  idCardUrl,
}: {
  studentId?: string;
  initialValues?: StudentValues;
  enrollments?: EditableEnrollment[];
  photoUrl?: string;
  idCardUrl?: string;
}) {
  return (
    <Card className="max-w-3xl p-6">
      <ActionForm action={studentId ? updateStudentAction : createStudentAction} className="flex flex-col gap-5">
        {studentId ? <input type="hidden" name="studentId" value={studentId} /> : null}
        <FormAlert />
        <Section title="Dados pessoais">
          <StudentFields v={initialValues} />
        </Section>
        <Section title="Foto tipo passe e BI">
          <DocumentPickers photoUrl={photoUrl} idCardUrl={idCardUrl} />
        </Section>
        {enrollments.length ? (
          <Section title="Inscrições">
            {enrollments.map((i) => (
              <div key={i.id} className="rounded-2xl bg-night-700/40 p-4">
                <input type="hidden" name="enrollmentIds" value={i.id} />
                <p className="mb-3 text-sm font-semibold text-ink">
                  {i.category} <span className="font-normal text-subtle">· inscrito em {formatDate(i.enrollmentDate)}</span>
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DateInput name={`enrollmentDate__${i.id}`} label="Data de inscrição *" defaultValue={i.enrollmentDate} />
                  <DateInput name={`firstLessonDate__${i.id}`} label="Primeira aula" defaultValue={i.firstLessonDate} />
                </div>
              </div>
            ))}
          </Section>
        ) : null}
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
