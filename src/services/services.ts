import { supabase } from "@/lib/supabase";
import type { Service } from "@/types/db";

export async function listServices(businessId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Service[];
}

export async function listPublicServices(businessId: string): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Service[];
}

export async function createService(payload: any): Promise<Service> {
  console.log("SERVICE PAYLOAD:", payload);

  const { data, error } = await supabase
    .from("services")
    .insert(payload)
    .select("*")
    .single();

  console.log("SERVICE ERROR:", error);

  if (error) throw error;

  return data as Service;
}

export async function updateService(id: string, patch: Partial<Service>): Promise<Service> {
  const { data, error } = await supabase
    .from("services")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data as Service;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id);

  if (error) throw error;
}