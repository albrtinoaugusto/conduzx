"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { displayToIso, isoToDisplay, maskDate } from "@/lib/dates";
import { useFormFeedback } from "./form";

/**
 * Data sempre no formato dia/mês/ano, independentemente da língua do browser
 * (o `type="date"` mostra mês/dia/ano em computadores configurados em inglês).
 * O servidor continua a receber AAAA-MM-DD no campo `name`.
 */
export function DateInput({
  name,
  label,
  hint,
  defaultValue,
  autoComplete,
}: {
  name: string;
  label?: string;
  hint?: string;
  defaultValue?: string | null;
  autoComplete?: string;
}) {
  const feedback = useFormFeedback();
  const [text, setText] = useState(isoToDisplay(defaultValue));
  // Incompleta ou inexistente: envia o texto tal como está para o servidor dar a mensagem de erro
  const value = text ? (displayToIso(text) ?? text) : "";

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Input
        label={label}
        hint={hint ?? "dd/mm/aaaa"}
        error={feedback.fields?.[name]}
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        autoComplete={autoComplete}
        maxLength={10}
        value={text}
        onChange={(e) => setText(maskDate(e.target.value))}
      />
    </>
  );
}
