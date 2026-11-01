import { getContext } from "@/server/auth/session";
import { can } from "@/server/domain/permissions";
import { getDocumentFile } from "@/server/services/documents";

export const dynamic = "force-dynamic";

const notFoundResponse = () => new Response("Documento não encontrado.", { status: 404 });

/**
 * Download autenticado. Documentos de outra escola respondem 404 (não revela que existem).
 * `?inline=1` mostra imagens na própria página (pré-visualização da foto).
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const ctx = await getContext();
  if (!ctx) return new Response("Sessão expirada.", { status: 401 });
  if (!can(ctx.role, "operate") || !/^[0-9a-f-]{36}$/i.test(params.id)) return notFoundResponse();

  const doc = await getDocumentFile(ctx, params.id);
  if (!doc) return notFoundResponse();

  const inline = new URL(req.url).searchParams.has("inline") && doc.mimeType.startsWith("image/");
  const ascii = doc.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "");
  return new Response(doc.content, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(doc.content.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
