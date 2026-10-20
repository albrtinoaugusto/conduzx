/** Rótulos em português para valores do domínio. Seguro para cliente e servidor. */

export const metodoRotulo: Record<string, string> = {
  dinheiro: "Numerário",
  mpesa: "M-Pesa",
  emola: "e-Mola",
  transferencia: "Transferência",
  outro: "Outro",
};

export const papelRotulo: Record<string, string> = {
  atendente: "Atendente",
  gestor: "Gestor",
  admin: "Administrador",
  super_admin: "Super-Admin",
};

export const inatroRotulo: Record<string, string> = {
  nao_registado: "Não registado",
  pendente: "Pendente",
  registado: "Registado",
};

export const estadoAlunoRotulo: Record<string, string> = {
  ativo: "Ativo",
  desistiu: "Desistiu",
  concluido: "Concluído",
};

export const tipoDocumentoRotulo: Record<string, string> = {
  bi: "BI digitalizado",
  foto: "Fotografia",
  comprovativo: "Comprovativo",
  outro: "Outro",
};

const acoes: Record<string, string> = {
  criou: "criou",
  carregou: "carregou",
  atualizou: "atualizou",
  registou: "registou",
  anulou: "anulou",
};

/** Ações cuja frase já inclui a entidade. */
const acoesCompletas: Record<string, string> = {
  alterou_estado_inatro: "alterou o estado INATRO da inscrição",
  nova_tentativa_inatro: "registou nova tentativa no INATRO",
  alterou_estado_aluno: "alterou a situação do aluno",
};

const entidades: Record<string, string> = {
  aluno: "o aluno",
  inscricao: "a inscrição",
  pagamento: "o pagamento",
  categoria: "a categoria",
  utilizador: "o utilizador",
  documento: "o documento",
};

export function descreverAcao(acao: string, entidade: string) {
  return acoesCompletas[acao] ?? `${acoes[acao] ?? acao} ${entidades[entidade] ?? entidade}`;
}

const tz = "Africa/Maputo";

export function formatarData(d: Date | string | null | undefined) {
  if (!d) return "—";
  const data = typeof d === "string" ? new Date(d.length === 10 ? `${d}T12:00:00` : d) : d;
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: tz }).format(data);
}

export function formatarDataHora(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  }).format(typeof d === "string" ? new Date(d) : d);
}

export function dataExtenso(d = new Date()) {
  const s = new Intl.DateTimeFormat("pt-PT", { weekday: "long", day: "numeric", month: "short", year: "numeric", timeZone: tz }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function iniciais(nome: string) {
  const p = nome.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}
