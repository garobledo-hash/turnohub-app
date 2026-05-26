import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  createAppointment,
  deleteAppointment,
  listAppointmentsRange,
  updateAppointmentStatus,
} from "@/services/appointments";
import { listHours } from "@/services/businessHours";
import { listServices } from "@/services/services";
import type { Appointment, Service } from "@/types/db";
import {
  addDays,
  addMinutes,
  formatTime,
  sameDay,
  startOfDay,
  WEEKDAYS_SHORT_ES,
} from "@/lib/utils";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

type Filter = "all" | "active";

export default function AgendaPage() {
  const { profile } = useAuth();

  const [appts, setAppts] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [businessHours, setBusinessHours] = useState<any[]>([]);
  const [selected, setSelected] = useState<Date>(startOfDay(new Date()));
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - d.getDay());
    return d;
  });

  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState<boolean>(true);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualTime, setManualTime] = useState("09:00");
  const [manualDate, setManualDate] = useState(
  new Date().toISOString().split("T")[0]
);
  const [manualServiceId, setManualServiceId] = useState("");

  useDocumentMeta({ title: "Agenda · TurnoHub" });

  function getStart(a: any): string {
    return a.starts_at ?? a.start_at;
  }

  function getEnd(a: any): string {
    return a.end_at ?? a.end_at;
  }

  async function refresh(): Promise<void> {
    if (!profile?.id) return;

    setLoading(true);

    try {
      const from = startOfDay(weekStart).toISOString();
      const to = addDays(weekStart, 14).toISOString();
      const businessId = profile.id;

      const [a, s, bh] = await Promise.all([
  listAppointmentsRange(businessId, from, to),
  listServices(businessId),
  listHours(businessId),
]);

     if (a) setAppts(a);
if (s) setServices(s);
setBusinessHours(bh);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron cargar los turnos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  if (!profile?.id) return;

  void refresh();
}, [profile?.id, weekStart]);

  const week = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const dayAppts = useMemo(() => {
    return appts
      .filter((a) => sameDay(new Date(getStart(a)), selected))
      .filter((a) =>
        filter === "all"
          ? true
          : a.status === "pending" || a.status === "confirmed"
      )
      .sort(
        (a, b) =>
          new Date(getStart(a)).getTime() - new Date(getStart(b)).getTime()
      );
  }, [appts, selected, filter]);

  function countForDay(d: Date): number {
    return appts.filter(
      (a) => sameDay(new Date(getStart(a)), d) && a.status !== "cancelled"
    ).length;
  }

  async function onComplete(a: Appointment): Promise<void> {
    await updateAppointmentStatus(a.id, "completed");
    toast.success("Turno completado");
    await refresh();
  }

  async function onCancel(a: Appointment): Promise<void> {
    if (!confirm("¿Cancelar este turno?")) return;
    await updateAppointmentStatus(a.id, "cancelled");
    toast.success("Turno cancelado");
    await refresh();
  }

  async function onDelete(a: Appointment): Promise<void> {
    if (!confirm(`¿Eliminar el turno de ${a.client_name}?`)) return;
    await deleteAppointment(a.id);
    toast.success("Turno eliminado");
    await refresh();
  }

  async function createManualAppointment(): Promise<void> {
    if (!profile?.id) return;

    if (!manualName.trim()) {
      toast.error("Ingresá el nombre del cliente");
      return;
    }

    const selectedService = services.find((s) => s.id === manualServiceId);
    const duration = selectedService?.duration_minutes ?? 30;

    const [h, m] = manualTime.split(":").map(Number);

    const [year, month, dayNumber] = manualDate
      .split("-")
      .map(Number);

    const start = new Date( 
       year,
       month - 1,
       dayNumber
      );
    start.setHours(h, m, 0, 0);

    const end = addMinutes(start, duration);

    const day = start.getDay();

    const config = businessHours.find(
      (h) =>
        h.day_of_week === day &&
        !h.is_closed
);

console.log("BUSINESS HOURS", businessHours);
console.log("CONFIG", config);

if (!config) {
  toast.error(
    "El negocio está cerrado ese día"
  );
  return;
}

const startMinutes =
  start.getHours() * 60 +
  start.getMinutes();

const endMinutes =
  end.getHours() * 60 +
  end.getMinutes();

const [openHour, openMinute] =
  config.start_time
    .split(":")
    .map(Number);

const [closeHour, closeMinute] =
  config.end_time
    .split(":")
    .map(Number);

const openMinutes =
  openHour * 60 + openMinute;

const closeMinutes =
  closeHour * 60 + closeMinute;

if (
  startMinutes < openMinutes ||
  endMinutes > closeMinutes
) {
  toast.error(
    "Horario fuera del horario laboral"
  );
  return;
}

    try {
      await createAppointment({
        business_id: profile.id,
        service_id: selectedService?.id ?? null,
        service_name: selectedService?.name ?? "Turno manual",
        client_name: manualName.trim(),
        client_phone: manualPhone.trim() || null,
        customer_email: null,
        starts_at: start.toISOString(),
        end_at: end.toISOString(),
        duration_minutes: duration,
        status: "scheduled",
        notes: "Creado manualmente",
      } as any);

      toast.success("Turno creado");

      setManualOpen(false);
      setManualName("");
      setManualPhone("");
      setManualServiceId("");
      setManualTime("09:00");
      setManualDate(
      new Date().toISOString().split("T")[0]
    );

      await refresh();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo crear el turno");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Gestioná tus turnos en un click.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn-primary h-10 px-4 rounded-xl"
            onClick={() => setManualOpen(true)}
          >
            + Nuevo turno
          </button>

          <div className="inline-flex items-center rounded-xl bg-card border border-border p-1">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 h-8 rounded-lg text-xs ${
                filter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Eye className="h-3 w-3 inline mr-1" />
              Todos
            </button>

            <button
              onClick={() => setFilter("active")}
              className={`px-3 h-8 rounded-lg text-xs ${
                filter === "active"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <EyeOff className="h-3 w-3 inline mr-1" />
              Solo activos
            </button>
          </div>
        </div>
      </header>

      <div className="card-premium p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="h-9 w-9 rounded-lg hover:bg-accent grid place-items-center"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="text-sm font-medium">
            {weekStart.toLocaleDateString("es-AR", {
              month: "long",
              year: "numeric",
            })}
          </div>

          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="h-9 w-9 rounded-lg hover:bg-accent grid place-items-center"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {week.map((d) => {
            const isSelected = sameDay(d, selected);
            const isToday = sameDay(d, new Date());
            const count = countForDay(d);

            return (
              <button
                key={d.toISOString()}
                onClick={() => setSelected(d)}
                className={`relative rounded-xl p-3 text-center transition border ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/40 border-border/60 hover:border-primary/40"
                }`}
              >
                <div
                  className={`text-[10px] uppercase tracking-wider ${
                    isSelected ? "opacity-80" : "text-muted-foreground"
                  }`}
                >
                  {WEEKDAYS_SHORT_ES[d.getDay()]}
                </div>

                <div className="text-lg font-semibold mt-0.5">
                  {d.getDate()}
                </div>

                {count > 0 && (
                  <div
                    className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-primary-foreground/70" : "bg-primary"
                    }`}
                  />
                )}

                {isToday && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card-premium p-5">
        <h2 className="text-lg font-semibold mb-3">
          {selected.toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h2>

        {loading ? (
          <ul className="space-y-2">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-16 rounded-xl bg-secondary/40 animate-shimmer" />
            ))}
          </ul>
        ) : dayAppts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary grid place-items-center text-muted-foreground">
              <Clock className="h-5 w-5" />
            </div>
            <div className="mt-3 text-sm font-medium">Sin turnos este día</div>
            <div className="text-xs text-muted-foreground">
              Cuando un cliente reserve, verás su turno acá.
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {dayAppts.map((a) => {
              const svc = services.find((s) => s.id === a.service_id);
              const start = new Date(getStart(a));
              const end = new Date(getEnd(a));

              return (
                <li
                  key={a.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    a.status === "cancelled"
                      ? "opacity-50 border-border"
                      : a.status === "completed"
                      ? "border-success/40 bg-success/5"
                      : "border-border/60 bg-card/40"
                  }`}
                >
                  <div className="w-20 shrink-0 text-center">
                    <div className="text-base font-semibold tabular-nums">
                      {formatTime(start)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatTime(end)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {a.client_name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {svc?.name ?? (a as any).service_name ?? "Servicio"}
                      {a.client_phone ? ` · ${a.client_phone}` : ""}
                    </div>
                  </div>

                  <StatusPill status={a.status} />

                  {a.status !== "completed" && a.status !== "cancelled" && (
                    <>
                      <button
                        onClick={() => onComplete(a)}
                        title="Completar"
                        className="h-9 w-9 grid place-items-center rounded-lg hover:bg-success/15 text-success"
                      >
                        <Check className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onCancel(a)}
                        title="Cancelar"
                        className="h-9 w-9 grid place-items-center rounded-lg hover:bg-destructive/15 text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => onDelete(a)}
                    title="Eliminar"
                    className="h-9 w-9 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {manualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0B0F] p-6">
            <h2 className="text-xl font-semibold text-white">
              Nuevo turno manual
            </h2>

            <div className="mt-5 space-y-3">
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full h-11 rounded-xl bg-secondary/60 border border-border px-4 text-sm"
              />

              <input
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                placeholder="Teléfono"
                className="w-full h-11 rounded-xl bg-secondary/60 border border-border px-4 text-sm"
              />

              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full h-11 rounded-xl bg-secondary/60 border border-border px-4 text-sm"
              />

              <input
                type="time"
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                className="w-full h-11 rounded-xl bg-secondary/60 border border-border px-4 text-sm"
              />

              <select
                value={manualServiceId}
                onChange={(e) => setManualServiceId(e.target.value)}
                className="w-full h-11 rounded-xl bg-secondary/60 border border-border px-4 text-sm"
              >
                <option value="">Turno manual sin servicio</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.duration_minutes} min
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setManualOpen(false)}
                className="h-11 flex-1 rounded-xl border border-white/10 text-white"
              >
                Cancelar
              </button>

              <button
                onClick={createManualAppointment}
                className="btn-primary h-11 flex-1 rounded-xl"
              >
                Crear turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Appointment["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pendiente", cls: "bg-warning/15 text-warning" },
    confirmed: { label: "Confirmado", cls: "bg-primary/15 text-primary" },
    scheduled: { label: "Agendado", cls: "bg-primary/15 text-primary" },
    completed: { label: "Completo", cls: "bg-success/15 text-success" },
    cancelled: { label: "Cancelado", cls: "bg-destructive/15 text-destructive" },
  };

  const item = map[status] ?? {
    label: status,
    cls: "bg-secondary text-muted-foreground",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] ${item.cls}`}>
      {item.label}
    </span>
  );
}