"use client";

import { FormInput } from "@/components/forms/form";
import { ModalForm } from "@/components/forms/modal";
import { IconPlus } from "@/components/ui/icons";
import { guardarCategoriaAction } from "@/server/actions/admin";

type Categoria = { id: string; codigo: string; nome: string; preco: string; ativo: boolean };

export function CategoriaModal({ categoria }: { categoria?: Categoria }) {
  const editar = Boolean(categoria);
  return (
    <ModalForm
      trigger={editar ? "Editar" : "Nova categoria"}
      triggerVariant={editar ? "ghost" : "primary"}
      triggerSize={editar ? "sm" : "md"}
      triggerIcon={editar ? undefined : <IconPlus size={16} />}
      title={editar ? `Editar categoria ${categoria!.codigo}` : "Nova categoria"}
      action={guardarCategoriaAction}
      submitLabel={editar ? "Guardar" : "Criar categoria"}
    >
      {categoria ? <input type="hidden" name="categoriaId" value={categoria.id} /> : null}
      <div className="grid grid-cols-3 gap-3">
        <FormInput name="codigo" label="Código *" defaultValue={categoria?.codigo} placeholder="B" />
        <div className="col-span-2">
          <FormInput name="nome" label="Nome *" defaultValue={categoria?.nome} placeholder="B — Ligeiros" />
        </div>
      </div>
      <FormInput name="preco" label="Preço (MT) *" inputMode="decimal" defaultValue={categoria?.preco} placeholder="18.500" />
      {editar ? (
        <label className="flex items-center gap-3 text-sm text-ink">
          <input type="checkbox" name="ativo" defaultChecked={categoria!.ativo} className="h-5 w-5 accent-[rgb(var(--brand-400))]" />
          Categoria ativa (disponível em novas inscrições)
        </label>
      ) : (
        <input type="hidden" name="ativo" value="on" />
      )}
    </ModalForm>
  );
}
