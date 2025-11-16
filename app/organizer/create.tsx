import { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  Button,
  Image,
  Alert,
  StyleSheet,
  View,
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

  return profiles
    .map((p) => p.expo_push_token)
    .filter((t) => Boolean(t));
}

async function getOrganizerToken(organizerId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("expo_push_token")
    .eq("id", organizerId)
    .maybeSingle();

  return data?.expo_push_token ?? null;
}

// Local reminder for organizer: 30 minutes before start time
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
    if (reminderTime.getTime() <= Date.now()) return;

    await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: { type: "date", date: reminderTime },
    });
}


export default function CreateOrEditActivity() {
  const { mode, id } = useLocalSearchParams<{ mode: string; id: string }>();
  const editing = mode === "edit";
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);

  const [initialData, setInitialData] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [intro, setIntro] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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
        setDate(activity.date);
        setStartTime(activity.start_time);
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
    setDate(initialData.date);
    setStartTime(initialData.start_time);
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

  /* SUBMIT */
  const onSubmit = async () => {
    if (!title || !date || !startTime || !location || !intro) {
      Alert.alert("Missing info", "Please fill all fields.");
      return;
    }

    try {
      if (editing) {
        /* -------------------------------------------------------
           UPDATE ACTIVITY
        --------------------------------------------------------- */
        await updateActivity(id!, {
          title,
          date,
          start_time: startTime,
          location,
          introduction: intro,
          image_urls: images,
        });

        dispatch(triggerRefresh());

        /* -------------------------------------------------------
           PUSH NOTIFICATION LOGIC
        --------------------------------------------------------- */
        // Notify organizer
        const organizerToken = await getOrganizerToken(initialData.organizer_id);
        if (organizerToken) {
          await sendPush(
            organizerToken,
            "Activity Updated",
            `You successfully modified "${title}".`
          );
        }

        // Notify all registered students
        const studentTokens = await getRegisteredStudentTokens(id!);
        for (const token of studentTokens) {
          await sendPush(
            token,
            "Activity Updated",
            `The activity "${title}" was modified. Please check the details.`
          );
        }

        Alert.alert("Updated!", "Activity updated successfully.");
      } else {
        /* -------------------------------------------------------
           CREATE NEW ACTIVITY
        --------------------------------------------------------- */
        await createActivity({
          title,
          date,
          start_time: startTime,
          location,
          introduction: intro,
          image_urls: images,
          organizer_id: user.id,
        });

        // Local notification for organizer: 30 minutes before start
        await scheduleLocalReminder(
          date,
          startTime,
          "Your activity is starting soon",
          title
        );

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

      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <TextInput style={styles.input} placeholder="Start Time (HH:MM)" value={startTime} onChangeText={setStartTime} />
      <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />

      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Description"
        value={intro}
        onChangeText={setIntro}
        multiline
      />

      <Button title={uploading ? "Uploading..." : "Add Image"} onPress={onPickImage} disabled={uploading} />

      {images.map((url) => (
        <Image key={url} source={{ uri: url }} style={styles.image} />
      ))}

      {images.map((url) => (
        <Button key={url + "_remove"} title="Remove Image" color="red" onPress={() => removeImage(url)} />
      ))}

      <Button title={editing ? "Update Activity" : "Create Activity"} onPress={onSubmit} />

      <View style={{ marginTop: 10 }}>
        <Button title="Cancel" color="#777" onPress={handleCancel} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingTop: 56, paddingHorizontal: 16, gap: 12 },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 },
  image: { width: "100%", height: 160, marginTop: 10, borderRadius: 8 },
});
