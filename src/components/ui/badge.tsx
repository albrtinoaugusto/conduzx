import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-night-600/60 text-muted ring-white/10",
  brand: "bg-brand/15 text-brand ring-brand/40",
  success: "bg-success/15 text-success ring-success/40",
  warning: "bg-warning/15 text-warning ring-warning/40",
  danger: "bg-danger/15 text-danger ring-danger/40",
  info: "bg-info/15 text-info ring-info/40",
};

type BadgeProps = {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}

/* Mapeamentos dos estados do domínio para tons visuais */

export type EstadoFinanceiro = "sem_pagamento" | "parcial" | "pago";
export type EstadoInatro = "nao_registado" | "pendente" | "registado";
export type EstadoAluno = "ativo" | "desistiu" | "concluido";

const financeiro: Record<EstadoFinanceiro, [BadgeTone, string]> = {
  sem_pagamento: ["danger", "Sem pagamento"],
  parcial: ["warning", "Parcial"],
  pago: ["success", "Pago"],
};

const inatro: Record<EstadoInatro, [BadgeTone, string]> = {
  nao_registado: ["neutral", "Não registado"],
  pendente: ["brand", "Pendente"],
  registado: ["info", "Registado"],
};

const aluno: Record<EstadoAluno, [BadgeTone, string]> = {
  ativo: ["success", "Ativo"],
  desistiu: ["danger", "Desistiu"],
  concluido: ["info", "Concluído"],
};

export function FinanceiroBadge({ estado }: { estado: EstadoFinanceiro }) {
  const [tone, label] = financeiro[estado];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

export function InatroBadge({ estado }: { estado: EstadoInatro }) {
  const [tone, label] = inatro[estado];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

export function AlunoBadge({ estado }: { estado: EstadoAluno }) {
  const [tone, label] = aluno[estado];
  return <Badge tone={tone}>{label}</Badge>;
}
