"use client";

import { FormInput, FormSelect, FormTextarea } from "@/components/forms/form";
import { ModalForm } from "@/components/forms/modal";
import { Badge } from "@/components/ui";
import { IconCheck } from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { formatDate, methodLabel } from "@/lib/labels";
import { grantPracticeAccessAction, voidPracticeAccessAction } from "@/server/actions/practice-access";

type Access = {
  id: string;
  amountCents: number;
  method: string;
  reference: string | null;
  createdAt: Date;
  grantedBy: string | null;
} | null;

export function PracticeAccessPanel({ studentId, access, canVoid }: { studentId: string; access: Access; canVoid: boolean }) {
  if (access) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-night-700/50 p-3">
        <div className="min-w-0">
          <Badge tone="success" dot>
            Ativo
          </Badge>
          <p className="mt-1.5 text-xs text-muted">
            {formatMoneyMzn(access.amountCents)} · {methodLabel[access.method]} · {formatDate(access.createdAt)}
            {access.grantedBy ? ` · ${access.grantedBy}` : ""}
          </p>
        </div>
        {canVoid ? (
          <ModalForm
            trigger="Anular"
            triggerVariant="danger"
            triggerSize="sm"
            title="Anular acesso aos testes"
            description="O aluno deixa de poder iniciar testes. Esta ação fica registada no histórico."
            action={voidPracticeAccessAction}
            submitLabel="Anular acesso"
            submitVariant="danger"
          >
            <input type="hidden" name="accessId" value={access.id} />
            <input type="hidden" name="studentId" value={studentId} />
            <FormTextarea name="reason" label="Motivo *" placeholder="Ex.: ativado no aluno errado" />
          </ModalForm>
        ) : null}
      </div>
    );
  }

  return (
    <ModalForm
      trigger="Ativar testes"
      triggerSize="sm"
      triggerIcon={<IconCheck size={14} />}
      title="Ativar acesso aos testes"
      description="Registe o valor recebido do aluno. O acesso fica disponível de imediato no telemóvel dele."
      action={grantPracticeAccessAction}
      submitLabel="Ativar acesso"
    >
      <input type="hidden" name="studentId" value={studentId} />
      <FormInput name="amount" label="Valor recebido (MT) *" inputMode="decimal" placeholder="Ex.: 500" />
      <div className="grid grid-cols-2 gap-3">
        <FormSelect name="method" label="Método" defaultValue="dinheiro">
          {Object.entries(methodLabel).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </FormSelect>
        <FormInput name="reference" label="Referência" placeholder="opcional" />
      </div>
    </ModalForm>
  );
}
