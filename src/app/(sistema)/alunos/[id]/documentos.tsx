"use client";

import { useState } from "react";
import { FormSelect, useEstadoForm } from "@/components/forms/form";
import { ModalForm } from "@/components/forms/modal";
import { buttonClasses } from "@/components/ui";
import { IconDownload, IconFile, IconPlus } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatarData, tipoDocumentoRotulo } from "@/lib/rotulos";
import { carregarDocumentoAction } from "@/server/actions/documentos";
import { TAMANHO_MAXIMO } from "@/server/domain/documentos";

type Documento = {
  id: string;
  tipo: string;
  nomeFicheiro: string;
  criadoEm: Date;
  categoria: string | null;
  enviadoPor: string | null;
};

type Inscricao = { id: string; categoria: string; dataInscricao: string };

export function ListaDocumentos({ documentos }: { documentos: Documento[] }) {
  if (documentos.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-night-700/50 p-4 text-sm text-muted">
        <IconFile size={20} className="shrink-0 text-subtle" />
        Ainda não há documentos carregados.
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {documentos.map((d) => (
        <li key={d.id} className="flex items-center gap-3 rounded-xl bg-night-700/50 p-3">
          <IconFile size={20} className="shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink" title={d.nomeFicheiro}>
              {tipoDocumentoRotulo[d.tipo] ?? d.tipo}
              <span className="font-normal text-muted"> · {d.nomeFicheiro}</span>
            </p>
            <p className="text-[11px] text-subtle">
              {formatarData(d.criadoEm)}
              {d.enviadoPor ? ` · ${d.enviadoPor}` : ""}
              {d.categoria ? ` · ${d.categoria}` : ""}
            </p>
          </div>
          <a
            href={`/documentos/${d.id}`}
            className={buttonClasses("ghost", "sm", "px-2.5")}
            aria-label={`Descarregar ${d.nomeFicheiro}`}
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
function CampoFicheiro() {
  const e = useEstadoForm();
  const [erroLocal, setErroLocal] = useState<string>();
  const erro = erroLocal ?? e.campos?.ficheiro;
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">Ficheiro *</span>
      <input
        type="file"
        name="ficheiro"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        aria-invalid={erro ? true : undefined}
        onChange={(ev) => {
          const f = ev.currentTarget.files?.[0];
          if (f && f.size > TAMANHO_MAXIMO) {
            ev.currentTarget.value = "";
            setErroLocal("O ficheiro excede o máximo de 5 MB.");
          } else {
            setErroLocal(undefined);
          }
        }}
        className={cn(
          "block w-full rounded-xl border border-transparent bg-night-700 p-2 text-sm text-muted shadow-pressed file:mr-3 file:h-8 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand file:px-4 file:text-xs file:font-semibold file:text-brand-ink",
          erro && "border-danger/70",
        )}
      />
      {erro ? (
        <span className="mt-1.5 block text-xs font-medium text-danger">{erro}</span>
      ) : (
        <span className="mt-1.5 block text-xs text-subtle">PDF, JPG ou PNG · máximo 5 MB</span>
      )}
    </label>
  );
}

export function CarregarDocumento({ alunoId, inscricoes }: { alunoId: string; inscricoes: Inscricao[] }) {
  return (
    <ModalForm
      trigger="Carregar"
      triggerSize="sm"
      triggerIcon={<IconPlus size={14} />}
      title="Carregar documento"
      description="BI digitalizado, fotografia ou comprovativo do aluno."
      action={carregarDocumentoAction}
      submitLabel="Carregar documento"
    >
      <input type="hidden" name="alunoId" value={alunoId} />
      <FormSelect name="tipo" label="Tipo de documento *" defaultValue="">
        <option value="" disabled>
          Escolha o tipo
        </option>
        {Object.entries(tipoDocumentoRotulo).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </FormSelect>
      {inscricoes.length ? (
        <FormSelect name="inscricaoId" label="Inscrição" defaultValue="" hint="Opcional — ex.: comprovativo de uma inscrição">
          <option value="">Nenhuma (documento do aluno)</option>
          {inscricoes.map((i) => (
            <option key={i.id} value={i.id}>
              {i.categoria} · {formatarData(i.dataInscricao)}
            </option>
          ))}
        </FormSelect>
      ) : null}
      <CampoFicheiro />
    </ModalForm>
  );
}
