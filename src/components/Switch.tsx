import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  tone?: "primary" | "danger";
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, tone = "primary", disabled }: SwitchProps) {
  const onColor = tone === "danger" ? "bg-destructive" : "bg-primary";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2 select-none disabled:opacity-50",
      )}
    >
      <span
        className={cn(
          "relative h-6 w-12 rounded-full border transition-colors overflow-hidden",
          checked ? `${onColor} border-transparent` : "bg-secondary border-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform",
            checked ? "translate-x-[2px]" : "translate-x-[24px]",
          )}
        />
      </span>
      {label && <span className="text-sm text-foreground">{label}</span>}
    </button>
  );
}
