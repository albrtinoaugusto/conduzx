"use client";

import { FormInput, FormTextarea } from "@/components/forms/form";

export type StudentValues = {
  fullName?: string;
  birthDate?: string;
  idNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

/** Campos do aluno - reutilizados em "Novo aluno", "Editar" e "Nova inscrição". */
export function StudentFields({ v = {} }: { v?: StudentValues }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FormInput name="fullName" label="Nome completo *" defaultValue={v.fullName} placeholder="Ex.: Albertino Mucavele" autoComplete="off" />
      </div>
      <FormInput name="birthDate" type="date" label="Data de nascimento *" max={today} defaultValue={v.birthDate} />
      <FormInput name="idNumber" label="Número de BI" defaultValue={v.idNumber ?? ""} placeholder="Ex.: 110100123456A" hint="Opcional, mas evita duplicados." />
      <FormInput name="phone" type="tel" label="Telefone" defaultValue={v.phone ?? ""} placeholder="84 000 0000" />
      <FormInput name="email" type="email" label="Email" defaultValue={v.email ?? ""} placeholder="opcional" />
      <div className="sm:col-span-2">
        <FormTextarea name="address" label="Morada" rows={2} defaultValue={v.address ?? ""} placeholder="Bairro, quarteirão, casa…" />
      </div>
    </div>
  );
}
