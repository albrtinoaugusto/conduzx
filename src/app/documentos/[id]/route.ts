import { getContext } from "@/server/auth/session";
import { can } from "@/server/domain/permissions";
import { getDocumentFile } from "@/server/services/documents";

export const dynamic = "force-dynamic";

const notFoundResponse = () => new Response("Documento não encontrado.", { status: 404 });

/** Download autenticado. Documentos de outra escola respondem 404 (não revela que existem). */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const ctx = await getContext();
  if (!ctx) return new Response("Sessão expirada.", { status: 401 });
  if (!can(ctx.role, "operate") || !/^[0-9a-f-]{36}$/i.test(params.id)) return notFoundResponse();

  const doc = await getDocumentFile(ctx, params.id);
  if (!doc) return notFoundResponse();

  const ascii = doc.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "");
  return new Response(doc.content, {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Length": String(doc.content.byteLength),
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
