"use client";

import { useState } from "react";
import { FormSelect, useFormFeedback } from "@/components/forms/form";
import { ModalForm } from "@/components/forms/modal";
import { buttonClasses } from "@/components/ui";
import { IconDownload, IconFile, IconPlus } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatDate, documentTypeLabel } from "@/lib/labels";
import { uploadDocumentAction } from "@/server/actions/documents";
import { MAX_FILE_SIZE } from "@/server/domain/documents";

type DocumentItem = {
  id: string;
  type: string;
  fileName: string;
  createdAt: Date;
  category: string | null;
  uploadedBy: string | null;
};

type Enrollment = { id: string; category: string; enrollmentDate: string };

export function DocumentList({ documents }: { documents: DocumentItem[] }) {
  if (documents.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-night-700/50 p-4 text-sm text-muted">
        <IconFile size={20} className="shrink-0 text-subtle" />
        Ainda não há documentos carregados.
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {documents.map((d) => (
        <li key={d.id} className="flex items-center gap-3 rounded-xl bg-night-700/50 p-3">
          <IconFile size={20} className="shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink" title={d.fileName}>
              {documentTypeLabel[d.type] ?? d.type}
              <span className="font-normal text-muted"> · {d.fileName}</span>
            </p>
            <p className="text-[11px] text-subtle">
              {formatDate(d.createdAt)}
              {d.uploadedBy ? ` · ${d.uploadedBy}` : ""}
              {d.category ? ` · ${d.category}` : ""}
            </p>
          </div>
          <a
            href={`/documentos/${d.id}`}
            className={buttonClasses("ghost", "sm", "px-2.5")}
            aria-label={`Descarregar ${d.fileName}`}
            title="Descarregar"
          >
            <IconDownload size={16} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Campo de ficheiro com verificação imediata do tamanho (o servidor volta a validar). */
function FileField() {
  const e = useFormFeedback();
  const [localError, setLocalError] = useState<string>();
  const error = localError ?? e.fields?.file;
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">Ficheiro *</span>
      <input
        type="file"
        name="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        aria-invalid={error ? true : undefined}
        onChange={(ev) => {
          const f = ev.currentTarget.files?.[0];
          if (f && f.size > MAX_FILE_SIZE) {
            ev.currentTarget.value = "";
            setLocalError("O ficheiro excede o máximo de 5 MB.");
          } else {
            setLocalError(undefined);
          }
        }}
        className={cn(
          "block w-full rounded-xl border border-transparent bg-night-700 p-2 text-sm text-muted shadow-pressed file:mr-3 file:h-8 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand file:px-4 file:text-xs file:font-semibold file:text-brand-ink",
          error && "border-danger/70",
        )}
      />
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-danger">{error}</span>
      ) : (
        <span className="mt-1.5 block text-xs text-subtle">PDF, JPG ou PNG · máximo 5 MB</span>
      )}
    </label>
  );
}

export function UploadDocument({ studentId, enrollments }: { studentId: string; enrollments: Enrollment[] }) {
  return (
    <ModalForm
      trigger="Carregar"
      triggerSize="sm"
      triggerIcon={<IconPlus size={14} />}
      title="Carregar documento"
      description="BI digitalizado, fotografia ou comprovativo do aluno."
      action={uploadDocumentAction}
      submitLabel="Carregar documento"
    >
      <input type="hidden" name="studentId" value={studentId} />
      <FormSelect name="type" label="Tipo de documento *" defaultValue="">
        <option value="" disabled>
          Escolha o tipo
        </option>
        {Object.entries(documentTypeLabel).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </FormSelect>
      {enrollments.length ? (
        <FormSelect name="enrollmentId" label="Inscrição" defaultValue="" hint="Opcional - ex.: comprovativo de uma inscrição">
          <option value="">Nenhuma (documento do aluno)</option>
          {enrollments.map((i) => (
            <option key={i.id} value={i.id}>
              {i.category} · {formatDate(i.enrollmentDate)}
            </option>
          ))}
        </FormSelect>
      ) : null}
      <FileField />
    </ModalForm>
  );
}
