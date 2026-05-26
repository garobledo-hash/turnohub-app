import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createService, deleteService, listServices, updateService } from "@/services/services";
import type { Service } from "@/types/db";
import { formatDuration, formatPrice } from "@/lib/utils";
import { Field, TextInput } from "@/components/FormField";
import { Switch } from "@/components/Switch";
import { Pencil, Plus, Scissors, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface DraftForm {
  name: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

const EMPTY: DraftForm = {
  name: "",
  duration_minutes: 30,
  price: 0,
  is_active: true,
};

export default function ServicesPage() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [draft, setDraft] = useState<DraftForm>(EMPTY);

  async function refresh(): Promise<void> {
    if (!profile?.id) return;
    setItems(await listServices(profile.id));
  }
  useEffect(() => { void refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [profile?.id]);

  function startNew(): void {
    setEditing(null);
    setDraft(EMPTY);
    setShowForm(true);
  }
  function startEdit(s: Service): void {
    setEditing(s);
    setDraft({
  name: s.name,
  duration_minutes: s.duration_minutes,
  price: Number(s.price),
  is_active: s.is_active,
});
    setShowForm(true);
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!profile?.id) return;
    if (!draft.name.trim()) return;
    try {
      if (editing) {
        await updateService(editing.id, { ...draft });
        toast.success("Servicio actualizado");
      } else {
        await createService({ ...draft, business_id: profile.id });
        toast.success("Servicio creado");
      }
      setShowForm(false);
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  async function onToggleActive(s: Service): Promise<void> {
    await updateService(s.id, {
  is_active: !s.is_active,
});
    await refresh();
  }
  async function onDelete(s: Service): Promise<void> {
    if (!confirm(`¿Eliminar "${s.name}"?`)) return;
    await deleteService(s.id);
    toast.success("Servicio eliminado");
    await refresh();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Servicios</h1>
          <p className="text-sm text-muted-foreground">La duración define automáticamente los huecos de tu agenda.</p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-medium btn-glow hover:brightness-110 transition">
          <Plus className="h-4 w-4" /> Nuevo servicio
        </button>
      </header>

      {items.length === 0 ? (
        <div className="card-premium p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center text-primary"><Scissors className="h-6 w-6" /></div>
          <h3 className="mt-4 text-lg font-semibold">Aún no creaste servicios</h3>
          <p className="text-sm text-muted-foreground mt-1">Sumá tu primer servicio para empezar a recibir reservas.</p>
          <button onClick={startNew} className="mt-5 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-medium btn-glow hover:brightness-110 transition">
            <Plus className="h-4 w-4" /> Crear servicio
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((s) => (
            <div key={s.id} className={`card-premium p-5 flex flex-col gap-3 transition ${!s.is_active && "opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold leading-tight">{s.name}</h3>
                  <div className="text-xs text-muted-foreground mt-1">{formatDuration(s.duration_minutes)} · {formatPrice(Number(s.price))}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(s)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-accent text-muted-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => onDelete(s)} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-destructive/15 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="mt-auto pt-2 flex items-center justify-between border-t border-border/60">
                <span className="text-xs text-muted-foreground">{s.is_active ? "Activo" : "Inactivo"}</span>
                <Switch checked={s.is_active} onChange={() => onToggleActive(s)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowForm(false)}>
          <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md card-premium p-6 animate-scale-in space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editing ? "Editar servicio" : "Nuevo servicio"}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <Field label="Nombre">
              <TextInput required placeholder="Corte clásico" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duración (min)">
                <TextInput type="number" min={5} step={5} required value={draft.duration_minutes} onChange={(e) => setDraft({ ...draft, duration_minutes: Number(e.target.value) })} />
              </Field>
              <Field label="Precio">
                <TextInput type="number" min={0} step={100} required value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
              </Field>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
              <div>
                <div className="text-sm font-medium">Activo</div>
                <div className="text-xs text-muted-foreground">Disponible para reservar</div>
              </div>
              <Switch checked={draft.is_active} onChange={(v) => setDraft({ ...draft, active: v })} />
            </div>
            <button type="submit" className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium btn-glow hover:brightness-110 transition">
              {editing ? "Guardar cambios" : "Crear servicio"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
