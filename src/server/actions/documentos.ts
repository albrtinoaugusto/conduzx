"use server";

import { revalidatePath } from "next/cache";
import { exigirContexto } from "@/server/auth/sessao";
import type { EstadoForm } from "@/server/erros";
import { carregarDocumento } from "@/server/services/documentos";
import { documentoSchema, errosZod, formParaObjeto } from "@/server/validation/esquemas";
import { erroParaEstado, invalido, sucesso } from "./util";

export async function carregarDocumentoAction(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const ctx = await exigirContexto("operar");
  const r = documentoSchema.safeParse({ ...formParaObjeto(fd), ficheiro: fd.get("ficheiro") });
  if (!r.success) return invalido(errosZod(r.error));

  const { ficheiro, ...dados } = r.data;
  try {
    await carregarDocumento(ctx, {
      ...dados,
      nomeFicheiro: ficheiro.name,
      conteudo: new Uint8Array(await ficheiro.arrayBuffer()),
    });
  } catch (e) {
    return erroParaEstado(e);
  }
  revalidatePath(`/alunos/${dados.alunoId}`);
  return sucesso("Documento carregado.");
}
