"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { IconAlert, IconCheck } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { FormState } from "@/server/errors";

export type FormAction = (previous: FormState, data: FormData) => Promise<FormState>;

const Ctx = createContext<FormState>({});
export const useFormFeedback = () => useContext(Ctx);

/**
 * Formulário ligado a uma server action. Mostra erros por campo e mensagens gerais.
 * `onSucesso` corre sempre que a action devolve ok (ex.: fechar um modal).
 */
export function ActionForm({
  action,
  children,
  className,
  onSuccess,
  resetOnSuccess = false,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
}) {
  const [status, formAction] = useFormState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (status.ok && status.t) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    } else if (status.error && status.t) {
      // Leva o utilizador ao primeiro erro (útil em formulários longos)
      const target = ref.current?.querySelector<HTMLElement>("[aria-invalid=true], [role=alert]");
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.t]);

  return (
    <Ctx.Provider value={status}>
      <form ref={ref} action={formAction} className={className} noValidate>
        {children}
      </form>
    </Ctx.Provider>
  );
}

/** Mensagem geral (erro ou sucesso) do último envio. */
export function FormAlert({ className }: { className?: string }) {
  const e = useFormFeedback();
  if (!e.error && !(e.ok && e.message)) return null;
  const error = Boolean(e.error);
  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset",
        error ? "bg-danger/10 text-danger ring-danger/30" : "bg-success/10 text-success ring-success/30",
        className,
      )}
    >
      {error ? <IconAlert size={18} className="mt-0.5 shrink-0" /> : <IconCheck size={18} className="mt-0.5 shrink-0" />}
      <div>
        <p className="font-semibold">{e.error ?? e.message}</p>
        {e.link ? (
          <Link href={e.link.href} className="mt-1 inline-block text-xs font-bold underline">
            {e.link.text}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function FormInput(props: ComponentProps<typeof Input> & { name: string }) {
  const e = useFormFeedback();
  return <Input {...props} error={props.error ?? e.fields?.[props.name]} />;
}

export function FormSelect(props: ComponentProps<typeof Select> & { name: string }) {
  const e = useFormFeedback();
  return <Select {...props} error={props.error ?? e.fields?.[props.name]} />;
}

export function FormTextarea({
  label,
  name,
  hint,
  className,
  ...props
}: ComponentProps<"textarea"> & { label?: string; name: string; hint?: string }) {
  const e = useFormFeedback();
  const error = e.fields?.[name];
  return (
    <label className="block">
      {label ? <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span> : null}
      <textarea
        name={name}
        rows={3}
        aria-invalid={error ? true : undefined}
        className={cn(
          "w-full rounded-xl border border-transparent bg-night-700 px-4 py-3 text-sm text-ink shadow-pressed placeholder:text-subtle transition focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/25",
          error && "border-danger/70",
          className,
        )}
        {...props}
      />
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
  className,
  icon,
  pendingLabel = "A guardar…",
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} className={className} icon={pending ? undefined : icon} disabled={pending}>
      {pending ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
