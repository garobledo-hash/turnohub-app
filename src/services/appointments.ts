import { supabase } from "@/lib/supabase";
import type {
  Appointment,
  AppointmentStatus,
  BusinessHour,
} from "@/types/db";

import { addMinutes } from "@/lib/utils";

export async function listAppointments(
  businessId: string
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .order("starts_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Appointment[];
}

export async function listAppointmentsRange(
  businessId: string,
  fromISO: string,
  toISO: string
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("business_id", businessId)
    .gte("starts_at", fromISO)
    .lt("starts_at", toISO)
    .order("starts_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Appointment[];
}

export async function listPublicDayAppointments(
  businessId: string,
  fromISO: string,
  toISO: string
): Promise<
  Pick<Appointment, "starts_at" | "end_at" | "status">[]
> {
  const { data, error } = await supabase
    .from("appointments")
    .select("starts_at,end_at,status")
    .eq("business_id", businessId)
    .gte("starts_at", fromISO)
    .lt("starts_at", toISO)
    .in("status", [
      "pending",
      "confirmed",
      "scheduled",
    ]);

  if (error) throw error;

  return (
    data ?? []
  ) as Pick<
    Appointment,
    "starts_at" | "end_at" | "status"
  >[];
}

export async function createAppointment(
  payload: Omit<
    Appointment,
    "id" | "created_at" | "status"
  > & {
    status?: AppointmentStatus;
  }
): Promise<Appointment> {
  const insert = {
    ...payload,
    status: payload.status ?? "confirmed",
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert(insert)
    .select("*")
    .single();

  if (error) throw error;

  return data as Appointment;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteAppointment(
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ============================================================
// SLOT ENGINE
// ============================================================

function parseHM(t: string): {
  h: number;
  m: number;
} {
  const [h, m] = t.split(":");

  return {
    h: parseInt(h, 10),
    m: parseInt(m, 10),
  };
}

export interface SlotsInput {
  date: Date;
  durationMinutes: number;
  hours: BusinessHour[];
  busy: Pick<
    Appointment,
    "starts_at" | "end_at"
  >[];
}

export function computeAvailableSlots({
  date,
  durationMinutes,
  hours,
  busy,
}: SlotsInput): Date[] {
  const weekday = date.getDay();

  const dayHours = hours.filter(
  (h) =>
    h.day_of_week === weekday &&
    !h.is_closed
);

if (dayHours.length === 0) {
  return [];
}

const slots: Date[] = [];
const now = Date.now();

for (const range of dayHours) {
  const open = parseHM(range.start_time);

  const close = parseHM(range.end_time);

  const start = new Date(date);

  start.setHours(
    open.h,
    open.m,
    0,
    0
  );

  const end = new Date(date);

  end.setHours(
    close.h,
    close.m,
    0,
    0
  );

  let cur = new Date(start);

  while (
    addMinutes(
      cur,
      durationMinutes
    ).getTime() <= end.getTime()
  ) {
    const slotEnd = addMinutes(
      cur,
      durationMinutes
    );

    const overlaps = busy.some((b) => {
  const bs = new Date(
    b.starts_at.replace(" ", "T")
  );

  const be = new Date(
    b.end_at.replace(" ", "T")
  );

  return (
    cur < be &&
    slotEnd > bs
  );
});

    if (
      !overlaps &&
      cur.getTime() > now
    ) {
      slots.push(new Date(cur));
    }

    cur = addMinutes(
      cur,
      durationMinutes
    );
  }
}
  return slots;
}