import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { listAppointmentsRange } from "@/services/appointments";
import { listServices } from "@/services/services";
import type { Appointment, Service } from "@/types/db";
import { addDays, formatDateLong, formatPrice, formatTime, startOfDay } from "@/lib/utils";
import { ArrowRight, Calendar, CheckCircle2, Clock, Scissors, TrendingUp, Users } from "lucide-react";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export default function DashboardHome() {
  const { profile } = useAuth();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useDocumentMeta({ title: profile?.business_name ? `${profile.business_name} · TurnoHub` : "Dashboard · TurnoHub" });

  useEffect(() => {
    if (!profile?.id) return;
    const from = startOfDay(new Date()).toISOString();
    const to = addDays(startOfDay(new Date()), 30).toISOString();
    listAppointmentsRange(profile.id, from, to).then(setAppts).catch(() => undefined);
    listServices(profile.id).then(setServices).catch(() => undefined);
  }, [profile?.id]);

  const todayAppts = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    const tomorrow = today + 86_400_000;
    return appts.filter((a) => {
      const t = new Date(a.starts_at).getTime();
      return t >= today && t < tomorrow && a.status !== "cancelled";
    });
  }, [appts]);

  const upcoming = useMemo(
    () => appts.filter((a) => new Date(a.starts_at).getTime() > Date.now() && a.status !== "cancelled").slice(0, 6),
    [appts],
  );

  const revenue = useMemo(() => {
    const map = new Map(services.map((s) => [s.id, s.price]));
    return appts
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + (a.service_id ? Number(map.get(a.service_id) ?? 0) : 0), 0);
  }, [appts, services]);

  const uniqueClients = useMemo(() => new Set(appts.map((a) => a.client_phone || a.client_email || a.client_name)).size, [appts]);

  const stats = [
    { icon: Calendar, label: "Hoy", value: String(todayAppts.length), hint: "turnos" },
    { icon: TrendingUp, label: "Próximos 30 días", value: String(upcoming.length), hint: "agendados" },
    { icon: Users, label: "Clientes", value: String(uniqueClients), hint: "únicos" },
    { icon: Scissors, label: "Ingresos", value: formatPrice(revenue), hint: "completados" },
  ] as const;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{formatDateLong(new Date())}</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">
            Hola, <span className="text-primary">{profile?.full_name?.split(" ")[0] || "👋"}</span>
          </h1>
        </div>
        <Link to="/dashboard/agenda" className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-medium btn-glow hover:brightness-110 transition">
          Ver agenda <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card-premium p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-2xl lg:text-3xl font-semibold tracking-tight">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        {/* Próximos turnos */}
        <div className="lg:col-span-2 card-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Próximos turnos</h2>
            <Link to="/dashboard/agenda" className="text-xs text-primary hover:underline">Ver todos</Link>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Sin turnos próximos"
              hint="Cuando un cliente reserve aparecerá acá."
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {upcoming.map((a) => {
                const svc = services.find((s) => s.id === a.service_id);
                const date = new Date(a.starts_at);
                return (
                  <li key={a.id} className="py-3 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center text-primary">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{a.client_name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {svc?.name ?? "Servicio"} · {formatDateLong(date)} · {formatTime(date)}
                      </div>
                    </div>
                    {a.status === "confirmed" && <CheckCircle2 className="h-4 w-4 text-success" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="card-premium p-5 space-y-3">
          <h2 className="text-lg font-semibold">Accesos rápidos</h2>
          <QuickAction to="/dashboard/servicios" icon={Scissors} title="Agregar servicio" hint="Define duración y precio" />
          <QuickAction to="/dashboard/configuracion" icon={Clock} title="Editar horarios" hint="Múltiples turnos / días cerrados" />
          {profile?.slug && (
            <a
              href={`${window.location.origin}/r/${profile.slug}`}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-primary/30 bg-primary/5 p-4 hover:border-primary/60 transition-colors"
            >
              <div className="text-xs uppercase tracking-wider text-primary">Tu link público</div>
              <div className="text-sm mt-1 truncate">/r/{profile.slug}</div>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, hint }: { to: string; icon: typeof Calendar; title: string; hint: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card/40 hover:border-primary/40 transition-colors">
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center"><Icon className="h-4 w-4" /></div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function EmptyState({ icon: Icon, title, hint }: { icon: typeof Calendar; title: string; hint: string }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary grid place-items-center text-muted-foreground"><Icon className="h-5 w-5" /></div>
      <div className="mt-3 text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
