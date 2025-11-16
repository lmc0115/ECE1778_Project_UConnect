import { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  Image,
  Alert,
  StyleSheet,
  View,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  uploadActivityImage,
  createActivity,
  updateActivity,
  fetchActivityById,
} from "../../lib/activities";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { triggerRefresh } from "../../store/slices/activityRefreshSlice";
import * as Notifications from "expo-notifications";
import { supabase } from "../../lib/supabase";

import DateTimePicker from "@react-native-community/datetimepicker";
import AppButton from "../../components/AppButton";

/* -------------------------------------------------------------
   Helper: Push notification sender
------------------------------------------------------------- */
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

/* -------------------------------------------------------------
   Fetch tokens: organizer + all students
------------------------------------------------------------- */
async function getRegisteredStudentTokens(activityId: string) {
  const { data: regs } = await supabase
    .from("registrations")
    .select("user_id")
    .eq("activity_id", activityId);

  if (!regs || regs.length === 0) return [];

  const ids = regs.map((r) => r.user_id);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("expo_push_token")
    .in("id", ids);

  return profiles.map((p) => p.expo_push_token).filter((t) => Boolean(t));
}

async function getOrganizerToken(organizerId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("expo_push_token")
    .eq("id", organizerId)
    .maybeSingle();

  return data?.expo_push_token ?? null;
}

function parseDateString(dateStr?: string | null) {
  if (!dateStr) return new Date();
  const parts = dateStr.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

export default function CreateOrEditActivity() {
  const { mode, id } = useLocalSearchParams<{ mode: string; id: string }>();
  const editing = mode === "edit";
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);

  const [initialData, setInitialData] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");       // YYYY-MM-DD
  const [startTime, setStartTime] = useState(""); // HH:MM
  const [location, setLocation] = useState("");
  const [intro, setIntro] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Date/Time Selector
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  /* -------------------------------------------------------
      LOAD ACTIVITY DATA ON FOCUS (EDIT MODE)
  --------------------------------------------------------- */
  useFocusEffect(
    useCallback(() => {
      if (!editing || !id) {
        // reset when switching from edit → create
        setInitialData(null);
        setTitle("");
        setDate("");
        setStartTime("");
        setLocation("");
        setIntro("");
        setImages([]);
        return;
      }

      const loadData = async () => {
        const activity = await fetchActivityById(id);
        if (!activity) return;

        setInitialData(activity);
        setTitle(activity.title);
        setDate(activity.date || "");
        const rawTime = activity.start_time || "";
        setStartTime(rawTime.length >= 5 ? rawTime.slice(0, 5) : rawTime);
        setLocation(activity.location);
        setIntro(activity.introduction);
        setImages(activity.image_urls ?? []);
      };

      loadData();
    }, [editing, id])
  );

  /* RESET FORM */
  const resetFormToInitial = () => {
    if (!initialData) return;
    setTitle(initialData.title);
    setDate(initialData.date || "");
    const rawTime = initialData.start_time || "";
    setStartTime(rawTime.length >= 5 ? rawTime.slice(0, 5) : rawTime);
    setLocation(initialData.location);
    setIntro(initialData.introduction);
    setImages(initialData.image_urls ?? []);
  };

  const handleCancel = () => {
    resetFormToInitial();
    router.back();
  };

  /* PICK IMAGE */
  const onPickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (result.canceled) return;

    setUploading(true);
    const url = await uploadActivityImage(result.assets[0].uri);
    setUploading(false);

    if (url) setImages((prev) => [...prev, url]);
  };

  /* REMOVE IMAGE */
  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((img) => img !== url));
  };

  /* -------------------------------------------------------
      DATE / TIME PICKER HANDLERS
  --------------------------------------------------------- */
  const handleDateChange = (event: any, selected?: Date) => {
    if (Platform.OS === "android") {
      if (event?.type === "dismissed") {
        setShowDatePicker(false);
        return;
      }
      setShowDatePicker(false);
    }
    if (!selected) return;

    const yyyy = selected.getFullYear();
    const mm = String(selected.getMonth() + 1).padStart(2, "0");
    const dd = String(selected.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleTimeChange = (event: any, selected?: Date) => {
    if (Platform.OS === "android") {
      if (event?.type === "dismissed") {
        setShowTimePicker(false);
        return;
      }
      setShowTimePicker(false);
    }
    if (!selected) return;

    const hh = String(selected.getHours()).padStart(2, "0");
    const mm = String(selected.getMinutes()).padStart(2, "0");
    setStartTime(`${hh}:${mm}`);
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const openTimePicker = () => {
    setShowTimePicker(true);
  };

  /* SUBMIT */
  const onSubmit = async () => {
    if (!title || !date || !startTime || !location || !intro) {
      Alert.alert("Missing info", "Please fill all fields.");
      return;
    }

    const startTimeForDb =
      startTime.length === 5 ? `${startTime}:00` : startTime;

    try {
      if (editing) {
        await updateActivity(id!, {
          title,
          date,
          start_time: startTimeForDb,
          location,
          introduction: intro,
          image_urls: images,
        });

        dispatch(triggerRefresh());

        const organizerToken = await getOrganizerToken(initialData.organizer_id);
        if (organizerToken) {
          await sendPush(
            organizerToken,
            "Activity Updated",
            `You successfully updated "${title}".`
          );
        }

        const studentTokens = await getRegisteredStudentTokens(id!);
        for (const token of studentTokens) {
          await sendPush(
            token,
            "Activity Updated",
            `The activity "${title}" was updated. Please check the details.`
          );
        }

        Alert.alert("Updated!", "Activity updated successfully.");
      } else {
        await createActivity({
          title,
          date,
          start_time: startTimeForDb,
          location,
          introduction: intro,
          image_urls: images,
          organizer_id: user.id,
        });

        dispatch(triggerRefresh());
        Alert.alert("Created!", "Activity created successfully.");
      }

      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>
        {editing ? "Edit Activity" : "Create Activity"}
      </Text>

      {/* Title */}
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />

      {/* Date (picker) */}
      <Pressable onPress={openDatePicker} style={styles.inputPressable}>
        <TextInput
          style={styles.inputInner}
          placeholder="Date (YYYY-MM-DD)"
          value={date}
          editable={false}
          pointerEvents="none"
        />
      </Pressable>

      {/* Time (picker) */}
      <Pressable onPress={openTimePicker} style={styles.inputPressable}>
        <TextInput
          style={styles.inputInner}
          placeholder="Start Time (HH:MM)"
          value={startTime}
          editable={false}
          pointerEvents="none"
        />
      </Pressable>

      {/* Location */}
      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />

      {/* Description */}
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Description"
        value={intro}
        onChangeText={setIntro}
        multiline
      />

      {/* Add Image */}
      <AppButton
        title={uploading ? "Uploading..." : "Add Image"}
        onPress={onPickImage}
        disabled={uploading}
      />

      {/* Images with overlay delete */}
      {images.map((url) => (
        <View key={url} style={styles.imageWrapper}>
          <Image source={{ uri: url }} style={styles.image} />
          <Pressable
            style={styles.imageDeleteBtn}
            onPress={() => removeImage(url)}
          >
            <Text style={styles.imageDeleteText}>×</Text>
          </Pressable>
        </View>
      ))}

      {/* Submit */}
      <View style={{ marginTop: 16 }}>
        <AppButton
          title={editing ? "Update Activity" : "Create Activity"}
          onPress={onSubmit}
        />
      </View>

      {/* Cancel */}
      <View style={{ marginTop: 8 }}>
        <AppButton title="Cancel" onPress={handleCancel} color="#9CA3AF" />
      </View>

      {/* iOS: Own mask + spinner Android: System pop-up window */}
      {Platform.OS === "ios" && showDatePicker && (
        <Modal transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.pickerBox}>
              <DateTimePicker
                mode="date"
                display="spinner"
                value={parseDateString(date)}
                onChange={handleDateChange}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      {Platform.OS === "ios" && showTimePicker && (
        <Modal transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowTimePicker(false)}
          >
            <View style={styles.pickerBox}>
              <DateTimePicker
                mode="time"
                display="spinner"
                value={
                  startTime
                    ? (() => {
                        const [h, m] = startTime.split(":");
                        const d = new Date();
                        d.setHours(Number(h) || 0, Number(m) || 0, 0, 0);
                        return d;
                      })()
                    : new Date()
                }
                onChange={handleTimeChange}
              />
            </View>
          </Pressable>
        </Modal>
      )}

      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          mode="date"
          value={parseDateString(date)}
          onChange={handleDateChange}
        />
      )}

      {Platform.OS === "android" && showTimePicker && (
        <DateTimePicker
          mode="time"
          value={new Date()}
          onChange={handleTimeChange}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
    gap: 12,
  },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 12 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
  },

  inputPressable: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  inputInner: {
    padding: 10,
  },

  imageWrapper: {
    marginTop: 10,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: 160,
  },
  imageDeleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  imageDeleteText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  pickerBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
  },
});
