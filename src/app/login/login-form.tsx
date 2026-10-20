"use client";

import { ActionForm, FormAlert, FormInput, SubmitButton } from "@/components/forms/form";
import { entrarAction } from "@/server/actions/auth";

export function LoginForm() {
  return (
    <ActionForm action={entrarAction} className="mt-6 flex flex-col gap-4">
      <FormAlert />
      <FormInput name="email" type="email" label="Email" autoComplete="email" placeholder="nome@escola.co.mz" autoFocus required />
      <FormInput name="password" type="password" label="Palavra-passe" autoComplete="current-password" required />
      <SubmitButton size="lg" className="mt-2 w-full" pendente="A entrar…">
        Entrar
      </SubmitButton>
    </ActionForm>
  );
}
