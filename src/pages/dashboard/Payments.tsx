import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, CreditCard, Loader2, ShieldCheck, Sparkles, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { listMyPayments, getMySubscription, extractPaymentMethod } from "@/services/payments";
import { isAccessAllowed, trialDaysLeft } from "@/services/profile";
import { startCheckout } from "@/services/billing";
import type { Payment, Subscription } from "@/types/db";

type PlanState = "trial_active" | "trial_expired" | "plan_active" | "plan_expired" | "no_plan";

function getPlanState(profile: ReturnType<typeof useAuth>["profile"]): PlanState {
  if (!profile) return "no_plan";
  if (profile.plan_active) {
    if (!profile.plan_end_at) return "plan_active";
    return new Date(profile.plan_end_at).getTime() > Date.now() ? "plan_active" : "plan_expired";
  }
  if (profile.trial_active && new Date(profile.trial_end_at).getTime() > Date.now()) {
    return "trial_active";
  }
  return "trial_expired";
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatAmount(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export default function PaymentsPage() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [p, s] = await Promise.all([listMyPayments(profile.id), getMySubscription(profile.id)]);
        if (cancelled) return;
        setPayments(p);
        setSubscription(s);
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "No se pudieron cargar los pagos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.id]);

  const state = useMemo(() => getPlanState(profile), [profile]);
  const allowed = isAccessAllowed(profile);
  const daysLeft = trialDaysLeft(profile);

  async function onActivate(plan: "monthly" | "yearly"): Promise<void> {
    if (!profile?.id) return;
    setCheckoutLoading(true);
    try {
      const r = await startCheckout(profile.id, plan);
      if (r.url) window.location.href = r.url;
      else toast.error("No se pudo iniciar el cobro");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo iniciar el cobro");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">Pagos</h1>
        <p className="text-sm text-muted-foreground mt-1">Estado de tu suscripción e historial de pagos.</p>
      </div>

      {/* Plan status */}
      <div className="grid md:grid-cols-2 gap-4">
        <StatusCard state={state} daysLeft={daysLeft} profile={profile} subscription={subscription} />
        <ActionCard
          allowed={allowed}
          state={state}
          loading={checkoutLoading}
          onPay={onActivate}
          onSeePlans={() => nav("/billing")}
        />
      </div>

      {/* History */}
      <div className="card-premium overflow-hidden">
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-medium">Historial de pagos</h2>
          </div>
          <span className="text-xs text-muted-foreground">{payments.length} {payments.length === 1 ? "registro" : "registros"}</span>
        </div>

        {loading ? (
          <div className="px-5 py-16 flex items-center justify-center text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Cargando pagos…
          </div>
        ) : payments.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-muted-foreground">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary grid place-items-center mb-3">
              <CreditCard className="h-5 w-5" />
            </div>
            Todavía no registraste pagos. Cuando actives un plan, vas a verlos acá.
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Fecha</th>
                    <th className="px-5 py-3 font-medium">Plan</th>
                    <th className="px-5 py-3 font-medium">Monto</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3 font-medium">Método</th>
                    <th className="px-5 py-3 font-medium">IDs</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t border-border/60 hover:bg-accent/30">
                      <td className="px-5 py-3 whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-5 py-3 capitalize">{p.plan ?? "—"}</td>
                      <td className="px-5 py-3 tabular-nums">{formatAmount(p.amount)}</td>
                      <td className="px-5 py-3"><PayBadge status={p.status} /></td>
                      <td className="px-5 py-3 text-muted-foreground">{extractPaymentMethod(p.raw) ?? "—"}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          <span title="Mercado Pago payment ID">MP: <span className="font-mono">{p.mp_payment_id ?? "—"}</span></span>
                          <span title="Preference ID">Pref: <span className="font-mono">{p.mp_preference_id ?? "—"}</span></span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-border/60">
              {payments.map((p) => (
                <div key={p.id} className="px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{p.plan ?? "Pago"}</span>
                    <PayBadge status={p.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatDate(p.created_at)}</span>
                    <span className="tabular-nums font-medium">{formatAmount(p.amount)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {extractPaymentMethod(p.raw) && <div>Método: {extractPaymentMethod(p.raw)}</div>}
                    <div className="font-mono truncate">MP: {p.mp_payment_id ?? "—"}</div>
                    <div className="font-mono truncate">Pref: {p.mp_preference_id ?? "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusCard({ state, daysLeft, profile, subscription }: {
  state: PlanState;
  daysLeft: number;
  profile: ReturnType<typeof useAuth>["profile"];
  subscription: Subscription | null;
}) {
  const map: Record<PlanState, { label: string; tone: string; icon: typeof Sparkles; description: string }> = {
    trial_active: {
      label: "Prueba activa",
      tone: "bg-primary/10 text-primary border-primary/30",
      icon: Sparkles,
      description: `Te quedan ${daysLeft} ${daysLeft === 1 ? "día" : "días"} de prueba gratuita.`,
    },
    trial_expired: {
      label: "Prueba vencida",
      tone: "bg-destructive/10 text-destructive border-destructive/30",
      icon: Zap,
      description: "Tu prueba gratuita terminó. Activá un plan para continuar.",
    },
    plan_active: {
      label: "Plan activo",
      tone: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      icon: ShieldCheck,
      description: profile?.plan_end_at ? `Renueva el ${formatDate(profile.plan_end_at)}.` : "Plan activo sin fecha de vencimiento.",
    },
    plan_expired: {
      label: "Plan vencido",
      tone: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      icon: Clock,
      description: "Tu plan venció. Renová para seguir operando.",
    },
    no_plan: {
      label: "Sin plan",
      tone: "bg-secondary text-muted-foreground border-border",
      icon: CreditCard,
      description: "Aún no tenés un plan activo.",
    },
  };
  const cfg = map[state];
  const Icon = cfg.icon;

  return (
    <div className="card-premium p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 h-6 text-[11px] font-medium ${cfg.tone}`}>
            <Icon className="h-3 w-3" /> {cfg.label}
          </span>
          <h3 className="mt-3 text-lg font-semibold">Estado de la suscripción</h3>
          <p className="text-sm text-muted-foreground mt-1">{cfg.description}</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Field label="Trial vence" value={profile?.trial_end_at ? formatDate(profile.trial_end_at) : "—"} />
        <Field label="Plan vence" value={profile?.plan_end_at ? formatDate(profile.plan_end_at) : "—"} />
        <Field label="Suscripción" value={subscription?.status ?? "—"} />
        <Field label="Período actual" value={subscription?.current_period_end ? formatDate(subscription.current_period_end) : "—"} />
      </dl>
    </div>
  );
}

function ActionCard({ allowed, state, loading, onPay, onSeePlans }: {
  allowed: boolean;
  state: PlanState;
  loading: boolean;
  onPay: (plan: "monthly" | "yearly") => void;
  onSeePlans: () => void;
}) {
  const planActive = state === "plan_active";
  return (
    <div className="card-premium p-5 flex flex-col">
      <h3 className="text-lg font-semibold">{planActive ? "Tu plan está activo" : "Activar plan"}</h3>
      <p className="text-sm text-muted-foreground mt-1">
        {planActive
          ? "Gracias por confiar en TurnoHub. Podés gestionar o renovar tu plan cuando quieras."
          : allowed
            ? "Pasate a un plan pago y desbloqueá el sistema completo sin límites."
            : "Tu acceso está bloqueado. Activá un plan para seguir usando TurnoHub."}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          onClick={() => onPay("monthly")}
          disabled={loading}
          className="h-11 rounded-xl border border-border bg-secondary text-sm font-medium hover:border-primary/40 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mensual"}
        </button>
        <button
          onClick={() => onPay("yearly")}
          disabled={loading}
          className="h-11 rounded-xl bg-primary text-primary-foreground btn-glow text-sm font-medium hover:brightness-110 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Anual"}
        </button>
      </div>

      <button
        onClick={onSeePlans}
        className="mt-3 text-xs text-muted-foreground hover:text-foreground transition self-start"
      >
        Ver detalles de planes →
      </button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/40 border border-border/60 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm truncate">{value}</div>
    </div>
  );
}

function PayBadge({ status }: { status: string | null }) {
  const s = (status ?? "").toLowerCase();
  let tone = "bg-secondary text-muted-foreground border-border";
  let Icon = Clock;
  let label = status ?? "—";
  if (s === "approved" || s === "paid") {
    tone = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    Icon = CheckCircle2;
    label = "Aprobado";
  } else if (s === "pending" || s === "in_process" || s === "authorized") {
    tone = "bg-amber-500/10 text-amber-400 border-amber-500/30";
    Icon = Clock;
    label = "Pendiente";
  } else if (s === "rejected" || s === "cancelled" || s === "refunded") {
    tone = "bg-destructive/10 text-destructive border-destructive/30";
    Icon = XCircle;
    label = s === "refunded" ? "Reembolsado" : s === "cancelled" ? "Cancelado" : "Rechazado";
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 h-6 text-[11px] font-medium ${tone}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}
