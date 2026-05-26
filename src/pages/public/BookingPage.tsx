import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { getProfileBySlug, isAccessAllowed } from "@/services/profile";
import { listPublicServices } from "@/services/services";
import { listHours } from "@/services/businessHours";
import { computeAvailableSlots, createAppointment, listPublicDayAppointments } from "@/services/appointments";
import type { BusinessHour, Profile, Service } from "@/types/db";
import { addDays, addMinutes, formatDuration, formatPrice, formatTime, sameDay, startOfDay, WEEKDAYS_SHORT_ES } from "@/lib/utils";
import { ArrowLeft, Calendar as CalendarIcon, CalendarX, Check, CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, Phone, Scissors, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { BookingSkeleton } from "@/components/Skeletons";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

type Step = "service" | "datetime" | "details" | "done";

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [busy, setBusy] = useState<{ starts_at: string; end_at: string }[]>([]);
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState<Date>(startOfDay(new Date()));
  const [slot, setSlot] = useState<Date | null>(null);
  const [weekStart, setWeekStart] = useState<Date>(() => {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - d.getDay());
  return d;
});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [clientName, setClientName] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!slug) return;
      try {
        const p = await getProfileBySlug(slug);
        if (!active) return;
        setProfile(p);
        if (p) {
          const [s, h] = await Promise.all([listPublicServices(p.id), listHours(p.id)]);
          if (!active) return;
          setServices(s);
          setHours(h);
        }
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!profile?.id) return;
    let active = true;
    const from = startOfDay(date).toISOString();
    const to = addDays(startOfDay(date), 1).toISOString();
    listPublicDayAppointments(profile.id, from, to)
      .then((b) => { if (active) setBusy(b); })
      .catch(() => undefined)
    return () => { active = false; };
  }, [profile?.id, date]);

  const days = useMemo(
  () =>
    Array.from(
      { length: 30 },
      (_, i) =>
        addDays(
          startOfDay(new Date()),
          i
        )
    ),
  []
);

const week = useMemo(
  () =>
    days.filter(
      (d) =>
        d >= weekStart &&
        d < addDays(weekStart, 14)
    ),
  [days, weekStart]
);
  const slots = useMemo(() => {
  if (!service) return [];

  return computeAvailableSlots({
    date,
    durationMinutes:
      service.duration_minutes,
    hours: hours ?? [],
    busy: busy ?? [],
  });
}, [
  date,
  service,
  hours,
  busy,
]);
  const brand = profile?.brand_color ?? "#C7F250";

  useDocumentMeta({
    title: profile ? `Reservar turno · ${profile.business_name}` : "Reservar turno · TurnoHub",
    description: profile ? `Reservá tu turno online en ${profile.business_name}. Elegí servicio, fecha y horario.` : undefined,
    image: profile?.logo_url ?? undefined,
    themeColor: brand,
  });

  const onConfirm = useCallback(async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!profile || !service || !slot) return;
    if (submitting) return;
    if (!clientName.trim()) {
      toast.error("Ingresá tu nombre");
      return;
    }
    if (!clientPhone.trim()) {
      toast.error("Ingresá tu teléfono");
      return;
    }
    setSubmitting(true);
    try {
      await createAppointment({
        business_id: profile.id,

        service_id: service.id,

        service_name: service.name,

  business_name: profile.business_name,

  client_name: clientName.trim(),

  client_phone: clientPhone.trim(),

  customer_email: clientEmail.trim() || null,

  starts_at: slot.toISOString(),

  end_at: addMinutes(
    slot,
    service.duration_minutes
  ).toISOString(),

  duration_minutes:
    service.duration_minutes,

  status: "scheduled",

  notes: null,
} as any);
      toast.success("¡Reserva confirmada!");
      setStep("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo confirmar la reserva";
      toast.error(/overlap|duplicate|conflict/i.test(msg) ? "Ese horario acaba de ocuparse. Elegí otro." : msg);
    } finally {
      setSubmitting(false);
    }
  }, [profile, service, slot, submitting, clientName, clientPhone, clientEmail]);

  if (loading) {
    return <BookingSkeleton />;
  }
  if (loadError) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div className="max-w-md">
          <Logo />
          <h1 className="mt-6 text-2xl font-semibold">No pudimos cargar la agenda</h1>
          <p className="mt-2 text-sm text-muted-foreground">Revisá tu conexión e intentá nuevamente.</p>
          <button onClick={() => window.location.reload()} className="mt-5 inline-flex items-center justify-center h-10 px-5 rounded-xl bg-primary text-primary-foreground font-medium btn-glow hover:brightness-110 transition">Reintentar</button>
        </div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <Logo />
          <h1 className="mt-6 text-2xl font-semibold">Negocio no encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">El link puede haber cambiado.</p>
        </div>
      </div>
    );
  }
  if (!isAccessAllowed(profile)) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div className="max-w-md">
          <Logo />
          <h1 className="mt-6 text-2xl font-semibold">{profile.business_name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">La agenda online está temporalmente pausada. Volvé pronto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ ['--brand' as string]: brand }}>
      <div className="absolute inset-x-0 top-0 h-64 pointer-events-none" style={{ background: `radial-gradient(60% 70% at 50% 0%, ${brand}1a, transparent 70%)` }} />

      <header className="relative px-5 lg:px-10 pt-8 pb-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          {profile.logo_url ? (
            <img src={profile.logo_url} alt={profile.business_name} className="h-14 w-14 rounded-2xl object-cover border border-border" />
          ) : (
            <div className="h-14 w-14 rounded-2xl grid place-items-center" style={{ background: `${brand}26`, color: brand }}>
              <Scissors className="h-6 w-6" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Reservar turno</div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">{profile.business_name}</h1>
          </div>
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-5 lg:px-10 pb-16">
        {/* Stepper */}
        <div className="flex items-center gap-2 my-6 text-xs text-muted-foreground">
          <StepDot active={step === "service"} done={step !== "service"} label="Servicio" />
          <div className="flex-1 h-px bg-border" />
          <StepDot active={step === "datetime"} done={step === "details" || step === "done"} label="Fecha" />
          <div className="flex-1 h-px bg-border" />
          <StepDot active={step === "details"} done={step === "done"} label="Datos" />
        </div>

        {step === "service" && (
          <section className="space-y-3 animate-fade-in">
            <h2 className="text-lg font-semibold">Elegí un servicio</h2>
            {services.length === 0 ? (
              <div className="card-premium p-10 text-center text-sm text-muted-foreground">El negocio aún no publicó servicios.</div>
            ) : (
              services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setService(s); setStep("datetime"); }}
                  className="w-full card-premium p-4 flex items-center gap-4 hover:border-primary/50 transition text-left"
                >
                  <div className="h-12 w-12 rounded-xl grid place-items-center" style={{ background: `${brand}1f`, color: brand }}>
                    <Scissors className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{formatDuration(s.duration_minutes)}</div>
                  </div>
                  <div className="text-base font-semibold">{formatPrice(Number(s.price))}</div>
                </button>
              ))
            )}
          </section>
        )}

        {step === "datetime" && service && (
          <section className="space-y-4 animate-fade-in">
            <button onClick={() => setStep("service")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Cambiar servicio</button>
            <div className="card-premium p-4 flex items-center gap-3">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <div className="flex-1 text-sm"><span className="font-medium">{service.name}</span> · {formatDuration(service.duration_minutes)} · {formatPrice(Number(service.price))}</div>
            </div>

            <div className="card-premium p-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="h-9 w-9 rounded-lg hover:bg-accent grid place-items-center"><ChevronLeft className="h-4 w-4" /></button>
                <div className="text-sm font-medium">{weekStart.toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</div>
                <button onClick={() => {
  const next = addDays(weekStart, 7);

  if (
    next <= addDays(startOfDay(new Date()), 29)
  ) {
    setWeekStart(next);
  }
}} className="h-9 w-9 rounded-lg hover:bg-accent grid place-items-center"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
                {week.map((d) => {
                  const isSel = sameDay(d, date);
                  const past = d.getTime() < startOfDay(new Date()).getTime();
                  return (
                    <button
                      key={d.toISOString()}
                      disabled={past}
                      onClick={() => { setDate(d); setSlot(null); }}
                      className={`shrink-0 w-14 rounded-xl p-2 text-center border transition disabled:opacity-30 ${isSel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/40 hover:border-primary/40"}`}
                    >
                      <div className={`text-[10px] uppercase tracking-wider ${isSel ? "opacity-80" : "text-muted-foreground"}`}>{WEEKDAYS_SHORT_ES[d.getDay()]}</div>
                      <div className="text-lg font-semibold leading-tight mt-0.5">{d.getDate()}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
  {slots.length === 0 ? (
    <div className="py-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary grid place-items-center text-muted-foreground">
        <CalendarDays className="h-5 w-5" />
      </div>

      <div className="mt-3 text-sm font-medium">
        Sin turnos disponibles
      </div>

      <div className="text-xs text-muted-foreground">
        Probá con otro día.
      </div>
    </div>
  ) : (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((s) => {
        const isSel =
          slot?.getTime() === s.getTime();

        return (
          <button
            key={s.toISOString()}
            onClick={() => setSlot(s)}
            className={`h-11 rounded-xl border text-sm tabular-nums transition ${
              isSel
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/40 border-border hover:border-primary/40"
            }`}
          >
            {formatTime(s)}
          </button>
        );
      })}
    </div>
  )}
</div>

            <button
              disabled={!slot}
              onClick={() => setStep("details")}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium btn-glow disabled:opacity-40 hover:brightness-110 transition"
            >
              Continuar
            </button>
          </section>
        )}

        {step === "details" && service && slot && (
          <section className="space-y-4 animate-fade-in">
            <button onClick={() => setStep("datetime")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Cambiar fecha</button>
            <div className="card-premium p-4 space-y-1 text-sm">
              <div className="flex items-center gap-2"><Scissors className="h-3.5 w-3.5 text-primary" /> {service.name}</div>
              <div className="flex items-center gap-2"><CalendarIcon className="h-3.5 w-3.5 text-primary" /> {slot.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</div>
              <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary" /> {formatTime(slot)} · {formatDuration(service.duration_minutes)}</div>
            </div>
            <form onSubmit={onConfirm} className="card-premium p-5 space-y-3">
              <h3 className="text-base font-semibold">Tus datos</h3>
              <input required placeholder="Nombre completo" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full h-11 rounded-xl bg-secondary/60 border border-border px-4 text-sm focus:outline-none focus:border-primary/60" />
              <input required placeholder="Teléfono" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full h-11 rounded-xl bg-secondary/60 border border-border px-4 text-sm focus:outline-none focus:border-primary/60" />
              <input type="email" placeholder="Email (opcional)" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full h-11 rounded-xl bg-secondary/60 border border-border px-4 text-sm focus:outline-none focus:border-primary/60" />
              <button type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-medium btn-glow hover:brightness-110 transition disabled:opacity-60 inline-flex items-center justify-center gap-2">
                {submitting ? (
                  <><span className="h-4 w-4 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" /> Confirmando…</>
                ) : "Confirmar reserva"}
              </button>
            </form>
          </section>
        )}

        {step === "done" && service && slot && (
          <section className="text-center max-w-md mx-auto animate-fade-in py-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-success/15 grid place-items-center text-success animate-pulse-glow">
              <Check className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold">¡Reserva confirmada!</h2>
            <p className="mt-2 text-sm text-muted-foreground">Te esperamos en {profile.business_name}.</p>
            <div className="mt-6 card-premium p-4 text-left space-y-1 text-sm">
              <div className="flex items-center gap-2"><Scissors className="h-3.5 w-3.5 text-primary" /> {service.name}</div>
              <div className="flex items-center gap-2"><CalendarIcon className="h-3.5 w-3.5 text-primary" /> {slot.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</div>
              <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary" /> {formatTime(slot)}</div>
              {profile.whatsapp && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> {profile.whatsapp}</div>}
              {profile.phone && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /> {profile.phone}</div>}
            </div>
            {profile.whatsapp && (
              <a href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-primary text-primary-foreground font-medium btn-glow hover:brightness-110 transition">
                <Sparkles className="h-4 w-4" /> Avisar por WhatsApp
              </a>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-5 w-5 rounded-full grid place-items-center text-[10px] ${done ? "bg-primary text-primary-foreground" : active ? "border border-primary text-primary" : "border border-border text-muted-foreground"}`}>
        {done ? <Check className="h-3 w-3" /> : "•"}
      </span>
      <span className={active || done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
