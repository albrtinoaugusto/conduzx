"use client";

import { FormInput } from "@/components/forms/form";
import { ModalForm } from "@/components/forms/modal";
import { IconPlus } from "@/components/ui/icons";
import { saveCategoryAction } from "@/server/actions/admin";

type Category = { id: string; code: string; name: string; price: string; active: boolean };

export function CategoryModal({ category }: { category?: Category }) {
  const isEdit = Boolean(category);
  return (
    <ModalForm
      trigger={isEdit ? "Editar" : "Nova categoria"}
      triggerVariant={isEdit ? "ghost" : "primary"}
      triggerSize={isEdit ? "sm" : "md"}
      triggerIcon={isEdit ? undefined : <IconPlus size={16} />}
      title={isEdit ? `Editar categoria ${category!.code}` : "Nova categoria"}
      action={saveCategoryAction}
      submitLabel={isEdit ? "Guardar" : "Criar categoria"}
    >
      {category ? <input type="hidden" name="categoryId" value={category.id} /> : null}
      <div className="grid grid-cols-3 gap-3">
        <FormInput name="code" label="Código *" defaultValue={category?.code} placeholder="B" />
        <div className="col-span-2">
          <FormInput name="name" label="Nome *" defaultValue={category?.name} placeholder="B — Ligeiros" />
        </div>
      </div>
      <FormInput name="price" label="Preço (MT) *" inputMode="decimal" defaultValue={category?.price} placeholder="18.500" />
      {isEdit ? (
        <label className="flex items-center gap-3 text-sm text-ink">
          <input type="checkbox" name="active" defaultChecked={category!.active} className="h-5 w-5 accent-[rgb(var(--brand-400))]" />
          Categoria ativa (disponível em novas inscrições)
        </label>
      ) : (
        <input type="hidden" name="active" value="on" />
      )}
    </ModalForm>
  );
}
