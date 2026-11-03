"use client";

import { useEffect, useRef, useState } from "react";
import { useFormFeedback } from "@/components/forms/form";
import { buttonClasses } from "@/components/ui";
import { IconCamera, IconFile } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { MAX_FILE_SIZE } from "@/server/domain/documents";
import { PhotoCropper } from "./[id]/photo-cropper";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,image/jpeg,image/png";
const ANY_ACCEPT = `.pdf,application/pdf,${IMAGE_ACCEPT}`;
const SIZE_ERROR = "O ficheiro excede o máximo de 5 MB.";

function usePreview(file?: File) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) return setUrl(undefined);
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

function Picker({
  name,
  title,
  hint,
  accept,
  crop,
  currentUrl,
}: {
  name: string;
  title: string;
  hint: string;
  accept: string;
  crop: boolean;
  /** Documento já guardado (ao editar). */
  currentUrl?: string;
}) {
  const feedback = useFormFeedback();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File>();
  const [toCrop, setToCrop] = useState<File>();
  const [localError, setLocalError] = useState<string>();
  const preview = usePreview(file);
  const error = localError ?? feedback.fields?.[name];
  const shown = preview ?? currentUrl;

  function setInputFile(f?: File) {
    if (!input.current) return;
    const t = new DataTransfer();
    if (f) t.items.add(f);
    input.current.files = t.files;
    setFile(f);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-night-700/50 p-3">
      <span className={cn("flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-night-900 shadow-pressed", file || currentUrl ? "text-brand" : "text-subtle")}>
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt={title} className="h-full w-full object-cover" />
        ) : crop ? (
          <IconCamera size={22} />
        ) : (
          <IconFile size={22} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="truncate text-[11px] text-subtle">{file ? file.name : hint}</p>
        <input
          ref={input}
          type="file"
          name={name}
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          aria-label={title}
          onChange={(ev) => {
            const f = ev.currentTarget.files?.[0];
            setLocalError(undefined);
            if (!f) return setFile(undefined);
            // A foto é recortada (fica pequena); os outros ficheiros vão tal como estão
            if (crop) {
              setToCrop(f);
              setInputFile(undefined);
              return;
            }
            if (f.size > MAX_FILE_SIZE) {
              setInputFile(undefined);
              setLocalError(SIZE_ERROR);
              return;
            }
            setFile(f);
          }}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => input.current?.click()} className={buttonClasses("secondary", "sm")}>
            {file ? "Trocar" : currentUrl ? "Substituir" : "Escolher"}
          </button>
          {file ? (
            <button type="button" onClick={() => setInputFile(undefined)} className={buttonClasses("ghost", "sm")}>
              Remover
            </button>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="mt-1 text-xs font-medium text-danger">
            {error}
          </p>
        ) : null}
      </div>
      {toCrop ? (
        <PhotoCropper
          file={toCrop}
          onCancel={() => setToCrop(undefined)}
          onError={(m) => {
            setToCrop(undefined);
            setLocalError(m);
          }}
          onConfirm={(cropped) => {
            setToCrop(undefined);
            setInputFile(cropped);
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Foto tipo passe e BI escolhidos no próprio formulário (novo aluno, nova inscrição, editar).
 * Só são enviados quando o formulário é guardado.
 */
export function DocumentPickers({ photoUrl, idCardUrl }: { photoUrl?: string; idCardUrl?: string }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Picker name="photoFile" title="Foto tipo passe" hint="JPG ou PNG · recorta antes de guardar" accept={IMAGE_ACCEPT} crop currentUrl={photoUrl} />
      <Picker name="idCardFile" title="BI" hint="PDF, JPG ou PNG · máximo 5 MB" accept={ANY_ACCEPT} crop={false} currentUrl={idCardUrl} />
    </div>
  );
}
