import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  Button,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadActivityImage, createActivity, updateActivity, fetchActivityById } from "../../lib/activities";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function CreateOrEditActivity() {
  const { mode, id } = useLocalSearchParams<{ mode: string; id: string }>();
  const editing = mode === "edit";

  const router = useRouter();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [intro, setIntro] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  /* ---------------------------------------------
          LOAD EXISTING ACTIVITY FOR EDIT
  ----------------------------------------------*/
  useEffect(() => {
    if (!editing || !id) return;

    (async () => {
      const activity = await fetchActivityById(id);

      if (!activity) return;

      setTitle(activity.title);
      setDate(activity.date);
      setStartTime(activity.start_time);
      setLocation(activity.location);
      setIntro(activity.introduction);
      setImages(activity.image_urls ?? []);
    })();
  }, [editing, id]);

  /* ---------------------------------------------
          PICK IMAGE
  ----------------------------------------------*/
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

  /* ---------------------------------------------
          REMOVE IMAGE
  ----------------------------------------------*/
  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((img) => img !== url));
  };

  /* ---------------------------------------------
          SUBMIT (CREATE or UPDATE)
  ----------------------------------------------*/
  const onSubmit = async () => {
    if (!title || !date || !startTime || !location || !intro) {
      Alert.alert("Missing info", "Please fill all fields.");
      return;
    }

    try {
      if (editing) {
        await updateActivity(id!, {
          title,
          date,
          start_time: startTime,
          location,
          introduction: intro,
          image_urls: images,
        });
        Alert.alert("Updated!", "Activity updated successfully.");
      } else {
        await createActivity({
          title,
          date,
          start_time: startTime,
          location,
          introduction: intro,
          image_urls: images,
        });
        Alert.alert("Created!", "Activity created successfully.");
      }

      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{editing ? "Edit Activity" : "Create Activity"}</Text>

      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <TextInput style={styles.input} placeholder="Start Time (HH:MM)" value={startTime} onChangeText={setStartTime} />
      <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />

      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Description"
        multiline
        value={intro}
        onChangeText={setIntro}
      />

      <Button title={uploading ? "Uploading..." : "Add Image"} onPress={onPickImage} disabled={uploading} />

      {images.map((url) => (
        <Image
          key={url}
          source={{ uri: url }}
          style={styles.image}
        />
      ))}

      {images.map((url) => (
        <Button key={url} title="Remove Image" color="red" onPress={() => removeImage(url)} />
      ))}

      <Button
        title={editing ? "Update Activity" : "Create Activity"}
        onPress={onSubmit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 },
  image: { width: "100%", height: 160, marginTop: 10, borderRadius: 8 },
});
