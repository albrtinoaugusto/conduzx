"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { clampOffset, cropRect, displayScale, outputSize, type Offset, type Size } from "@/lib/crop";

/** Moldura 3:4, a proporção da foto tipo passe. */
const FRAME: Size = { width: 240, height: 320 };
const MAX_ZOOM = 4;
/** Largura máxima guardada: 600 × 800 chega para a ficha e para impressão e fica por volta de 100 KB. */
const OUTPUT_WIDTH = 600;
const JPEG_QUALITY = 0.85;

/**
 * Recorte da foto tipo passe: arrastar para posicionar, barra para aproximar.
 * Fica fora do formulário (portal) para os controlos não poderem submeter a foto por recortar.
 */
export function PhotoCropper({
  file,
  onConfirm,
  onCancel,
  onError,
}: {
  file: File;
  onConfirm: (cropped: File) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const drag = useRef<{ pointerX: number; pointerY: number; start: Offset } | null>(null);
  const [url, setUrl] = useState<string>();
  const [natural, setNatural] = useState<Size>();
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  function changeZoom(value: number) {
    setZoom(value);
    if (natural) setOffset((o) => clampOffset(o, natural, FRAME, value));
  }

  function confirm() {
    if (!natural || !img.current) return;
    setSaving(true);
    const crop = cropRect(natural, FRAME, zoom, offset);
    const size = outputSize(crop, OUTPUT_WIDTH);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) {
      onError("Não foi possível recortar a foto. Tente novamente.");
      return;
    }
    // Um PNG transparente ficaria com fundo preto em JPEG
    context.fillStyle = "#fff";
    context.fillRect(0, 0, size.width, size.height);
    context.imageSmoothingQuality = "high";
    context.drawImage(img.current, crop.x, crop.y, crop.width, crop.height, 0, 0, size.width, size.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onError("Não foi possível recortar a foto. Tente novamente.");
          return;
        }
        const stem = file.name.replace(/\.[^.]+$/, "") || "foto";
        onConfirm(new File([blob], `${stem}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  }

  const scale = natural ? displayScale(natural, FRAME, zoom) : 1;

  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby="photo-cropper-title"
      onCancel={onCancel}
      className="m-auto w-[min(92vw,22rem)] rounded-3xl border border-white/10 bg-night-800 p-0 text-ink shadow-shell backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col gap-4 p-5">
        <div>
          <h2 id="photo-cropper-title" className="font-display text-lg font-bold">
            Recortar foto
          </h2>
          <p className="mt-1 text-sm text-muted">Arraste a imagem para enquadrar o rosto.</p>
        </div>

        <div
          className="relative mx-auto cursor-move touch-none select-none overflow-hidden rounded-xl bg-night-900 ring-2 ring-brand"
          style={FRAME}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { pointerX: e.clientX, pointerY: e.clientY, start: offset };
          }}
          onPointerMove={(e) => {
            if (!drag.current || !natural) return;
            const { pointerX, pointerY, start } = drag.current;
            setOffset(clampOffset({ x: start.x + e.clientX - pointerX, y: start.y + e.clientY - pointerY }, natural, FRAME, zoom));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={img}
              src={url}
              alt=""
              draggable={false}
              onLoad={(e) => setNatural({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
              onError={() => onError("Não foi possível abrir a imagem. Use um ficheiro JPG ou PNG.")}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
              style={
                natural
                  ? {
                      width: natural.width * scale,
                      height: natural.height * scale,
                      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                    }
                  : { visibility: "hidden" }
              }
            />
          ) : null}
        </div>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-muted">Aproximar</span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => changeZoom(Number(e.currentTarget.value))}
            className="block w-full accent-brand"
          />
        </label>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={!natural || saving}>
            Guardar foto
          </Button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
