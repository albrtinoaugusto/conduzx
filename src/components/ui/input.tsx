import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { IconChevronDown, IconSearch } from "./icons";

const field =
  "h-11 w-full rounded-xl border border-transparent bg-night-700 px-4 text-sm text-ink shadow-pressed placeholder:text-subtle transition focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/25";

type FieldWrapProps = {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

function FieldWrap({ label, hint, error, children }: FieldWrapProps) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block text-xs font-semibold text-muted">
          {label}
        </span>
      ) : null}
      {children}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-danger">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className, ...props }: InputProps) {
  return (
    <FieldWrap label={label} hint={hint} error={error}>
      <input
        className={cn(field, error && "border-danger/70", className)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </FieldWrap>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Select({
  label,
  hint,
  error,
  className,
  children,
  ...props
}: SelectProps) {
  return (
    <FieldWrap label={label} hint={hint} error={error}>
      <span className="relative block">
        <select
          className={cn(field, "appearance-none pr-10", error && "border-danger/70", className)}
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {children}
        </select>
        <IconChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
        />
      </span>
    </FieldWrap>
  );
}

export function SearchInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span className={cn("relative block", className)}>
      <input
        type="search"
        className={cn(field, "h-10 rounded-full pr-11")}
        {...props}
      />
      <IconSearch
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink"
      />
    </span>
  );
}
