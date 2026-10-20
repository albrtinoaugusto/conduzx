import { cn } from "@/lib/cn";
import { IconSteering } from "@/components/ui/icons";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-ink shadow-glow">
        <IconSteering size={20} strokeWidth={2.4} />
      </span>
      {compact ? null : (
        <span className="font-display text-lg font-extrabold leading-none tracking-tight text-ink">
          Conduz<span className="text-brand">X</span>
        </span>
      )}
    </span>
  );
}
