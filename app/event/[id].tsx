import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { supabase } from "../../lib/supabase";
import { useAppSelector } from "../../store/hooks";
import {
  selectIsAuthed,
  selectRole,
  selectUser,
} from "../../store/slices/userSlice";
import * as Notifications from "expo-notifications";
import ImageModal from "../../components/ImageModal";
import AppButton from "../../components/AppButton";

import {
  isUserRegistered,
  registerForActivity,
  cancelRegistration,
} from "../../lib/activities";

export default function EventDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const authed = useAppSelector(selectIsAuthed);
  const role = useAppSelector(selectRole);
  const user = useAppSelector(selectUser);
  const router = useRouter();

  // registration state
  const [registered, setRegistered] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regStatusLoading, setRegStatusLoading] = useState(true);

  /* -------------------------------------------------------------
     LOAD EVENT DETAILS
  ------------------------------------------------------------- */
  useEffect(() => {
    if (!id) return;

    (async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("id", id)
        .single();

      if (!error) setEvent(data);
      setLoading(false);
    })();
  }, [id]);

  /* -------------------------------------------------------------
     CHECK IF USER IS REGISTERED
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
      } catch (err) {
        console.error("Failed to check registration:", err);
      } finally {
        setRegStatusLoading(false);
      }
    })();
  }, [id, authed, role]);

  /* -------------------------------------------------------------
     REGISTER
  ------------------------------------------------------------- */
  const handleRegister = async () => {
    if (!id) return;

    try {
      setRegLoading(true);

      const result = await registerForActivity(String(id));

      const start = new Date(`${event.date} ${event.start_time}`);
      const reminderTime = new Date(start.getTime() - 30 * 60 * 1000);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Event starting soon",
          body: event.title,
        },
        trigger: { type: "date", date: reminderTime },
      });

      if (result.alreadyRegistered) {
        Alert.alert("Already registered", "You already registered for this event.");
      } else {
        Alert.alert("Registered", "We’ll remind you before the event starts.");
      }

      setRegistered(true);
    } catch (err: any) {
      console.error("Register error:", err);
      Alert.alert("Error", err.message ?? "Failed to register.");
    } finally {
      setRegLoading(false);
    }
  };

  /* -------------------------------------------------------------
     CANCEL REGISTRATION
  ------------------------------------------------------------- */
  const handleCancel = async () => {
    if (!id) return;

    Alert.alert(
      "Cancel registration?",
      "You will no longer receive reminders.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Registration",
          style: "destructive",
          onPress: async () => {
            try {
              setRegLoading(true);
              await cancelRegistration(String(id));
              setRegistered(false);
              Alert.alert("Cancelled", "Registration removed.");
            } catch (err: any) {
              console.error("Cancel registration error:", err);
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
  if (!event) {
    return (
      <View style={styles.center}>
        <Text>Event not found.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
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

        {/* STUDENT REGISTER / CANCEL */}
        <View style={{ marginTop: 16 }}>
          {role !== "organizer" && (
            <>
              {authed ? (
                regStatusLoading ? (
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
                )
              ) : (
                <AppButton
                  title="Login to Register"
                  onPress={() => router.replace("/")}
                />
              )}
            </>
          )}
        </View>

        {/* ORGANIZER EDIT */}
        {role === "organizer" && (
          <View style={{ marginTop: 12 }}>
            <AppButton
              title="Edit Activity"
              onPress={() =>
                router.push({
                  pathname: "/organizer/create",
                  params: { edit: "1", id },
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

/* -------------------------------------------------------------
   STYLES
------------------------------------------------------------- */
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
