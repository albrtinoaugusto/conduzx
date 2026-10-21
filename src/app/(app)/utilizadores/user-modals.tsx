"use client";

import { FormInput, FormSelect } from "@/components/forms/form";
import { ModalForm } from "@/components/forms/modal";
import { IconPlus } from "@/components/ui/icons";
import { roleLabel } from "@/lib/labels";
import { updateUserAction, createUserAction } from "@/server/actions/admin";

function RoleSelect({ defaultValue = "atendente", disabled }: { defaultValue?: string; disabled?: boolean }) {
  return (
    <FormSelect name="role" label="Papel *" defaultValue={defaultValue} disabled={disabled}>
      {Object.entries(roleLabel).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </FormSelect>
  );
}

export function NewUser() {
  return (
    <ModalForm
      trigger="Novo utilizador"
      triggerIcon={<IconPlus size={16} />}
      title="Novo utilizador"
      description="A pessoa entra com este email e palavra-passe."
      action={createUserAction}
      submitLabel="Criar utilizador"
    >
      <FormInput name="name" label="Nome *" />
      <FormInput name="email" type="email" label="Email *" autoComplete="off" />
      <RoleSelect />
      <FormInput name="password" type="password" label="Palavra-passe inicial *" hint="Mínimo 8 caracteres." autoComplete="new-password" />
    </ModalForm>
  );
}

export function EditUser({
  user,
  isSelf,
}: {
  user: { id: string; name: string; role: string; active: boolean };
  isSelf: boolean;
}) {
  return (
    <ModalForm
      trigger="Editar"
      triggerVariant="ghost"
      triggerSize="sm"
      title={`Editar ${user.name}`}
      action={updateUserAction}
      submitLabel="Guardar"
    >
      <input type="hidden" name="userId" value={user.id} />
      {isSelf ? (
        <>
          <input type="hidden" name="role" value="admin" />
          <input type="hidden" name="active" value="on" />
          <p className="text-xs text-muted">Não pode alterar o seu próprio papel nem desativar a sua conta.</p>
        </>
      ) : (
        <>
          <RoleSelect defaultValue={user.role} />
          <label className="flex items-center gap-3 text-sm text-ink">
            <input type="checkbox" name="active" defaultChecked={user.active} className="h-5 w-5 accent-[rgb(var(--brand-400))]" />
            Conta ativa (pode entrar no sistema)
          </label>
        </>
      )}
      <FormInput name="password" type="password" label="Nova palavra-passe" hint="Deixe vazio para manter a atual." autoComplete="new-password" />
    </ModalForm>
  );
}
