import { Link, useRouter } from "expo-router";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppSelector } from "../store/hooks";
import LoginModal from "../components/LoginModal";
import { useState } from "react";
import { selectIsAuthed } from "../store/slices/userSlice";
import { selectEvents } from "../store/slices/eventsSlice";

export default function ActivityScreen() {
  const authed = useAppSelector(selectIsAuthed);
  const events = useAppSelector(selectEvents);
  const [showPrompt, setShowPrompt] = useState(!authed);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activity</Text>
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/event/${item.id}`)}>
            <Image source={{ uri: item.cover }} style={styles.cover} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.title}</Text>
              <Text style={styles.meta}>{item.date} • {item.time}</Text>
            </View>
          </Pressable>
        )}
      />
      {!authed && (
        <LoginModal visible={showPrompt} onClose={() => setShowPrompt(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  card: { flexDirection: "row", gap: 12, marginBottom: 12, backgroundColor: "#fff", borderRadius: 12, padding: 10, elevation: 1 },
  cover: { width: 88, height: 64, borderRadius: 8, backgroundColor: "#eee" },
  name: { fontSize: 16, fontWeight: "600" },
  meta: { color: "#666", marginTop: 4 },
});
