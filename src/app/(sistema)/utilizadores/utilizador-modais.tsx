"use client";

import { FormInput, FormSelect } from "@/components/forms/form";
import { ModalForm } from "@/components/forms/modal";
import { IconPlus } from "@/components/ui/icons";
import { papelRotulo } from "@/lib/rotulos";
import { atualizarUtilizadorAction, criarUtilizadorAction } from "@/server/actions/admin";

function PapelSelect({ defaultValue = "atendente", disabled }: { defaultValue?: string; disabled?: boolean }) {
  return (
    <FormSelect name="papel" label="Papel *" defaultValue={defaultValue} disabled={disabled}>
      {Object.entries(papelRotulo).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </FormSelect>
  );
}

export function NovoUtilizador() {
  return (
    <ModalForm
      trigger="Novo utilizador"
      triggerIcon={<IconPlus size={16} />}
      title="Novo utilizador"
      description="A pessoa entra com este email e palavra-passe."
      action={criarUtilizadorAction}
      submitLabel="Criar utilizador"
    >
      <FormInput name="nome" label="Nome *" />
      <FormInput name="email" type="email" label="Email *" autoComplete="off" />
      <PapelSelect />
      <FormInput name="password" type="password" label="Palavra-passe inicial *" hint="Mínimo 8 caracteres." autoComplete="new-password" />
    </ModalForm>
  );
}

export function EditarUtilizador({
  utilizador,
  proprio,
}: {
  utilizador: { id: string; nome: string; papel: string; ativo: boolean };
  proprio: boolean;
}) {
  return (
    <ModalForm
      trigger="Editar"
      triggerVariant="ghost"
      triggerSize="sm"
      title={`Editar ${utilizador.nome}`}
      action={atualizarUtilizadorAction}
      submitLabel="Guardar"
    >
      <input type="hidden" name="utilizadorId" value={utilizador.id} />
      {proprio ? (
        <>
          <input type="hidden" name="papel" value="admin" />
          <input type="hidden" name="ativo" value="on" />
          <p className="text-xs text-muted">Não pode alterar o seu próprio papel nem desativar a sua conta.</p>
        </>
      ) : (
        <>
          <PapelSelect defaultValue={utilizador.papel} />
          <label className="flex items-center gap-3 text-sm text-ink">
            <input type="checkbox" name="ativo" defaultChecked={utilizador.ativo} className="h-5 w-5 accent-[rgb(var(--brand-400))]" />
            Conta ativa (pode entrar no sistema)
          </label>
        </>
      )}
      <FormInput name="password" type="password" label="Nova palavra-passe" hint="Deixe vazio para manter a atual." autoComplete="new-password" />
    </ModalForm>
  );
}
