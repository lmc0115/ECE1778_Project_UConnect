import { useState } from "react";
import { Alert, Button, Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAppDispatch } from "../../store/hooks";
import { createEvent } from "../../store/slices/eventsSlice";
import { useRouter } from "expo-router";

export default function CreateEvent() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");     // e.g., 2025-11-20
  const [time, setTime] = useState("");     // e.g., 18:00
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled) setCover(res.assets[0].uri);
  };

  const onCreate = () => {
    if (!title || !date || !time) return Alert.alert("Missing", "Title, date, and time are required.");
    dispatch(createEvent({ title, date, time, description: content, cover: cover ?? "https://picsum.photos/600/400", location }));
    Alert.alert("Created", "Your event is live.");
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create New Activity</Text>

      <TextInput placeholder="Activity name *" value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput placeholder="Date (YYYY-MM-DD) *" value={date} onChangeText={setDate} style={styles.input} />
      <TextInput placeholder="Time (HH:mm) *" value={time} onChangeText={setTime} style={styles.input} />
      <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={styles.input} />
      <TextInput placeholder="Introduction / Content" value={content} onChangeText={setContent} multiline numberOfLines={5} style={[styles.input,{height:120,textAlignVertical:"top"}]} />

      <View style={{ marginVertical: 8 }}>
        <Button title="Upload Cover" onPress={pickImage} />
        {cover && <Image source={{ uri: cover }} style={{ width: "100%", height: 160, marginTop: 10, borderRadius: 12 }} />}
      </View>

      <Button title="Create" onPress={onCreate} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: "#fff", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#eee" },
});
