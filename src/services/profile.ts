import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/db";

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function updateMyProfile(userId: string, patch: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("booking_slug", slug).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export function isAccessAllowed(profile: any) {
  const now = new Date();

  const hasActiveTrial =
    profile.trial_active &&
    profile.trial_end_at &&
    new Date(profile.trial_end_at) > now;

  const hasActivePlan =
    profile.plan_active &&
    profile.plan_end_at &&
    new Date(profile.plan_end_at) > now;

  return hasActiveTrial || hasActivePlan;
}

export function trialDaysLeft(p: Profile | null | undefined): number {
  if (!p) return 0;
  const end = new Date(p.trial_end_at).getTime();
  return Math.max(0, Math.ceil((end - Date.now()) / 86_400_000));
}
