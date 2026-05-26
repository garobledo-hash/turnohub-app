import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}

export function Field({ label, hint, error, children, className }: FieldProps) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-muted-foreground/70">{hint}</span>}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function TextInput({ className, invalid, ...rest }: TextInputProps) {
  return (
    <input
      className={cn(
        "w-full h-11 rounded-xl bg-secondary/60 border border-border px-4 text-sm text-foreground placeholder:text-muted-foreground/70",
        "transition-colors focus:outline-none focus:border-primary/60 focus:bg-secondary/80",
        invalid && "border-destructive/60",
        className,
      )}
      {...rest}
    />
  );
}
