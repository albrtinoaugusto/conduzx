import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token de sessão assinado (HMAC-SHA256) guardado num cookie HTTP-only.
 * Não há tabela de sessões: a validade do utilizador (ativo) é confirmada
 * na base de dados em cada pedido, por isso desativar um utilizador
 * termina o acesso de imediato.
 */
export const SESSION_COOKIE = "conduzx_sessao";
export const SESSION_DURATION_S = 60 * 60 * 12; // 12 horas

/** Sessão do portal do aluno: cookie e campo próprios, nunca aceite como sessão de funcionário. */
export const STUDENT_COOKIE = "conduzx_aluno";
export const STUDENT_SESSION_DURATION_S = 60 * 60 * 24 * 7; // 7 dias

type Payload = { uid: string; exp: number };
type StudentPayload = { sid: string; exp: number };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET em falta ou demasiado curto (mín. 32 caracteres).");
  }
  return s;
}

function sign(data: string) {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createToken(uid: string, now = Date.now()): string {
  const payload: Payload = { uid, exp: Math.floor(now / 1000) + SESSION_DURATION_S };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

function verifiedPayload(token: string | undefined): unknown {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expected = Buffer.from(sign(data));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(data, "base64url").toString());
  } catch {
    return null;
  }
}

export function readToken(token: string | undefined, now = Date.now()): string | null {
  const payload = verifiedPayload(token) as Payload | null;
  if (!payload || typeof payload.uid !== "string" || payload.exp * 1000 < now) return null;
  return payload.uid;
}

export function createStudentToken(sid: string, now = Date.now()): string {
  const payload: StudentPayload = { sid, exp: Math.floor(now / 1000) + STUDENT_SESSION_DURATION_S };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function readStudentToken(token: string | undefined, now = Date.now()): string | null {
  const payload = verifiedPayload(token) as StudentPayload | null;
  if (!payload || typeof payload.sid !== "string" || payload.exp * 1000 < now) return null;
  return payload.sid;
}
