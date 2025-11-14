import { supabase } from "./supabase";

/* ============================================================
   IMAGE UPLOAD — RETURN PUBLIC URL
   ============================================================ */
export async function uploadActivityImage(uri: string) {
  try {
    const res = await fetch(uri);
    const buf = await res.arrayBuffer();

    const ext = uri.split(".").pop() || "jpg";
    const filename = `${Date.now()}.${ext}`;
    const filepath = `activities/${filename}`;

    const { error } = await supabase.storage
      .from("activity-images")
      .upload(filepath, buf, {
        contentType: `image/${ext === "png" ? "png" : "jpeg"}`,
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("activity-images")
      .getPublicUrl(filepath);

    return data.publicUrl;
  } catch (err) {
    console.error("uploadActivityImage error:", err);
    throw err;
  }
}

/* ============================================================
   CREATE ACTIVITY
   ============================================================ */
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

/* ============================================================
   FETCH ALL ACTIVITIES
   ============================================================ */
export async function fetchActivities() {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("date", { ascending: true });

  if (error) throw error;
  return data;
}

/* ============================================================
   FETCH ONE ACTIVITY
   ============================================================ */
export async function fetchActivityById(id: string) {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/* ============================================================
   UPDATE ACTIVITY
   ============================================================ */
export async function updateActivity(id: string, payload: any) {
  const { data, error } = await supabase
    .from("activities")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
  return data;
}

/* ============================================================
   IS USER REGISTERED?
   ============================================================ */
export async function isUserRegistered(activityId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("registrations")
    .select("id")
    .eq("user_id", user.id)
    .eq("activity_id", activityId)
    .maybeSingle();

  return !!data;
}

/* ============================================================
   REGISTER USER (ONE TIME)
   ============================================================ */
export async function registerForActivity(activityId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in.");

  const { error } = await supabase.from("registrations").insert({
    user_id: user.id,
    activity_id: activityId,
  });

  if (error?.code === "23505") {
    return { alreadyRegistered: true };
  }

  if (error) throw error;

  return { alreadyRegistered: false };
}

/* ============================================================
   CANCEL REGISTRATION
   ============================================================ */
export async function cancelRegistration(activityId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in.");

  const { error } = await supabase
    .from("registrations")
    .delete()
    .eq("user_id", user.id)
    .eq("activity_id", activityId);

  if (error) throw error;

  return true;
}

/* ============================================================
   FETCH USER'S REGISTERED ACTIVITIES (STUDENT)
   ============================================================ */
export async function fetchUserRegisteredActivities() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("registrations")
    .select("activities(*)")
    .eq("user_id", user.id)
    .order("registered_at", { ascending: false });

  if (error) throw error;

  return data.map((row: any) => row.activities);
}

/* ============================================================
   FETCH ACTIVITIES CREATED BY ORGANIZER
   ============================================================ */
export async function fetchOrganizerActivities(userId: string) {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("organizer_id", userId)
    .order("date", { ascending: true });

  if (error) throw error;
  return data;
}
