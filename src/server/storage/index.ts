import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Armazenamento de ficheiros. Hoje é local (STORAGE_DIR, fora de public/);
 * para passar a S3-compatível basta outra implementação desta interface.
 */
export interface FileStorage {
  save(key: string, content: Uint8Array): Promise<void>;
  read(key: string): Promise<Uint8Array<ArrayBuffer> | null>;
}

const VALID_KEY = /^[0-9a-f-]{36}\/[0-9a-f]{32}$/;

/** Chave aleatória, agrupada por escola. Nunca deriva do nome do ficheiro. */
export function newStorageKey(schoolId: string) {
  return `${schoolId}/${randomBytes(16).toString("hex")}`;
}

class LocalFileStorage implements FileStorage {
  constructor(private root: string) {}

  private resolvePath(key: string) {
    if (!VALID_KEY.test(key)) throw new Error("Chave de armazenamento inválida.");
    return path.join(this.root, ...key.split("/"));
  }

  async save(key: string, content: Uint8Array) {
    const dest = this.resolvePath(key);
    await mkdir(path.dirname(dest), { recursive: true });
    // "wx": nunca sobrescreve um ficheiro existente
    await writeFile(dest, content, { flag: "wx" });
  }

  async read(key: string) {
    try {
      return new Uint8Array(await readFile(this.resolvePath(key)));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }
}

export const storage: FileStorage = new LocalFileStorage(
  path.resolve(process.env.STORAGE_DIR || "./storage"),
);
