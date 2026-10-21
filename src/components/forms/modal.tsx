"use client";

import { useRef, type ReactNode } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { ActionForm, FormAlert, SubmitButton, type FormAction } from "./form";

/**
 * Botão que abre um <dialog> com um formulário ligado a uma server action.
 * Fecha automaticamente quando a action devolve ok.
 */
export function ModalForm({
  trigger,
  triggerVariant = "primary",
  triggerSize = "md",
  triggerIcon,
  triggerClassName,
  title,
  description,
  action,
  submitLabel,
  submitVariant = "primary",
  children,
}: {
  trigger: ReactNode;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  triggerIcon?: ReactNode;
  triggerClassName?: string;
  title: string;
  description?: ReactNode;
  action: FormAction;
  submitLabel: string;
  submitVariant?: ButtonVariant;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        icon={triggerIcon}
        className={triggerClassName}
        onClick={() => ref.current?.showModal()}
      >
        {trigger}
      </Button>
      <dialog
        ref={ref}
        className="m-auto w-[min(92vw,30rem)] rounded-3xl border border-white/10 bg-night-800 p-0 text-ink shadow-shell backdrop:bg-black/70 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <ActionForm action={action} onSuccess={() => ref.current?.close()} resetOnSuccess className="flex flex-col gap-4 p-6">
          <div>
            <h2 className="font-display text-lg font-bold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
          </div>
          <FormAlert />
          {children}
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => ref.current?.close()}>
              Cancelar
            </Button>
            <SubmitButton variant={submitVariant}>{submitLabel}</SubmitButton>
          </div>
        </ActionForm>
      </dialog>
    </>
  );
}
