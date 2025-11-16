import { useEffect, useState, useCallback } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Pressable,
  ActivityIndicator,
} from "react-native";
import * as Notifications from "expo-notifications";
import { supabase } from "../../lib/supabase";
import { useAppSelector } from "../../store/hooks";
import {
  selectIsAuthed,
  selectRole,
  selectUser,
} from "../../store/slices/userSlice";
import ImageModal from "../../components/ImageModal";
import AppButton from "../../components/AppButton";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";

import {
  isUserRegistered,
  registerForActivity,
  cancelRegistration,
} from "../../lib/activities";


/* -------------------------------------------------------------
   Notification helpers
------------------------------------------------------------- */

// Simple push sender using Expo push API
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

// Read organizer's push token from profiles table
async function getOrganizerToken(organizerId: string) {
    const { data } = await supabase
        .from("profiles")
        .select("expo_push_token")
        .eq("id", organizerId)
        .maybeSingle();

    return data?.expo_push_token ?? null;
}

// Local reminder 30 minutes before event start time
async function scheduleLocalReminder(
    date: string,
    startTime: string,
    title: string,
    body: string
) {
    if (!date || !startTime) return;

    const start = new Date(`${date} ${startTime}`);
    if (isNaN(start.getTime())) return;

    const reminderTime = new Date(start.getTime() - 30 * 60 * 1000);

    const diffMs = reminderTime.getTime() - Date.now();
    if (diffMs <= 0) return;

    const seconds = Math.round(diffMs / 1000);

    await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
        },
    });
}

export default function EventDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const authed = useAppSelector(selectIsAuthed);
  const role = useAppSelector(selectRole);
  const user = useAppSelector(selectUser);
  const router = useRouter();

  const [registered, setRegistered] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regStatusLoading, setRegStatusLoading] = useState(true);

  /* -------------------------------------------------------------
     REFRESH EVENT WHEN SCREEN FOCUSED
  ------------------------------------------------------------- */
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadEvent = async () => {
        if (!id) return;
        const { data, error } = await supabase
          .from("activities")
          .select("*")
          .eq("id", id)
          .single();

        if (!error && active) setEvent(data);
        setLoading(false);
      };

      loadEvent();
      return () => {
        active = false;
      };
    }, [id])
  );

  /* -------------------------------------------------------------
     CHECK USER REGISTRATION STATUS
  ------------------------------------------------------------- */
  useEffect(() => {
    setRegistered(false);
    setRegStatusLoading(true);

    if (!id || !authed || role === "organizer") {
      setRegStatusLoading(false);
      return;
    }

    (async () => {
      try {
        const status = await isUserRegistered(String(id));
        setRegistered(status);
      } finally {
        setRegStatusLoading(false);
      }
    })();
  }, [id, authed, role]);

  /* -------------------------------------------------------------
     REGISTER (with local + push notifications)
  ------------------------------------------------------------- */
  const handleRegister = async () => {
    if (!id || !event) return;

    try {
      setRegLoading(true);

      const result = await registerForActivity(String(id));

      // Only send notifications when this is a NEW registration
      if (!result.alreadyRegistered) {
        // 1) Local reminder for the student: 30 minutes before start
        await scheduleLocalReminder(
          event.date,
          event.start_time,
          "Event starting soon",
          event.title
        );

        // 2) Push to organizer: "A new student registered... Total registered: X."
        const organizerToken = await getOrganizerToken(event.organizer_id);
        if (organizerToken) {
          const { count } = await supabase
            .from("registrations")
            .select("*", { count: "exact", head: true })
            .eq("activity_id", id);

          await sendPush(
            organizerToken,
            "New registration",
            `A new student registered for ${event.title}. Total registered: ${count}.`
          );
        }
      }

      Alert.alert(
        result.alreadyRegistered ? "Already registered" : "Registered",
        result.alreadyRegistered
          ? "You already registered for this event."
          : "Registration successful. We will remind you before the event."
      );

      setRegistered(true);
      router.setParams({ refresh: "1" });
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to register.");
    } finally {
      setRegLoading(false);
    }
  };


  /* -------------------------------------------------------------
     CANCEL REGISTRATION (notifications removed)
  ------------------------------------------------------------- */
  const handleCancel = async () => {
    if (!id) return;

    Alert.alert(
      "Cancel registration?",
      "You will not be registered for this event.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Registration",
          style: "destructive",
          onPress: async () => {
            try {
              setRegLoading(true);
              await cancelRegistration(String(id));

              Alert.alert("Cancelled", "Registration removed.", [
                {
                  text: "OK",
                  onPress: () =>
                    router.push({
                      pathname: "/mylist",
                      params: { refresh: "1" },
                    }),
                },
              ]);

              setRegistered(false);
            } catch (err: any) {
              Alert.alert("Error", err.message ?? "Failed to cancel.");
            } finally {
              setRegLoading(false);
            }
          },
        },
      ]
    );
  };

  /* -------------------------------------------------------------
     RENDER
  ------------------------------------------------------------- */
  if (loading || !event) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading event...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text style={styles.title}>{event.title}</Text>

        {event.image_urls?.length > 0 &&
          event.image_urls.map((url: string, index: number) => (
            <Pressable key={index} onPress={() => setImageModalUrl(url)}>
              <Image source={{ uri: url }} style={styles.cover} />
            </Pressable>
          ))}

        <Text style={styles.meta}>
          {event.date} • {event.start_time} • {event.location}
        </Text>

        <Text style={styles.desc}>{event.introduction}</Text>

        {/* STUDENT BUTTONS */}
        {role !== "organizer" && (
          <View style={{ marginTop: 16 }}>
            {!authed ? (
              <AppButton
                title="Login to Register"
                onPress={() => router.replace("/")}
              />
            ) : regStatusLoading ? (
              <AppButton title="Loading..." disabled />
            ) : registered ? (
              <AppButton
                title={regLoading ? "Cancelling..." : "Cancel Registration"}
                onPress={handleCancel}
                disabled={regLoading}
                color="#DC2626"
              />
            ) : (
              <AppButton
                title={regLoading ? "Registering..." : "Register Now"}
                onPress={handleRegister}
                disabled={regLoading}
                color="#2563eb"
              />
            )}
          </View>
        )}

        {/* ORGANIZER EDIT */}
        {role === "organizer" && (
          <View style={{ marginTop: 12 }}>
            <AppButton
              title="Edit Activity"
              onPress={() =>
                router.push({
                  pathname: "/organizer/create",
                  params: { mode: "edit", id },
                })
              }
            />
          </View>
        )}
      </ScrollView>

      <ImageModal
        visible={!!imageModalUrl}
        url={imageModalUrl}
        onClose={() => setImageModalUrl(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  cover: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#eee",
    marginBottom: 12,
  },
  meta: { color: "#666", marginTop: 8 },
  desc: { marginTop: 12, lineHeight: 20 },
});
