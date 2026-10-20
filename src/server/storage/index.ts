import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Armazenamento de ficheiros. Hoje é local (STORAGE_DIR, fora de public/);
 * para passar a S3-compatível basta outra implementação desta interface.
 */
export interface Armazenamento {
  guardar(chave: string, conteudo: Uint8Array): Promise<void>;
  ler(chave: string): Promise<Uint8Array<ArrayBuffer> | null>;
}

const CHAVE_VALIDA = /^[0-9a-f-]{36}\/[0-9a-f]{32}$/;

/** Chave aleatória, agrupada por escola. Nunca deriva do nome do ficheiro. */
export function novaChave(escolaId: string) {
  return `${escolaId}/${randomBytes(16).toString("hex")}`;
}

class ArmazenamentoLocal implements Armazenamento {
  constructor(private raiz: string) {}

  private caminho(chave: string) {
    if (!CHAVE_VALIDA.test(chave)) throw new Error("Chave de armazenamento inválida.");
    return path.join(this.raiz, ...chave.split("/"));
  }

  async guardar(chave: string, conteudo: Uint8Array) {
    const destino = this.caminho(chave);
    await mkdir(path.dirname(destino), { recursive: true });
    // "wx": nunca sobrescreve um ficheiro existente
    await writeFile(destino, conteudo, { flag: "wx" });
  }

  async ler(chave: string) {
    try {
      return new Uint8Array(await readFile(this.caminho(chave)));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }
}

export const armazenamento: Armazenamento = new ArmazenamentoLocal(
  path.resolve(process.env.STORAGE_DIR || "./storage"),
);
