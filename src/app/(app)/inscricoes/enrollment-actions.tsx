"use client";

import { useState } from "react";
import { ActionForm, FormAlert, FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/forms/form";
import { ModalForm } from "@/components/forms/modal";
import { IconCheck, IconClock, IconPlus } from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { methodLabel } from "@/lib/labels";
import {
  voidPaymentAction,
  updateStudentStatusAction,
  updateInatroAction,
  recordPaymentAction,
} from "@/server/actions/enrollments";

export function RecordPayment({ enrollmentId, balanceCents }: { enrollmentId: string; balanceCents: number }) {
  if (balanceCents <= 0) {
    return <p className="rounded-xl bg-success/10 p-4 text-sm font-semibold text-success">Inscrição totalmente paga.</p>;
  }
  return (
    <ActionForm action={recordPaymentAction} resetOnSuccess className="flex flex-col gap-4">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <FormAlert />
      <FormInput name="amount" label="Valor (MT) *" inputMode="decimal" placeholder={`Máx. ${formatMoneyMzn(balanceCents)}`} />
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
      <SubmitButton icon={<IconPlus size={16} />} className="w-full">
        Registar pagamento
      </SubmitButton>
    </ActionForm>
  );
}

export function VoidPayment({ paymentId, amount }: { paymentId: string; amount: number }) {
  return (
    <ModalForm
      trigger="Anular"
      triggerVariant="danger"
      triggerSize="sm"
      title="Anular pagamento"
      description={`O pagamento de ${formatMoneyMzn(amount)} deixa de contar no total. Esta ação fica registada no histórico e não pode ser desfeita.`}
      action={voidPaymentAction}
      submitLabel="Anular pagamento"
      submitVariant="danger"
    >
      <input type="hidden" name="paymentId" value={paymentId} />
      <FormTextarea name="reason" label="Motivo *" placeholder="Ex.: valor introduzido por engano" />
    </ModalForm>
  );
}

export function MarkRegistered({ enrollmentId, compact = false }: { enrollmentId: string; compact?: boolean }) {
  return (
    <ModalForm
      trigger="Marcar registado"
      triggerVariant={compact ? "outline" : "primary"}
      triggerSize="sm"
      triggerIcon={<IconCheck size={14} />}
      title="Marcar como registado no INATRO"
      description="Indique o número de processo atribuído pelo INATRO."
      action={updateInatroAction}
      submitLabel="Confirmar registo"
    >
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <input type="hidden" name="status" value="registado" />
      <FormInput name="processNumber" label="Número de processo *" placeholder="Ex.: MPT-2026-08812" />
    </ModalForm>
  );
}

export function KeepPending({ enrollmentId, note }: { enrollmentId: string; note: string | null }) {
  return (
    <ModalForm
      trigger="Manter pendente"
      triggerVariant="secondary"
      triggerSize="sm"
      triggerIcon={<IconClock size={14} />}
      title="Registar nova tentativa"
      description="A inscrição continua pendente. Fica registada a data desta tentativa."
      action={updateInatroAction}
      submitLabel="Guardar tentativa"
    >
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <input type="hidden" name="status" value="pendente" />
      <FormTextarea name="note" label="Nota" defaultValue={note ?? ""} placeholder="Ex.: sistema voltou a falhar às 14h." />
    </ModalForm>
  );
}

export function InatroStatusForm({
  enrollmentId,
  status,
  processNumber,
  note,
}: {
  enrollmentId: string;
  status: "nao_registado" | "pendente" | "registado";
  processNumber: string | null;
  note: string | null;
}) {
  const [selectedStatus, setSelectedStatus] = useState(status);
  return (
    <ActionForm action={updateInatroAction} className="flex flex-col gap-4">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <FormAlert />
      <FormSelect name="status" label="Estado" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as typeof status)}>
        <option value="nao_registado">Não registado</option>
        <option value="pendente">Pendente</option>
        <option value="registado">Registado</option>
      </FormSelect>
      {selectedStatus === "registado" ? (
        <FormInput name="processNumber" label="Número de processo *" defaultValue={processNumber ?? ""} placeholder="Ex.: MPT-2026-08812" />
      ) : null}
      <FormTextarea name="note" label="Nota" rows={2} defaultValue={note ?? ""} placeholder="Tentativas, falhas, o que falta…" />
      <SubmitButton variant="secondary">Guardar estado INATRO</SubmitButton>
    </ActionForm>
  );
}

export function StudentStatusForm({ enrollmentId, status }: { enrollmentId: string; status: string }) {
  return (
    <ActionForm action={updateStudentStatusAction} className="flex items-end gap-3">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <div className="flex-1">
        <FormSelect name="status" label="Situação do aluno" defaultValue={status}>
          <option value="ativo">Ativo</option>
          <option value="concluido">Concluído</option>
          <option value="desistiu">Desistiu</option>
        </FormSelect>
      </div>
      <SubmitButton variant="secondary" className="h-11">
        Guardar
      </SubmitButton>
    </ActionForm>
  );
}
