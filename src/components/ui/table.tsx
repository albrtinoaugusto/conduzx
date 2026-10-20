import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

export function Table({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table
        className={cn("w-full min-w-[640px] border-separate border-spacing-y-1.5 text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...props} />;
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "group [&>td:first-child]:rounded-l-xl [&>td:last-child]:rounded-r-xl",
        className,
      )}
      {...props}
    />
  );
}

export function Th({
  className,
  align = "left",
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-subtle",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  align = "left",
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "bg-night-700/50 px-3 py-3 align-middle text-ink transition-colors group-hover:bg-night-700",
        align === "right" ? "text-right tabular-nums" : "text-left",
        className,
      )}
      {...props}
    />
  );
}
