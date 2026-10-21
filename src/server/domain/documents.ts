export const DOCUMENT_TYPES = ["bi", "foto", "comprovativo", "outro"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const FORMATS = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;
export type DocumentMime = keyof typeof FORMATS;

/**
 * Identifica o formato pelos primeiros bytes (não confia na extensão nem no
 * tipo enviado pelo browser). Devolve null se não for PDF, JPG ou PNG.
 */
export function detectFormat(b: Uint8Array): DocumentMime | null {
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) {
    return "application/pdf"; // %PDF-
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)
  ) {
    return "image/png";
  }
  return null;
}

/** Nome seguro para guardar e mostrar: sem caminhos nem caracteres de controlo. */
export function sanitizeFileName(name: string, mime: DocumentMime) {
  const base = name.split(/[\\/]/).pop() ?? "";
  const clean = base
    .replace(/[\u0000-\u001f\u007f"<>|:*?]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  const ext = FORMATS[mime];
  if (!clean) return `documento.${ext}`;
  return /\.[a-z0-9]{2,4}$/i.test(clean) ? clean : `${clean}.${ext}`;
}
