import { supabase } from "./supabase";

/**
 * Upload a local image URI to Supabase storage and return public URL
 */
export async function uploadActivityImage(uri: string) {
  try {
    // Fetch image as array buffer
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();

    const ext = uri.split(".").pop() || "jpg";
    const filename = `${Date.now()}.${ext}`;
    const filepath = `activities/${filename}`;

    // Upload raw binary buffer
    const { error } = await supabase.storage
      .from("activity-images")
      .upload(filepath, arrayBuffer, {
        contentType: `image/${ext === "png" ? "png" : "jpeg"}`,
        upsert: false,
      });

    if (error) throw error;

    // 🔥 Always return PUBLIC URL (never use signed URLs)
    const { data } = supabase.storage
      .from("activity-images")
      .getPublicUrl(filepath);

    return data.publicUrl;

  } catch (err) {
    console.error("uploadActivityImage error:", err);
    throw err;
  }
}

/**
 * Insert a new activity into Supabase
 */
export async function createActivity({
  title,
  date,
  start_time,
  location,
  introduction,
  image_urls,
}: {
  title: string;
  date: string;
  start_time: string;
  location: string;
  introduction: string;
  image_urls: string[];
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase.from("activities").insert([
    {
      title,
      date,
      start_time,
      location,
      introduction,
      image_urls,
      organizer_id: user?.id ?? null,
    },
  ]);

  if (error) throw error;

  return data;
}

/**
 * Fetch all activities
 */
export async function fetchActivities() {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("date", { ascending: true });

  if (error) throw error;

  return data;
}

export async function fetchActivityById(id: string) {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateActivity(id: string, payload: any) {
  const { data, error } = await supabase
    .from("activities")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
  return data;
}
