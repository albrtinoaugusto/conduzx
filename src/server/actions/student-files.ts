import "server-only";
import type { Ctx } from "@/server/auth/session";
import { MAX_FILE_SIZE, detectFormat } from "@/server/domain/documents";
import { uploadDocument } from "@/server/services/documents";

/** Campos de ficheiro opcionais nos formulários de aluno e de nova inscrição. */
const FILE_FIELDS = [
  { field: "photoFile", type: "foto" as const },
  { field: "idCardFile", type: "bi" as const },
];

export type StudentFile = { type: "foto" | "bi"; fileName: string; content: Uint8Array };

/**
 * Lê e valida a foto tipo passe e o BI enviados junto com o formulário,
 * ANTES de gravar o aluno: um ficheiro inválido não deixa registos a meio.
 */
export async function readStudentFiles(fd: FormData): Promise<{ files: StudentFile[]; fields: Record<string, string> }> {
  const files: StudentFile[] = [];
  const fields: Record<string, string> = {};
  for (const { field, type } of FILE_FIELDS) {
    const f = fd.get(field);
    if (!(f instanceof File) || f.size === 0) continue;
    if (f.size > MAX_FILE_SIZE) {
      fields[field] = "O ficheiro excede o máximo de 5 MB.";
      continue;
    }
    const content = new Uint8Array(await f.arrayBuffer());
    const mime = detectFormat(content);
    if (!mime || (type === "foto" && mime === "application/pdf")) {
      fields[field] = type === "foto" ? "A foto deve ser uma imagem JPG ou PNG." : "O BI deve ser PDF, JPG ou PNG.";
      continue;
    }
    files.push({ type, fileName: f.name, content });
  }
  return { files, fields };
}

/** Guarda os ficheiros já validados. Devolve false se algum falhar (o aluno já ficou gravado). */
export async function saveStudentFiles(ctx: Ctx, studentId: string, files: StudentFile[], enrollmentId: string | null = null) {
  let ok = true;
  for (const f of files) {
    try {
      await uploadDocument(ctx, { studentId, enrollmentId, type: f.type, fileName: f.fileName, content: f.content });
    } catch (e) {
      console.error("[documentos]", e instanceof Error ? e.message : e);
      ok = false;
    }
  }
  return ok;
}
