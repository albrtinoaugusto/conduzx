import { formatMoneyMzn } from "@/lib/format-money";
import { descreverAcao, formatarDataHora, inatroRotulo, estadoAlunoRotulo, metodoRotulo, tipoDocumentoRotulo } from "@/lib/rotulos";

type Linha = {
  id: number;
  entidade: string;
  acao: string;
  dados: unknown;
  criadoEm: Date;
  utilizador: string | null;
};

/** Resumo legível dos dados guardados em cada ação (sem dados pessoais). */
function detalhe(l: Linha): string | null {
  const d = (l.dados ?? {}) as Record<string, unknown>;
  const partes: string[] = [];
  if (typeof d.nome === "string") partes.push(d.nome);
  if (typeof d.categoria === "string") partes.push(`categoria ${d.categoria}`);
  if (l.entidade === "documento" && typeof d.tipo === "string") partes.push(tipoDocumentoRotulo[d.tipo] ?? d.tipo);
  if (typeof d.codigo === "string") partes.push(`código ${d.codigo}`);
  if (typeof d.valorCentavos === "number") partes.push(formatMoneyMzn(d.valorCentavos));
  if (typeof d.metodo === "string") partes.push(metodoRotulo[d.metodo] ?? d.metodo);
  if (typeof d.precoNovo === "number") partes.push(`preço: ${formatMoneyMzn(Number(d.precoAnterior ?? 0))} → ${formatMoneyMzn(d.precoNovo)}`);
  if (l.acao === "alterou_estado_inatro" && typeof d.de === "string" && typeof d.para === "string") {
    partes.push(`${inatroRotulo[d.de]} → ${inatroRotulo[d.para]}`);
  }
  if (l.acao === "alterou_estado_aluno" && typeof d.de === "string" && typeof d.para === "string") {
    partes.push(`${estadoAlunoRotulo[d.de]} → ${estadoAlunoRotulo[d.para]}`);
  }
  if (typeof d.numeroProcesso === "string") partes.push(`processo ${d.numeroProcesso}`);
  if (typeof d.motivo === "string") partes.push(`motivo: ${d.motivo}`);
  if (typeof d.nota === "string") partes.push(`nota: ${d.nota}`);
  if (Array.isArray(d.campos)) partes.push(`campos: ${d.campos.join(", ")}`);
  return partes.length ? partes.join(" · ") : null;
}

export function HistoricoLista({ linhas }: { linhas: Linha[] }) {
  return (
    <ol className="relative flex flex-col gap-4 border-l-2 border-night-600 pl-5">
      {linhas.map((l) => {
        const det = detalhe(l);
        return (
          <li key={l.id} className="relative">
            <span
              className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-night-800 ${
                l.acao === "anulou" ? "bg-danger" : l.entidade === "pagamento" ? "bg-success" : "bg-brand"
              }`}
            />
            <p className="text-sm text-ink">
              <span className="font-semibold">{l.utilizador ?? "Sistema"}</span>{" "}
              <span className="text-muted">{descreverAcao(l.acao, l.entidade)}</span>
            </p>
            {det ? <p className="mt-0.5 text-xs text-muted">{det}</p> : null}
            <p className="mt-0.5 text-[11px] text-subtle">{formatarDataHora(l.criadoEm)}</p>
          </li>
        );
      })}
    </ol>
  );
}
