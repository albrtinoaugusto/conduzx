import { formatMoneyMzn } from "@/lib/format-money";
import { describeAction, formatDateTime, inatroLabel, studentStatusLabel, methodLabel, documentTypeLabel } from "@/lib/labels";

type Entry = {
  id: number;
  entity: string;
  action: string;
  data: unknown;
  createdAt: Date;
  user: string | null;
};

/** Chaves antigas (registos anteriores à renomeação do código) → chaves atuais. */
const LEGACY_KEYS: Record<string, string> = {
  nome: "name",
  categoria: "category",
  tipo: "type",
  codigo: "code",
  valorCentavos: "amountCents",
  metodo: "method",
  precoAnterior: "previousPrice",
  precoNovo: "newPrice",
  de: "from",
  para: "to",
  numeroProcesso: "processNumber",
  motivo: "reason",
  nota: "note",
  campos: "fields",
};

/** Nomes legíveis dos campos do aluno (atuais e antigos). */
const FIELD_LABELS: Record<string, string> = {
  fullName: "nome", nomeCompleto: "nome",
  birthDate: "data de nascimento", dataNascimento: "data de nascimento",
  idNumber: "BI", biNumero: "BI",
  phone: "telefone", telefone: "telefone",
  email: "email",
  address: "morada", endereco: "morada",
};

function normalize(raw: unknown): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  for (const [k, v] of Object.entries((raw ?? {}) as Record<string, unknown>)) d[LEGACY_KEYS[k] ?? k] = v;
  return d;
}

/** Resumo legível dos dados guardados em cada ação (sem dados pessoais). */
function describeDetails(l: Entry): string | null {
  const d = normalize(l.data);
  const parts: string[] = [];
  if (typeof d.name === "string") parts.push(d.name);
  if (typeof d.category === "string") parts.push(`categoria ${d.category}`);
  if (l.entity === "documento" && typeof d.type === "string") parts.push(documentTypeLabel[d.type] ?? d.type);
  if (typeof d.code === "string") parts.push(`código ${d.code}`);
  if (typeof d.amountCents === "number") parts.push(formatMoneyMzn(d.amountCents));
  if (typeof d.method === "string") parts.push(methodLabel[d.method] ?? d.method);
  if (typeof d.newPrice === "number") parts.push(`preço: ${formatMoneyMzn(Number(d.previousPrice ?? 0))} → ${formatMoneyMzn(d.newPrice)}`);
  if (l.action === "alterou_estado_inatro" && typeof d.from === "string" && typeof d.to === "string") {
    parts.push(`${inatroLabel[d.from]} → ${inatroLabel[d.to]}`);
  }
  if (l.action === "alterou_estado_aluno" && typeof d.from === "string" && typeof d.to === "string") {
    parts.push(`${studentStatusLabel[d.from]} → ${studentStatusLabel[d.to]}`);
  }
  if (typeof d.processNumber === "string") parts.push(`processo ${d.processNumber}`);
  if (typeof d.reason === "string") parts.push(`motivo: ${d.reason}`);
  if (typeof d.note === "string") parts.push(`nota: ${d.note}`);
  if (Array.isArray(d.fields)) parts.push(`campos: ${d.fields.map((f) => FIELD_LABELS[String(f)] ?? String(f)).join(", ")}`);
  return parts.length ? parts.join(" · ") : null;
}

export function HistoryList({ rows }: { rows: Entry[] }) {
  return (
    <ol className="relative flex flex-col gap-4 border-l-2 border-night-600 pl-5">
      {rows.map((l) => {
        const detailText = describeDetails(l);
        return (
          <li key={l.id} className="relative">
            <span
              className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-night-800 ${
                l.action === "anulou" ? "bg-danger" : l.entity === "pagamento" ? "bg-success" : "bg-brand"
              }`}
            />
            <p className="text-sm text-ink">
              <span className="font-semibold">{l.user ?? "Sistema"}</span>{" "}
              <span className="text-muted">{describeAction(l.action, l.entity)}</span>
            </p>
            {detailText ? <p className="mt-0.5 text-xs text-muted">{detailText}</p> : null}
            <p className="mt-0.5 text-[11px] text-subtle">{formatDateTime(l.createdAt)}</p>
          </li>
        );
      })}
    </ol>
  );
}
