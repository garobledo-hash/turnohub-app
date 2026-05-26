import { supabase } from "@/lib/supabase";
import type { BusinessHour } from "@/types/db";

export async function listHours(businessId: string): Promise<BusinessHour[]> {
  const { data, error } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", businessId)
    .order("day_of_week", {
  ascending: true,
})
.order("sort_order", {
  ascending: true,
});

  if (error) throw error;

  return (data ?? []) as BusinessHour[];
}

export async function upsertHour(
  row: Partial<BusinessHour> & {
    business_id: string;
    day_of_week: number;
  }
): Promise<BusinessHour> {
  if (row.id) {
    const { data, error } = await supabase
      .from("business_hours")
      .update(row)
      .eq("id", row.id)
      .select("*")
      .single();

    if (error) throw error;

    return data as BusinessHour;
  }

  const { data, error } = await supabase
    .from("business_hours")
    .insert(row)
    .select("*")
    .single();

  if (error) throw error;

  return data as BusinessHour;
}

export async function deleteHour(id: string): Promise<void> {
  const { error } = await supabase
    .from("business_hours")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function setDayClosed(
  businessId: string,
  dayOfWeek: number,
  isClosed: boolean
): Promise<void> {
  const { error } = await supabase
    .from("business_hours")
    .update({
      is_closed: isClosed,
    })
    .eq("business_id", businessId)
    .eq("day_of_week", dayOfWeek);

  if (error) throw error;
}