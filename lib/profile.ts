import { supabase } from "./supabase";

/* ===============================================================
   Upload profile photo using SAME WORKING METHOD as activities
=============================================================== */
export async function uploadProfilePhoto(uri: string, userId: string) {
  try {
    // Read binary
    const res = await fetch(uri);
    const buffer = await res.arrayBuffer();

    // Create filename
    const ext = uri.split(".").pop() || "jpg";
    const filename = `${userId}-${Date.now()}.${ext}`;
    const filepath = `avatars/${filename}`;

    // Upload to supabase storage (profile-photos bucket)
    const { error } = await supabase.storage
      .from("profile-photos")
      .upload(filepath, buffer, {
        contentType: `image/${ext === "png" ? "png" : "jpeg"}`,
        upsert: false,
      });

    if (error) throw error;

    // Return public URL
    const { data } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filepath);

    return data.publicUrl;
  } catch (err) {
    console.error("uploadProfilePhoto FAILED:", err);
    throw err;
  }
}

/* ===============================================================
   Update profile row
=============================================================== */
export async function updateProfile(userId: string, payload: any) {
  const { error } = await supabase
    .from("profiles")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}
