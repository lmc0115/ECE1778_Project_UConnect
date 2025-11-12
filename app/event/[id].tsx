import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, View, Button, Alert } from "react-native";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { selectEventById, registerForEvent } from "../../store/slices/eventsSlice";
import { selectIsAuthed, selectRole } from "../../store/slices/userSlice";
import * as Notifications from "expo-notifications";

export default function EventDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useAppSelector((s) => selectEventById(s, id));
  const authed = useAppSelector(selectIsAuthed);
  const role = useAppSelector(selectRole);
  const dispatch = useAppDispatch();
  const router = useRouter();

  if (!event) return <View style={{flex:1,alignItems:"center",justifyContent:"center"}}><Text>Event not found.</Text></View>;

  const onRegister = async () => {
    dispatch(registerForEvent(event.id));
    const start = new Date(`${event.date} ${event.time}`); // naive demo
    const trigger = new Date(start.getTime() - 30 * 60 * 1000);
    await Notifications.scheduleNotificationAsync({
      content: { title: "Event starting soon", body: event.title },
      trigger,
    });
    Alert.alert("Registered", "We’ll remind you 30 minutes before it starts.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.title}>{event.title}</Text>
      <Image source={{ uri: event.cover }} style={styles.cover} />
      <Text style={styles.meta}>{event.date} • {event.time} • {event.location}</Text>
      <Text style={styles.desc}>{event.description}</Text>

      <View style={{ marginTop: 16 }}>
        {authed ? (
          <Button title="Register Now" onPress={onRegister} />
        ) : (
          <Button title="Login to Register" onPress={() => router.replace("/")} />
        )}
      </View>

      {role === "organizer" && (
        <View style={{ marginTop: 12 }}>
          <Button title="Edit (Organizer)" onPress={() => alert("Editing flow to be added")} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  cover: { width: "100%", height: 180, borderRadius: 12, backgroundColor: "#eee" },
  meta: { color: "#666", marginTop: 8 },
  desc: { marginTop: 12, lineHeight: 20 },
});
