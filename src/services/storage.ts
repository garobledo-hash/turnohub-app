import { supabase } from "@/lib/supabase";

export async function uploadLogo(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();

  const fileName = `${userId}-${Date.now()}.${ext}`;

  const filePath = `logos/${fileName}`;

  const { error } = await supabase.storage
    .from("logos")
    .upload(filePath, file, {
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from("logos")
    .getPublicUrl(filePath);

  return data.publicUrl;
}