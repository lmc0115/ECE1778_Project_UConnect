import { FlatList, StyleSheet, Text, View, Button } from "react-native";
import { useAppSelector } from "../store/hooks";
import { selectIsAuthed, selectRole } from "../store/slices/userSlice";
import { selectRegisteredEvents, selectOrganizerEvents } from "../store/slices/eventsSlice";
import LoginModal from "../components/LoginModal";
import { useState } from "react";
import { useRouter } from "expo-router";

export default function MyList() {
  const authed = useAppSelector(selectIsAuthed);
  const role = useAppSelector(selectRole);
  const registered = useAppSelector(selectRegisteredEvents);
  const created = useAppSelector(selectOrganizerEvents);
  const [show, setShow] = useState(!authed);
  const router = useRouter();

  if (!authed) return <LoginModal visible={show} onClose={() => setShow(false)} />;

  const list = role === "organizer" ? created : registered;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My List</Text>
      {role === "organizer" && (
        <View style={{ marginBottom: 12 }}>
          <Button title="Create New" onPress={() => router.push("/organizer/create")} />
        </View>
      )}
      <FlatList
        data={list}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={{ fontWeight: "600" }}>{item.title}</Text>
            <Text style={{ color: "#666" }}>{item.date} • {item.time}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No items yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  item: { padding: 12, backgroundColor: "#fff", borderRadius: 12, marginBottom: 10 },
});
