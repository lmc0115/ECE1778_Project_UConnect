import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  Pressable,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useAppSelector } from "../../store/hooks";
import { selectIsAuthed, selectRole } from "../../store/slices/userSlice";
import * as Notifications from "expo-notifications";
import ImageModal from "../../components/ImageModal"; // ⭐ ADD THIS

export default function EventDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null); // ⭐ NEW

  const authed = useAppSelector(selectIsAuthed);
  const role = useAppSelector(selectRole);
  const router = useRouter();

  // ---------------------------------------------------------------------------
  // Load activity data
  // ---------------------------------------------------------------------------
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

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text>Event not found.</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Register + Notification Reminder
  // ---------------------------------------------------------------------------
  const onRegister = async () => {
    const start = new Date(`${event.date} ${event.start_time}`);
    const trigger = new Date(start.getTime() - 30 * 60 * 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Event starting soon",
        body: event.title,
      },
      trigger,
    });

    Alert.alert("Registered", "We'll remind you 30 minutes before it starts.");
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{event.title}</Text>

        {/* ----------------------------------------------------
            IMAGE GALLERY - now opens modal (NO navigation)
        ----------------------------------------------------- */}
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

        {/* Register button */}
        <View style={{ marginTop: 16 }}>
          {authed ? (
            <Button title="Register Now" onPress={onRegister} />
          ) : (
            <Button
              title="Login to Register"
              onPress={() => router.replace("/")}
            />
          )}
        </View>

        {/* Organizer edit button */}
        {role === "organizer" && (
          <View style={{ marginTop: 12 }}>
            <Button
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

      {/* ----------------------------------------------------
          IMAGE MODAL (same style as LoginModal)
      ----------------------------------------------------- */}
      <ImageModal
        visible={!!imageModalUrl}
        url={imageModalUrl}
        onClose={() => setImageModalUrl(null)}
      />
    </>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
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
