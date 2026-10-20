import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token de sessão assinado (HMAC-SHA256) guardado num cookie HTTP-only.
 * Não há tabela de sessões: a validade do utilizador (ativo) é confirmada
 * na base de dados em cada pedido, por isso desativar um utilizador
 * termina o acesso de imediato.
 */
export const COOKIE_SESSAO = "conduzx_sessao";
export const DURACAO_SESSAO_S = 60 * 60 * 12; // 12 horas

type Payload = { uid: string; exp: number };

function segredo() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET em falta ou demasiado curto (mín. 32 caracteres).");
  }
  return s;
}

function assinar(dados: string) {
  return createHmac("sha256", segredo()).update(dados).digest("base64url");
}

export function criarToken(uid: string, agora = Date.now()): string {
  const payload: Payload = { uid, exp: Math.floor(agora / 1000) + DURACAO_SESSAO_S };
  const dados = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${dados}.${assinar(dados)}`;
}

export function lerToken(token: string | undefined, agora = Date.now()): string | null {
  if (!token) return null;
  const [dados, assinatura] = token.split(".");
  if (!dados || !assinatura) return null;

  const esperada = Buffer.from(assinar(dados));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(dados, "base64url").toString()) as Payload;
    if (typeof payload.uid !== "string" || payload.exp * 1000 < agora) return null;
    return payload.uid;
  } catch {
    return null;
  }
}
