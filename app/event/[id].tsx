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

import LoginModal from "../../components/LoginModal";

const formatTime = (t?: string | null) => {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
};

export default function EventDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);

  const authed = useAppSelector(selectIsAuthed);
  const role = useAppSelector(selectRole);
  const user = useAppSelector(selectUser);
  const theme = useAppSelector((state) => state.theme.theme);
  const isDark = theme === "dark";

  const router = useRouter();

  const [registered, setRegistered] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regStatusLoading, setRegStatusLoading] = useState(true);

  const [loginVisible, setLoginVisible] = useState(false);

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
     REGISTER
  ------------------------------------------------------------- */
  const handleRegister = async () => {
    if (!id || !event) return;

    try {
      setRegLoading(true);

      const result = await registerForActivity(String(id));

      Alert.alert(
        result.alreadyRegistered ? "Already registered" : "Registered",
        result.alreadyRegistered
          ? "You already registered for this event."
          : "Registration successful."
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
     CANCEL REGISTRATION
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
      <View
        style={[
          styles.center,
          { backgroundColor: isDark ? "#020617" : "#FFFFFF" },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? "#60A5FA" : "#2563eb"}
        />
        <Text
          style={{
            marginTop: 10,
            color: isDark ? "#E5E7EB" : "#111827",
          }}
        >
          Loading event...
        </Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#020617" : "#FFFFFF" },
        ]}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text
          style={[
            styles.title,
            { color: isDark ? "#E5E7EB" : "#111827" },
          ]}
        >
          {event.title}
        </Text>

        {event.image_urls?.length > 0 &&
          event.image_urls.map((url: string, index: number) => (
            <Pressable key={index} onPress={() => setImageModalUrl(url)}>
              <Image
                source={{ uri: url }}
                style={[
                  styles.cover,
                  { backgroundColor: isDark ? "#111827" : "#eeeeee" },
                ]}
              />
            </Pressable>
          ))}

        <Text
          style={[
            styles.meta,
            { color: isDark ? "#9CA3AF" : "#666666" },
          ]}
        >
          {event.date}
          {event.start_time ? ` • ${formatTime(event.start_time)}` : ""}
          {event.location ? ` • ${event.location}` : ""}
        </Text>

        <Text
          style={[
            styles.desc,
            { color: isDark ? "#D1D5DB" : "#111827" },
          ]}
        >
          {event.introduction}
        </Text>

        {/* STUDENT BUTTONS */}
        {role !== "organizer" && (
          <View style={{ marginTop: 16 }}>
            {!authed ? (
              <AppButton
                title="Login to Register"
                onPress={() => setLoginVisible(true)}
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

      <LoginModal
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
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
    marginBottom: 12,
  },
  meta: { marginTop: 8 },
  desc: { marginTop: 12, lineHeight: 20 },
});
