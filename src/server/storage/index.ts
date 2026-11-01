import "server-only";
import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Armazenamento de ficheiros: Cloudflare R2 quando as variáveis R2_* estão
 * definidas; caso contrário, disco local (STORAGE_DIR, fora de public/).
 */
export interface FileStorage {
  save(key: string, content: Uint8Array, contentType: string): Promise<void>;
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

type R2Config = { accountId: string; accessKeyId: string; secretAccessKey: string; bucket: string; endpoint?: string };

class R2FileStorage implements FileStorage {
  private client: S3Client;

  /** `fallback`: ficheiros carregados para o disco antes da mudança para o R2 continuam legíveis. */
  constructor(
    private config: R2Config,
    private fallback: FileStorage,
  ) {
    this.client = new S3Client({
      region: "auto",
      endpoint: config.endpoint || `https://${config.accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      // O R2 não suporta todos os checksums que o SDK envia por omissão
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  async save(key: string, content: Uint8Array, contentType: string) {
    if (!VALID_KEY.test(key)) throw new Error("Chave de armazenamento inválida.");
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: content,
        ContentType: contentType,
        IfNoneMatch: "*", // nunca sobrescreve um ficheiro existente
      }),
    );
  }

  async read(key: string) {
    if (!VALID_KEY.test(key)) throw new Error("Chave de armazenamento inválida.");
    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket: this.config.bucket, Key: key }));
      if (!res.Body) return null;
      return new Uint8Array(await res.Body.transformToByteArray());
    } catch (e) {
      if (e instanceof NoSuchKey) return this.fallback.read(key);
      throw e;
    }
  }
}

function createStorage(): FileStorage {
  const local = new LocalFileStorage(path.resolve(process.env.STORAGE_DIR || "./storage"));
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ENDPOINT } = process.env;
  const values = [R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET];
  if (values.every((v) => !v)) return local;
  // Configuração parcial: falha já, em vez de guardar documentos no disco sem ninguém dar por isso.
  if (values.some((v) => !v)) {
    throw new Error("Configuração do R2 incompleta: defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET.");
  }
  return new R2FileStorage(
    {
      accountId: R2_ACCOUNT_ID!,
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
      bucket: R2_BUCKET!,
      endpoint: R2_ENDPOINT,
    },
    local,
  );
}

export const storage: FileStorage = createStorage();
