import { supabase } from "@/lib/supabase";
import type { Payment, Subscription } from "@/types/db";

export async function listMyPayments(userId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Payment[];
}

export async function getMySubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Subscription | null) ?? null;
}

export function extractPaymentMethod(raw: Record<string, unknown> | null): string | null {
  if (!raw) return null;
  const pm = (raw as { payment_method_id?: string; payment_type_id?: string }).payment_method_id;
  const pt = (raw as { payment_type_id?: string }).payment_type_id;
  if (pm && pt) return `${pm} · ${pt}`;
  return pm ?? pt ?? null;
}
