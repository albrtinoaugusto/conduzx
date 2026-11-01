"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/labels";

/** Foto tipo passe do aluno; sem foto, mostra as iniciais. */
export function StudentPhoto({ name, className }: { name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  // A imagem pode falhar antes de a página ficar interativa, sem o onError chegar a correr
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden bg-brand font-display font-bold text-brand-ink", className)}>
      {failed ? (
        initials(name)
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={img} src="/portal/foto" alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      )}
    </span>
  );
}
