"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ActionForm, FormSelect, useFormFeedback } from "@/components/forms/form";
import { ModalForm } from "@/components/forms/modal";
import { buttonClasses } from "@/components/ui";
import { IconCamera, IconDownload, IconFile, IconPlus } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatDate, documentTypeLabel } from "@/lib/labels";
import { uploadDocumentAction } from "@/server/actions/documents";
import { MAX_FILE_SIZE } from "@/server/domain/documents";
import { PhotoCropper } from "./photo-cropper";

type DocumentItem = {
  id: string;
  type: string;
  fileName: string;
  mimeType: string;
  createdAt: Date;
  category: string | null;
  uploadedBy: string | null;
};

type Enrollment = { id: string; category: string; enrollmentDate: string };

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,image/jpeg,image/png";
const ANY_ACCEPT = `.pdf,application/pdf,${IMAGE_ACCEPT}`;
const SIZE_ERROR = "O ficheiro excede o máximo de 5 MB.";

function DocumentRow({ d }: { d: DocumentItem }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-night-700/50 p-3">
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
  );
}

function SlotButton({ label, accept, crop, onError }: { label: string; accept: string; crop: boolean; onError: (m?: string) => void }) {
  const { pending } = useFormStatus();
  const input = useRef<HTMLInputElement>(null);
  const [toCrop, setToCrop] = useState<File>();

  function closeCropper() {
    if (input.current) input.current.value = "";
    setToCrop(undefined);
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        name="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        onChange={(ev) => {
          const f = ev.currentTarget.files?.[0];
          if (!f) return;
          onError(undefined);
          // O recorte reduz a foto, por isso o limite de tamanho só se aplica aos ficheiros enviados tal como estão
          if (crop) {
            setToCrop(f);
            return;
          }
          if (f.size > MAX_FILE_SIZE) {
            ev.currentTarget.value = "";
            onError(SIZE_ERROR);
            return;
          }
          ev.currentTarget.form?.requestSubmit();
        }}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          // Permite voltar a escolher o mesmo ficheiro depois de cancelar o recorte
          if (input.current) input.current.value = "";
          input.current?.click();
        }}
        className={buttonClasses("secondary", "sm")}
      >
        {pending ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" /> : null}
        {pending ? "A carregar…" : label}
      </button>
      {toCrop ? (
        <PhotoCropper
          file={toCrop}
          onCancel={closeCropper}
          onError={(message) => {
            closeCropper();
            onError(message);
          }}
          onConfirm={(cropped) => {
            const transfer = new DataTransfer();
            transfer.items.add(cropped);
            if (input.current) input.current.files = transfer.files;
            setToCrop(undefined);
            input.current?.form?.requestSubmit();
          }}
        />
      ) : null}
    </>
  );
}

function SlotFeedback({ localError }: { localError?: string }) {
  const f = useFormFeedback();
  const error = localError ?? (f.error ? (f.fields?.file ?? f.error) : undefined);
  return error ? (
    <p role="alert" className="mt-1 text-xs font-medium text-danger">
      {error}
    </p>
  ) : null;
}

/** Um documento próprio (foto tipo passe, BI): escolher o ficheiro já o carrega. O mais recente é o válido. */
function DocumentSlot({
  studentId,
  type,
  title,
  hint,
  accept,
  current,
  canUpload,
}: {
  studentId: string;
  type: "foto" | "bi";
  title: string;
  hint: string;
  accept: string;
  current?: DocumentItem;
  canUpload: boolean;
}) {
  const [localError, setLocalError] = useState<string>();
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-night-700/50 p-3">
      <span className={cn("flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-night-900 shadow-pressed", current ? "text-brand" : "text-subtle")}>
        {current?.mimeType.startsWith("image/") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/documentos/${current.id}?inline=1`} alt={title} className="h-full w-full object-cover" />
        ) : type === "foto" ? (
          <IconCamera size={22} />
        ) : (
          <IconFile size={22} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="truncate text-[11px] text-subtle">{current ? `${formatDate(current.createdAt)} · ${current.fileName}` : hint}</p>
        <ActionForm action={uploadDocumentAction} className="mt-2">
          <input type="hidden" name="studentId" value={studentId} />
          <input type="hidden" name="type" value={type} />
          <div className="flex flex-wrap items-center gap-2">
            {canUpload ? <SlotButton label={current ? "Substituir" : "Carregar"} accept={accept} crop={type === "foto"} onError={setLocalError} /> : null}
            {current ? (
              <a href={`/documentos/${current.id}`} className={buttonClasses("ghost", "sm")}>
                <IconDownload size={14} />
                Descarregar
              </a>
            ) : null}
          </div>
          <SlotFeedback localError={localError} />
        </ActionForm>
      </div>
    </div>
  );
}

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
        accept={ANY_ACCEPT}
        aria-invalid={error ? true : undefined}
        onChange={(ev) => {
          const f = ev.currentTarget.files?.[0];
          if (f && f.size > MAX_FILE_SIZE) {
            ev.currentTarget.value = "";
            setLocalError(SIZE_ERROR);
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

function UploadOtherDocument({ studentId, enrollments }: { studentId: string; enrollments: Enrollment[] }) {
  return (
    <ModalForm
      trigger="Carregar"
      triggerSize="sm"
      triggerVariant="secondary"
      triggerIcon={<IconPlus size={14} />}
      title="Carregar outro documento"
      description="Comprovativos e outros documentos do aluno."
      action={uploadDocumentAction}
      submitLabel="Carregar documento"
    >
      <input type="hidden" name="studentId" value={studentId} />
      <FormSelect name="type" label="Tipo de documento *" defaultValue="comprovativo">
        <option value="comprovativo">{documentTypeLabel.comprovativo}</option>
        <option value="outro">{documentTypeLabel.outro}</option>
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

/** Foto, BI e outros documentos em campos separados. A lista já vem do mais recente para o mais antigo. */
export function StudentDocuments({
  studentId,
  documents,
  enrollments,
  canUpload,
}: {
  studentId: string;
  documents: DocumentItem[];
  enrollments: Enrollment[];
  canUpload: boolean;
}) {
  const photo = documents.find((d) => d.type === "foto");
  const idCard = documents.find((d) => d.type === "bi");
  const others = documents.filter((d) => d.id !== photo?.id && d.id !== idCard?.id);

  return (
    <div className="flex flex-col gap-3">
      <DocumentSlot studentId={studentId} type="foto" title="Foto tipo passe" hint="JPG ou PNG · recorta antes de guardar" accept={IMAGE_ACCEPT} current={photo} canUpload={canUpload} />
      <DocumentSlot studentId={studentId} type="bi" title="BI" hint="PDF, JPG ou PNG · máximo 5 MB" accept={ANY_ACCEPT} current={idCard} canUpload={canUpload} />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Outros documentos</p>
        {canUpload ? <UploadOtherDocument studentId={studentId} enrollments={enrollments} /> : null}
      </div>
      {others.length ? (
        <ul className="flex flex-col gap-2">
          {others.map((d) => (
            <DocumentRow key={d.id} d={d} />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">Ainda não há outros documentos.</p>
      )}
    </div>
  );
}
