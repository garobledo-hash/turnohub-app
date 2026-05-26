import { supabase } from "@/lib/supabase";

// Mercado Pago integration.
// Calls the Supabase Edge Function `mp-checkout`, which creates a real
// Checkout Preference using MP_ACCESS_TOKEN and returns init_point.
// The matching `mp-webhook` function activates the plan on approval.

const FUNCTIONS_URL: string =
  (import.meta.env.VITE_FUNCTIONS_URL as string | undefined) ?? "";

export interface CheckoutResult {
  url: string | null;
  preferenceId: string | null;
}

export async function startCheckout(
  _userId: string,
  plan: "monthly" | "yearly" = "monthly"
): Promise<CheckoutResult> {
  if (!FUNCTIONS_URL) {
    throw new Error("VITE_FUNCTIONS_URL no está configurado");
  }
  const { data: sess } = await supabase.auth.getSession();
  const token = sess.session?.access_token;
  if (!token) throw new Error("Sesión expirada. Iniciá sesión de nuevo.");

  const res = await fetch(`${FUNCTIONS_URL}/mp-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`No se pudo iniciar el cobro (${res.status}) ${text}`);
  }
  const json = (await res.json()) as { init_point?: string; preference_id?: string };
  return { url: json.init_point ?? null, preferenceId: json.preference_id ?? null };
}

export async function manuallyActivatePlan(userId: string, days: number = 30): Promise<void> {
  const ends = new Date(Date.now() + days * 86_400_000).toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({ plan_active: true, plan_end_at: ends, trial_active: false })
    .eq("id", userId);
  if (error) throw error;
}
