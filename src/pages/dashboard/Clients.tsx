import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { listAppointments } from "@/services/appointments";
import { listServices } from "@/services/services";
import type { Appointment, Service } from "@/types/db";
import { formatDateLong, formatTime } from "@/lib/utils";
import { Phone, Search, User } from "lucide-react";

interface ClientRow {
  key: string;
  name: string;
  phone: string | null;
  visits: number;
  lastVisit: Date | null;
  nextVisit: Date | null;
  history: Appointment[];
}

export default function ClientsPage() {
  const { profile } = useAuth();
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState<string>("");
  const [selected, setSelected] = useState<ClientRow | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    listAppointments(profile.id).then(setAppts).catch(() => undefined);
    listServices(profile.id).then(setServices).catch(() => undefined);
  }, [profile?.id]);

  const clients: ClientRow[] = useMemo(() => {
    const map = new Map<string, ClientRow>();
    for (const a of appts) {
      const key = (a.client_phone || a.client_email || a.client_name).toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, { key, name: a.client_name, phone: a.client_phone, visits: 0, lastVisit: null, nextVisit: null, history: [] });
      }
      const row = map.get(key)!;
      row.history.push(a);
      const date = new Date(a.starts_at);
      if (a.status === "completed") {
        row.visits += 1;
        if (!row.lastVisit || date > row.lastVisit) row.lastVisit = date;
      }
      if (date.getTime() > Date.now() && a.status !== "cancelled") {
        if (!row.nextVisit || date < row.nextVisit) row.nextVisit = date;
      }
    }
    return Array.from(map.values()).sort((a, b) => b.visits - a.visits);
  }, [appts]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q) || (c.phone ?? "").includes(q));
  }, [clients, query]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Historial automático generado por tus turnos.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o teléfono"
            className="w-full h-10 rounded-xl bg-secondary/60 border border-border pl-10 pr-4 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/60"
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="card-premium p-12 text-center text-sm text-muted-foreground">
          {clients.length === 0 ? "Todavía no tenés clientes." : "Sin resultados."}
        </div>
      ) : (
        <div className="card-premium overflow-hidden">
          <ul className="divide-y divide-border/60">
            {filtered.map((c) => (
              <li key={c.key}>
                <button onClick={() => setSelected(c)} className="w-full flex items-center gap-3 p-4 hover:bg-accent/30 transition text-left">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-semibold">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.phone || "Sin teléfono"} · {c.visits} {c.visits === 1 ? "visita" : "visitas"}</div>
                  </div>
                  {c.nextVisit && (
                    <span className="text-[11px] px-2 h-6 rounded-full bg-primary/10 text-primary inline-flex items-center">Próximo {formatDateLong(c.nextVisit)}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg card-premium p-6 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary grid place-items-center text-lg font-semibold">{selected.name.charAt(0).toUpperCase()}</div>
              <div className="flex-1">
                <div className="text-lg font-semibold">{selected.name}</div>
                {selected.phone && <a href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"><Phone className="h-3 w-3" /> {selected.phone}</a>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-5">
              <Stat label="Visitas" value={String(selected.visits)} />
              <Stat label="Última" value={selected.lastVisit ? selected.lastVisit.toLocaleDateString("es-AR") : "—"} />
              <Stat label="Próxima" value={selected.nextVisit ? selected.nextVisit.toLocaleDateString("es-AR") : "—"} />
            </div>
            <div className="mt-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Historial</div>
              <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {selected.history.map((a) => {
                  const svc = services.find((s) => s.id === a.service_id);
                  const d = new Date(a.starts_at);
                  return (
                    <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm truncate">{svc?.name ?? "Servicio"}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{d.toLocaleDateString("es-AR")} · {formatTime(d)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/40 border border-border p-3 text-center">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-1">{value}</div>
    </div>
  );
}
