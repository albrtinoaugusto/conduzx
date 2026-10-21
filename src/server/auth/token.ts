import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token de sessão assinado (HMAC-SHA256) guardado num cookie HTTP-only.
 * Não há tabela de sessões: a validade do utilizador (ativo) é confirmada
 * na base de dados em cada pedido, por isso desativar um utilizador
 * termina o acesso de imediato.
 */
export const SESSION_COOKIE = "conduzx_sessao";
export const SESSION_DURATION_S = 60 * 60 * 12; // 12 horas

type Payload = { uid: string; exp: number };

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

export function readToken(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expected = Buffer.from(sign(data));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as Payload;
    if (typeof payload.uid !== "string" || payload.exp * 1000 < now) return null;
    return payload.uid;
  } catch {
    return null;
  }
}
