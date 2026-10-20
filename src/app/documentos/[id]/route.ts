import { obterContexto } from "@/server/auth/sessao";
import { pode } from "@/server/domain/permissoes";
import { obterFicheiroDocumento } from "@/server/services/documentos";

export const dynamic = "force-dynamic";

const naoEncontrado = () => new Response("Documento não encontrado.", { status: 404 });

/** Download autenticado. Documentos de outra escola respondem 404 (não revela que existem). */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const ctx = await obterContexto();
  if (!ctx) return new Response("Sessão expirada.", { status: 401 });
  if (!pode(ctx.papel, "operar") || !/^[0-9a-f-]{36}$/i.test(params.id)) return naoEncontrado();

  const doc = await obterFicheiroDocumento(ctx, params.id);
  if (!doc) return naoEncontrado();

  const ascii = doc.nomeFicheiro.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "");
  return new Response(doc.conteudo, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(doc.conteudo.byteLength),
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(doc.nomeFicheiro)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
