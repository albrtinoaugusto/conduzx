"use client";

import { FormInput, FormTextarea } from "@/components/forms/form";

export type AlunoValores = {
  nomeCompleto?: string;
  dataNascimento?: string;
  biNumero?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
};

/** Campos do aluno — reutilizados em "Novo aluno", "Editar" e "Nova inscrição". */
export function AlunoCampos({ v = {} }: { v?: AlunoValores }) {
  const hoje = new Date().toISOString().slice(0, 10);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FormInput name="nomeCompleto" label="Nome completo *" defaultValue={v.nomeCompleto} placeholder="Ex.: Albertino Mucavele" autoComplete="off" />
      </div>
      <FormInput name="dataNascimento" type="date" label="Data de nascimento *" max={hoje} defaultValue={v.dataNascimento} />
      <FormInput name="biNumero" label="Número de BI" defaultValue={v.biNumero ?? ""} placeholder="Ex.: 110100123456A" hint="Opcional, mas evita duplicados." />
      <FormInput name="telefone" type="tel" label="Telefone" defaultValue={v.telefone ?? ""} placeholder="84 000 0000" />
      <FormInput name="email" type="email" label="Email" defaultValue={v.email ?? ""} placeholder="opcional" />
      <div className="sm:col-span-2">
        <FormTextarea name="endereco" label="Morada" rows={2} defaultValue={v.endereco ?? ""} placeholder="Bairro, quarteirão, casa…" />
      </div>
    </div>
  );
}
