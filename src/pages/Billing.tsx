import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { isAccessAllowed, trialDaysLeft } from "@/services/profile";
import { startCheckout } from "@/services/billing";
import { Navigate, useNavigate } from "react-router-dom";
import { Check, Loader2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

export default function Billing() {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);

  if (!profile) return <Navigate to="/login" replace />;
  const allowed = isAccessAllowed(profile);
  const expired = !allowed;
  const daysLeft = trialDaysLeft(profile);

  async function onPay(plan: "monthly" | "yearly"): Promise<void> {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const r = await startCheckout(profile.id, plan);
      if (r.url) {
        window.location.href = r.url;
      } else {
        toast.error("No se pudo iniciar el cobro");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar el cobro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-30" />
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <header className="relative px-6 lg:px-10 h-16 flex items-center justify-between">
        <Logo />
        <button onClick={() => signOut().then(() => nav("/login"))} className="text-xs text-muted-foreground hover:text-foreground">Cerrar sesión</button>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 lg:px-10 py-12 animate-fade-in">
        {!allowed ? (
          <div className="text-center max-w-2xl mx-auto">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 grid place-items-center text-destructive">
              <Zap className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
              Tu prueba gratuita terminó
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
              Para seguir gestionando tus turnos y mantener tu link público activo, activá tu plan.
            </p>
          </div>
        ) : (
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 h-7 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" /> Tu prueba sigue activa · {daysLeft} {daysLeft === 1 ? "día" : "días"}
            </div>
            <h1 className="mt-5 text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
              Pasate a un plan y seguí <span className="text-primary">sin límites</span>
            </h1>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mt-10">
          <PlanCard
            name="Mensual"
            price="$5.000"
            period="por mes"
            features={["Turnos ilimitados", "Agenda pública", "Cobros con Mercado Pago", "Recordatorios por WhatsApp"]}
            onClick={() => onPay("monthly")}
            loading={loading}
          />
        </div>

        {expired && (
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Al activar el plan tu acceso se restablece de inmediato.
          </p>
        )}
      </main>
    </div>
  );
}

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  onClick: () => void;
  loading: boolean;
  highlight?: string;
  featured?: boolean;
}

function PlanCard({ name, price, period, features, onClick, loading, highlight, featured }: PlanCardProps) {
  return (
    <div className={`relative card-premium p-6 ${featured ? "border-primary/50 ring-1 ring-primary/30" : ""}`}>
      {highlight && (
        <span className="absolute -top-2.5 left-6 inline-flex items-center px-2.5 h-5 text-[10px] uppercase tracking-wider rounded-full bg-primary text-primary-foreground font-semibold">
          {highlight}
        </span>
      )}
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-semibold">{name}</h3>
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight">{price}</span>
        <span className="text-sm text-muted-foreground">{period}</span>
      </div>
      <ul className="mt-5 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-primary shrink-0" /> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onClick}
        disabled={loading}
        className={`mt-6 w-full h-11 rounded-xl font-medium transition inline-flex items-center justify-center gap-2 disabled:opacity-60 ${
          featured ? "bg-primary text-primary-foreground btn-glow hover:brightness-110" : "bg-secondary text-foreground border border-border hover:border-primary/40"
        }`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activar plan"}
      </button>
    </div>
  );
}
