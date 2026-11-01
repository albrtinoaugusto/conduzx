"use client";

import { useState } from "react";
import { ActionForm, FormAlert, FormInput, FormSelect, SubmitButton } from "@/components/forms/form";
import { IconArrowRight, IconShield, IconUsers } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { signInAction } from "@/server/actions/auth";
import { studentSignInAction } from "@/server/actions/portal";

const TABS = [
  { id: "aluno", label: "Aluno", icon: IconUsers },
  { id: "escola", label: "Escola", icon: IconShield },
] as const;

export function EntryForm({ schools }: { schools: Array<{ id: string; name: string }> }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("aluno");

  return (
    // text-base nos campos: abaixo de 16px o iPhone faz zoom ao tocar
    <div className="rounded-4xl border border-white/5 bg-night-800 p-5 shadow-shell sm:p-7 [&_input]:text-base [&_select]:text-base">
      <div role="tablist" aria-label="Tipo de acesso" className="relative grid grid-cols-2 rounded-full bg-night-900 p-1 shadow-pressed">
        <span
          aria-hidden="true"
          className={cn("absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-brand shadow-glow transition-transform duration-300 ease-out", tab === "escola" && "translate-x-full")}
        />
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn("relative z-10 flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition-colors duration-300", tab === id ? "text-brand-ink" : "text-muted")}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === "aluno" ? (
        <div key="aluno" className="animate-fade-up">
          <h1 className="mt-6 font-display text-[clamp(1.35rem,6vw,1.6rem)] font-extrabold leading-tight text-ink">Veja a sua situação</h1>
          <p className="mt-1 text-sm text-muted">Inscrição, pagamentos e testes de prática.</p>
          <ActionForm action={studentSignInAction} className="mt-5 flex flex-col gap-4">
            <FormAlert />
            <FormSelect name="schoolId" label="A sua escola" defaultValue="">
              <option value="" disabled>
                Escolha a escola
              </option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </FormSelect>
            <FormInput name="identifier" label="Número de BI ou telefone" autoComplete="username" placeholder="Ex.: 84 000 0000" />
            <FormInput name="birthDate" type="date" label="Data de nascimento" autoComplete="bday" />
            <SubmitButton size="lg" className="mt-1 w-full" icon={<IconArrowRight size={18} />} pendingLabel="A entrar…">
              Entrar
            </SubmitButton>
          </ActionForm>
        </div>
      ) : (
        <div key="escola" className="animate-fade-up">
          <h1 className="mt-6 font-display text-[clamp(1.35rem,6vw,1.6rem)] font-extrabold leading-tight text-ink">Gestão da escola</h1>
          <p className="mt-1 text-sm text-muted">Acesso para a secretaria e a direção.</p>
          <ActionForm action={signInAction} className="mt-5 flex flex-col gap-4">
            <FormAlert />
            <FormInput name="email" type="email" label="Email" autoComplete="email" placeholder="nome@escola.co.mz" />
            <FormInput name="password" type="password" label="Palavra-passe" autoComplete="current-password" />
            <SubmitButton size="lg" className="mt-1 w-full" icon={<IconArrowRight size={18} />} pendingLabel="A entrar…">
              Entrar
            </SubmitButton>
          </ActionForm>
        </div>
      )}
    </div>
  );
}
