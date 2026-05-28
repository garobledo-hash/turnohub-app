import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { listHours, upsertHour, deleteHour, setDayClosed } from "@/services/businessHours";
import { updateMyProfile } from "@/services/profile";
import type { BusinessHour, Profile } from "@/types/db";
import { WEEKDAYS_ES, slugify } from "@/lib/utils";
import { Switch } from "@/components/Switch";
import { Field, TextInput } from "@/components/FormField";
import { Copy, ExternalLink, Plus, Save, Scissors, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState<boolean>(false);

  useDocumentMeta({ title: "Configuración · TurnoHub" });

  useEffect(() => {
    if (!profile) return;
    setForm({
  business_name: profile.business_name,
  full_name: profile.full_name,
  phone: profile.phone ?? "",
  whatsapp: profile.whatsapp ?? "",
  logo_url: profile.logo_url ?? "",
  brand_color: profile.brand_color ?? "#C7F250",
  booking_slug: profile.booking_slug,
});
    listHours(profile.id)
  .then(setHours)
  .catch(() => undefined);

    }, [profile]);

  async function refreshHours(): Promise<void> {
    if (!profile?.id) return;
    setHours(await listHours(profile.id));
  }

  async function onToggleDayClosed(
  weekday: number,
  is_closed: boolean
): Promise<void> {
  if (!profile?.id) return;

  const dayRows = hours.filter(
    (h) => h.day_of_week === weekday
  );

  if (dayRows.length === 0 && !is_closed) {
    await upsertHour({
      business_id: profile.id,
      day_of_week: weekday,
      start_time: "09:00",
      end_time: "13:00",
      is_closed: false,
      sort_order: 0,
    });

    await upsertHour({
      business_id: profile.id,
      day_of_week: weekday,
      start_time: "16:00",
      end_time: "21:00",
      is_closed: false,
      sort_order: 1,
    });
  } else {
    await setDayClosed(
      profile.id,
      weekday,
      is_closed
    );
  }

  await refreshHours();

  toast.success("Horario actualizado");
}

  async function onChangeHour(row: BusinessHour, patch: Partial<BusinessHour>): Promise<void> {
    if (!profile?.id) return;
    await upsertHour({
  ...row,
  ...patch,
  business_id: profile.id,
});

  await refreshHours();

  toast.success("Horario guardado");
}

  async function onAddRange(weekday: number): Promise<void> {
  if (!profile?.id) return;

  await upsertHour({
    business_id: profile.id,
    day_of_week: weekday,
    start_time: "15:00",
    end_time: "19:00",
    is_closed: false,
  });

  await refreshHours();

  toast.success("Rango agregado");
}

  async function onRemoveRange(id: string): Promise<void> {
    await deleteHour(id);
    await refreshHours();

    toast.success("Rango eliminado");
  }

  async function onSaveBusiness(): Promise<void> {
    if (!profile?.id || saving) return;
    if (form.business_name && !form.business_name.trim()) {
      toast.error("El nombre del negocio no puede estar vacío");
      return;
    }
    setSaving(true);
    try {
      const slugClean = form.booking_slug
  ? slugify(form.booking_slug)
  : profile.booking_slug;
      if (!slugClean) {
        toast.error("El slug no puede estar vacío");
        return;
      }
      await updateMyProfile(profile.id, {
  business_name: form.business_name,
  full_name: form.full_name,
  phone: form.phone,
  whatsapp: form.whatsapp,
  logo_url: form.logo_url,
  brand_color: form.brand_color,
  booking_slug: slugClean,
});
      await refreshProfile();
      toast.success("Datos guardados");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  const publicLink = useMemo(
  () =>
    profile?.booking_slug
      ? `${window.location.origin}/r/${profile.booking_slug}`
      : "",
    [profile?.booking_slug]
  );
  const previewSlug = form.booking_slug
  ? slugify(form.booking_slug)
  : profile?.booking_slug;
  const previewLink = previewSlug ? `${window.location.origin}/r/${previewSlug}` : "";
  const previewBrand = form.brand_color || profile?.brand_color || "#C7F250";

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Tu negocio, tu marca, tu disponibilidad.</p>
      </header>

      {/* Public link */}
      <section className="card-premium p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Link público</div>
        <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 rounded-xl bg-secondary/60 border border-border px-4 h-11 flex items-center text-sm truncate">{publicLink || "—"}</div>
          <button
            onClick={() => { if (publicLink) { navigator.clipboard.writeText(publicLink); toast.success("Link copiado al portapapeles"); } }}
            disabled={!publicLink}
            className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-border hover:border-primary/40 text-sm disabled:opacity-50"
          >
            <Copy className="h-4 w-4" /> Copiar
          </button>
          {publicLink && (
            <a href={publicLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-primary text-primary-foreground font-medium btn-glow hover:brightness-110 transition">
              <ExternalLink className="h-4 w-4" /> Ver
            </a>
          )}
        </div>
        {previewLink && previewLink !== publicLink && (
          <div className="mt-3 text-xs text-muted-foreground">
            Tras guardar: <span className="font-mono text-foreground">{previewLink}</span>
          </div>
        )}
      </section>

      {/* Brand preview */}
      <section className="card-premium p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Vista previa de marca</div>
        <div
          className="rounded-2xl border border-border p-5 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${previewBrand}14, transparent 60%)` }}
        >
          <div className="flex items-center gap-4">
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt="Logo"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                className="h-14 w-14 rounded-2xl object-cover border border-border"
              />
            ) : (
              <div
                className="h-14 w-14 rounded-2xl grid place-items-center border border-border"
                style={{ background: `${previewBrand}26`, color: previewBrand }}
              >
                <Scissors className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Reservar turno</div>
              <div className="text-lg font-semibold truncate">{form.business_name || "Tu negocio"}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Servicios", "Hoy", "Disponible"].map((t) => (
              <span key={t} className="text-[11px] px-2.5 h-6 inline-flex items-center rounded-full border" style={{ borderColor: `${previewBrand}55`, color: previewBrand, background: `${previewBrand}12` }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Business info */}
      <section className="card-premium p-5 space-y-4">
        <h2 className="text-lg font-semibold">Datos del negocio</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Negocio">
            <TextInput value={form.business_name ?? ""} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
          </Field>
          <Field label="Tu nombre">
            <TextInput value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <TextInput value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="WhatsApp" hint="Sólo números con código de país. Ej: 5491100000000">
            <TextInput value={form.whatsapp ?? ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </Field>
          <Field label="Logo URL">
            <TextInput value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
          </Field>
          <Field label="Color de marca">
            <div className="flex gap-2">
              <input type="color" value={form.brand_color ?? "#C7F250"} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} className="h-11 w-12 rounded-lg bg-secondary border border-border cursor-pointer" />
              <TextInput value={form.brand_color ?? ""} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} />
            </div>
          </Field>
          <Field label="Slug (link público)" hint="Solo letras minúsculas y guiones." className="sm:col-span-2">
            <TextInput value={form.booking_slug ?? ""} onChange={(e) => setForm({ ...form, booking_slug: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onSaveBusiness}
            disabled={saving}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground font-medium btn-glow hover:brightness-110 transition disabled:opacity-60"
          >
            {saving ? (
              <><span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground animate-spin" /> Guardando…</>
            ) : (
              <><Save className="h-4 w-4" /> Guardar</>
            )}
          </button>
        </div>
      </section>

      {/* Hours */}
      <section className="card-premium p-5">
        <h2 className="text-lg font-semibold">Horarios</h2>
        <p className="text-sm text-muted-foreground mb-4">Configurá múltiples rangos por día. Los huecos se calculan automáticamente según la duración del servicio.</p>
        <div className="space-y-3">
          {WEEKDAYS_ES.map((label, weekday) => {
  const rows = hours
    .filter((h) => h.day_of_week === weekday)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const closed =
    rows.length > 0 &&
    rows.every((r) => r.is_closed);

  const isOpen =
    rows.length > 0 &&
    !closed;
            return (
              <div key={weekday} className={`rounded-xl border p-4 transition ${isOpen ? "border-border bg-card/40" : "border-border/40 bg-card/20"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={isOpen} onChange={(v) => onToggleDayClosed(weekday, !v)} />
                    <span className="font-medium">{label}</span>
                    {closed && <span className="text-[11px] px-2 h-5 rounded-full bg-destructive/10 text-destructive inline-flex items-center">Cerrado</span>}
                  </div>
                  {isOpen && (
                    <button onClick={() => onAddRange(weekday)} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <Plus className="h-3 w-3" /> Agregar rango
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-3 space-y-2">
                    {rows.filter((r) => !r.is_closed).map((row) => (
                      <div key={row.id} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          value={(row.start_time ?? "").slice(0, 5)}
                          onChange={(e) => onChangeHour(row, { start_time: e.target.value })}
                          className="h-10 w-[120px] rounded-lg bg-secondary/60 border border-border px-3 text-sm focus:outline-none focus:border-primary/60"
                        />
                        <span className="text-muted-foreground">—</span>
                        <input
                          type="time"
                          value={(row.end_time ?? "").slice(0, 5)}
                          onChange={(e) => onChangeHour(row, { end_time: e.target.value })}
                          className="h-10 rounded-lg bg-secondary/60 border border-border px-3 text-sm focus:outline-none focus:border-primary/60"
                        />
                        {rows.filter((r) => !r.is_closed).length > 1 && (
                          <button onClick={() => onRemoveRange(row.id)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-destructive/15 text-destructive ml-auto">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
