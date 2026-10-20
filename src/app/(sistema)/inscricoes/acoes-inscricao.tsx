"use client";

import { useState } from "react";
import { ActionForm, FormAlert, FormInput, FormSelect, FormTextarea, SubmitButton } from "@/components/forms/form";
import { ModalForm } from "@/components/forms/modal";
import { IconCheck, IconClock, IconPlus } from "@/components/ui/icons";
import { formatMoneyMzn } from "@/lib/format-money";
import { metodoRotulo } from "@/lib/rotulos";
import {
  anularPagamentoAction,
  atualizarEstadoAlunoAction,
  atualizarInatroAction,
  registarPagamentoAction,
} from "@/server/actions/inscricoes";

export function RegistarPagamento({ inscricaoId, saldoCentavos }: { inscricaoId: string; saldoCentavos: number }) {
  if (saldoCentavos <= 0) {
    return <p className="rounded-xl bg-success/10 p-4 text-sm font-semibold text-success">Inscrição totalmente paga.</p>;
  }
  return (
    <ActionForm action={registarPagamentoAction} limparAoSucesso className="flex flex-col gap-4">
      <input type="hidden" name="inscricaoId" value={inscricaoId} />
      <FormAlert />
      <FormInput name="valor" label="Valor (MT) *" inputMode="decimal" placeholder={`Máx. ${formatMoneyMzn(saldoCentavos)}`} />
      <div className="grid grid-cols-2 gap-3">
        <FormSelect name="metodo" label="Método" defaultValue="dinheiro">
          {Object.entries(metodoRotulo).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </FormSelect>
        <FormInput name="referencia" label="Referência" placeholder="opcional" />
      </div>
      <SubmitButton icon={<IconPlus size={16} />} className="w-full">
        Registar pagamento
      </SubmitButton>
    </ActionForm>
  );
}

export function AnularPagamento({ pagamentoId, valor }: { pagamentoId: string; valor: number }) {
  return (
    <ModalForm
      trigger="Anular"
      triggerVariant="danger"
      triggerSize="sm"
      title="Anular pagamento"
      description={`O pagamento de ${formatMoneyMzn(valor)} deixa de contar no total. Esta ação fica registada no histórico e não pode ser desfeita.`}
      action={anularPagamentoAction}
      submitLabel="Anular pagamento"
      submitVariant="danger"
    >
      <input type="hidden" name="pagamentoId" value={pagamentoId} />
      <FormTextarea name="motivo" label="Motivo *" placeholder="Ex.: valor digitado errado" />
    </ModalForm>
  );
}

export function MarcarRegistado({ inscricaoId, compacto = false }: { inscricaoId: string; compacto?: boolean }) {
  return (
    <ModalForm
      trigger="Marcar registado"
      triggerVariant={compacto ? "outline" : "primary"}
      triggerSize="sm"
      triggerIcon={<IconCheck size={14} />}
      title="Marcar como registado no INATRO"
      description="Indique o número de processo atribuído pelo INATRO."
      action={atualizarInatroAction}
      submitLabel="Confirmar registo"
    >
      <input type="hidden" name="inscricaoId" value={inscricaoId} />
      <input type="hidden" name="estado" value="registado" />
      <FormInput name="numeroProcesso" label="Número de processo *" placeholder="Ex.: MPT-2026-08812" />
    </ModalForm>
  );
}

export function ManterPendente({ inscricaoId, nota }: { inscricaoId: string; nota: string | null }) {
  return (
    <ModalForm
      trigger="Manter pendente"
      triggerVariant="secondary"
      triggerSize="sm"
      triggerIcon={<IconClock size={14} />}
      title="Registar nova tentativa"
      description="A inscrição continua pendente. Fica registada a data desta tentativa."
      action={atualizarInatroAction}
      submitLabel="Guardar tentativa"
    >
      <input type="hidden" name="inscricaoId" value={inscricaoId} />
      <input type="hidden" name="estado" value="pendente" />
      <FormTextarea name="nota" label="Nota" defaultValue={nota ?? ""} placeholder="Ex.: sistema voltou a falhar às 14h." />
    </ModalForm>
  );
}

export function EstadoInatroForm({
  inscricaoId,
  estado,
  numeroProcesso,
  nota,
}: {
  inscricaoId: string;
  estado: "nao_registado" | "pendente" | "registado";
  numeroProcesso: string | null;
  nota: string | null;
}) {
  const [novo, setNovo] = useState(estado);
  return (
    <ActionForm action={atualizarInatroAction} className="flex flex-col gap-4">
      <input type="hidden" name="inscricaoId" value={inscricaoId} />
      <FormAlert />
      <FormSelect name="estado" label="Estado" value={novo} onChange={(e) => setNovo(e.target.value as typeof estado)}>
        <option value="nao_registado">Não registado</option>
        <option value="pendente">Pendente</option>
        <option value="registado">Registado</option>
      </FormSelect>
      {novo === "registado" ? (
        <FormInput name="numeroProcesso" label="Número de processo *" defaultValue={numeroProcesso ?? ""} placeholder="Ex.: MPT-2026-08812" />
      ) : null}
      <FormTextarea name="nota" label="Nota" rows={2} defaultValue={nota ?? ""} placeholder="Tentativas, falhas, o que falta…" />
      <SubmitButton variant="secondary">Guardar estado INATRO</SubmitButton>
    </ActionForm>
  );
}

export function EstadoAlunoForm({ inscricaoId, estado }: { inscricaoId: string; estado: string }) {
  return (
    <ActionForm action={atualizarEstadoAlunoAction} className="flex items-end gap-3">
      <input type="hidden" name="inscricaoId" value={inscricaoId} />
      <div className="flex-1">
        <FormSelect name="estado" label="Situação do aluno" defaultValue={estado}>
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
