"use client";

import { ActionForm, FormAlert, SubmitButton } from "@/components/forms/form";
import { IconArrowRight } from "@/components/ui/icons";
import { startExamAction } from "@/server/actions/portal";

export function StartExamButton({ resume }: { resume: boolean }) {
  return (
    <ActionForm action={startExamAction} className="flex flex-col gap-3">
      <FormAlert />
      <SubmitButton size="lg" className="w-full" icon={<IconArrowRight size={18} />} pendingLabel="A preparar…">
        {resume ? "Voltar ao teste" : "Iniciar teste"}
      </SubmitButton>
    </ActionForm>
  );
}
