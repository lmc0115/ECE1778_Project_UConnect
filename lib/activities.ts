import { supabase } from "./supabase";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

function normalizeStartTime(raw?: string | null) {
  if (!raw) return "";
  if (raw.length === 5) return `${raw}:00`;
  return raw;
}

/* ============================================================
   LOCAL REMINDER HELPERS (PER ACTIVITY)
   ============================================================ */
async function scheduleLocalReminder(
  activityId: string,
  date: string,
  startTime: string,
  title: string,
  body: string
) {
  if (!date || !startTime) return;

  const normalizedTime = normalizeStartTime(startTime);
  const start = new Date(`${date}T${normalizedTime}`);
  if (isNaN(start.getTime())) return;

  const reminderTime = new Date(start.getTime() - 30 * 60 * 1000);

  const diffSeconds = Math.floor(
    (reminderTime.getTime() - Date.now()) / 1000
  );
  if (diffSeconds <= 0) return;

  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: diffSeconds,
  };

  if (Platform.OS === "android") {
    trigger.channelId = "default";
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { activityId },
      sound: "default",
    },
    trigger,
  });
}

async function cancelLocalReminderForActivity(activityId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  for (const item of scheduled) {
    const data: any = item.content.data;
    if (data && data.activityId === activityId) {
      await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
  }
}

/* ============================================================
   PUSH NOTIFICATION HELPERS
   ============================================================ */
async function sendPush(token: string, title: string, body: string) {
  if (!token) return;

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: token,
      sound: "default",
      title,
      body,
    }),
  });
}

async function getPushTokenForUser(userId: string | null | undefined) {
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("expo_push_token")
    .eq("id", userId)
    .maybeSingle();

  return data?.expo_push_token ?? null;
}

async function getRegisteredStudentTokens(activityId: string) {
  const { data: regs } = await supabase
    .from("registrations")
    .select("user_id")
    .eq("activity_id", activityId);

  if (!regs || regs.length === 0) return [];

  const userIds = regs.map((reg) => reg.user_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, expo_push_token")
    .in("id", userIds);

  if (!profiles) return [];

  return profiles
    .map((profile: any) => profile.expo_push_token)
    .filter((token: string | null) => Boolean(token)) as string[];
}

async function countRegistrations(activityId: string) {
  const { data: regs } = await supabase
    .from("registrations")
    .select("id")
    .eq("activity_id", activityId);

  return regs?.length ?? 0;
}

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

  const { data, error } = await supabase
    .from("activities")
    .insert([
      {
        title,
        date,
        start_time,
        location,
        introduction,
        image_urls,
        organizer_id: user?.id ?? null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  const created = data;

  if (created && created.id && created.date && created.start_time) {
    await scheduleLocalReminder(
      String(created.id),
      created.date,
      normalizeStartTime(created.start_time),
      "Activity Reminder",
      `Your activity "${created.title}" starts in 30 minutes.`
    );
  }

  if (created) {
    const organizerToken = await getPushTokenForUser(created.organizer_id);
    if (organizerToken) {
      await sendPush(
        organizerToken,
        "Activity Created",
        `You successfully created activity: "${created.title}".`
      );
    }
  }
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
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  if (data) {
    const organizerToken = await getPushTokenForUser(data.organizer_id);
    if (organizerToken) {
      await sendPush(
        organizerToken,
        "Activity Updated",
        `You successfully modified activity: "${data.title}".`
      );
    }

    const studentTokens = await getRegisteredStudentTokens(String(data.id));
    for (const token of studentTokens) {
      await sendPush(
        token,
        "Activity Updated",
        `"${data.title}" has been updated. Please check the details.`
      );
    }

    if (data.date && data.start_time) {
      await cancelLocalReminderForActivity(String(data.id));
      await scheduleLocalReminder(
        String(data.id),
        data.date,
        normalizeStartTime(data.start_time),
        "Activity Reminder",
        `Your activity "${data.title}" starts in 30 minutes.`
      );
    }
  }

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
  const activity = await fetchActivityById(activityId);

  if (activity && activity.id && activity.date && activity.start_time) {
    await cancelLocalReminderForActivity(activityId);
    await scheduleLocalReminder(
      String(activity.id),
      activity.date,
      normalizeStartTime(activity.start_time),
      "Activity Reminder",
      `Your registered activity "${activity.title}" starts in 30 minutes.`
    );
  }

  if (activity && user.id) {
    const studentToken = await getPushTokenForUser(user.id);
    if (studentToken) {
      await sendPush(
        studentToken,
        "Registration Confirmed",
        `You successfully registered for "${activity.title}".`
      );
    }
  }

  const total = await countRegistrations(activityId);

  if (activity && activity.organizer_id) {
    const organizerToken = await getPushTokenForUser(activity.organizer_id);
    if (organizerToken) {
      await sendPush(
        organizerToken,
        "New Registration",
        `A new student registered for "${activity.title}". Total registered: ${total}.`
      );
    }
  }
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
  await cancelLocalReminderForActivity(activityId);

  const activity = await fetchActivityById(activityId);

  const total = await countRegistrations(activityId);

  if (activity && activity.organizer_id) {
    const organizerToken = await getPushTokenForUser(activity.organizer_id);
    if (organizerToken) {
      await sendPush(
        organizerToken,
        "Registration Cancelled",
        `A student cancelled registration for "${activity.title}". Total registered: ${total}.`
      );
    }
  }
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
