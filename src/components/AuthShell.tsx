import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Left — form */}
      <div className="flex flex-col px-6 py-8 lg:px-12 lg:py-10">
        <Link to="/" className="inline-flex"><Logo /></Link>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-sm mx-auto animate-fade-in">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>

        {footer && <div className="text-xs text-muted-foreground text-center">{footer}</div>}
      </div>

      {/* Right — brand panel */}
      <div className="relative hidden lg:block overflow-hidden border-l border-border/60">
        <div className="absolute inset-0 grid-dots opacity-40" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="relative h-full flex flex-col justify-between p-10">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Nuevo · Prueba gratuita 7 días
          </div>

          <div className="space-y-6">
            <h2 className="font-serif text-5xl leading-[1.05] text-foreground text-balance">
              Tu agenda<br />
              <span className="italic text-primary">trabajando</span> para vos,<br />
              incluso mientras dormís.
            </h2>
            <p className="text-muted-foreground max-w-md">
              TurnoHub centraliza tus reservas, evita huecos y choques, y deja que tus clientes reserven en segundos desde un link.
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-md">
              {[
                { k: "−42%", v: "no-shows" },
                { k: "24/7", v: "reservas online" },
                { k: "0", v: "comisiones" },
              ].map((s) => (
                <div key={s.v} className="card-premium p-4">
                  <div className="text-2xl font-semibold text-foreground">{s.k}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
