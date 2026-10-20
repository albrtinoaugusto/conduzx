import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "./card";

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  footer?: ReactNode;
  className?: string;
};

/** Cartão de indicador — inspirado nos KPIs do painel de referência. */
export function StatCard({
  label,
  value,
  icon,
  trend,
  footer,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("flex flex-col gap-4 p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-muted">{label}</p>
        {trend ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset",
              trend.positive
                ? "bg-success/15 text-success ring-success/40"
                : "bg-danger/15 text-danger ring-danger/40",
            )}
          >
            {trend.value}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-night-600 text-ink shadow-raised">
          {icon}
        </span>
        <span className="truncate font-display text-xl font-bold text-ink">
          {value}
        </span>
      </div>
      {footer ? (
        <div className="-mx-4 -mb-4 mt-auto rounded-b-2xl bg-brand px-4 py-1.5 text-center text-[11px] font-semibold text-brand-ink">
          {footer}
        </div>
      ) : null}
    </Card>
  );
}
