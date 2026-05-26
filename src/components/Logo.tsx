import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  withText?: boolean;
}

export function Logo({ className, withText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/60 grid place-items-center btn-glow">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="13" r="7" />
          <path d="M12 9v4l2.5 2" />
          <path d="M9 2h6" />
        </svg>
      </div>
      {withText && (
        <div className="flex items-baseline gap-0.5">
          <span className="font-semibold tracking-tight text-foreground">Turno</span>
          <span className="font-semibold tracking-tight text-primary">Hub</span>
        </div>
      )}
    </div>
  );
}
