import { SectionList, StyleSheet, Text, View } from "react-native";
import { useAppSelector } from "../store/hooks";
import { selectRegisteredEvents, selectOrganizerEvents } from "../store/slices/eventsSlice";
import { selectRole } from "../store/slices/userSlice";

export default function CalendarScreen() {
  const role = useAppSelector(selectRole);
  const list = useAppSelector(role === "organizer" ? selectOrganizerEvents : selectRegisteredEvents);

  // Group by date for a simple calendar-like list
  const sections = Object.values(
    list.reduce((acc: any, ev) => {
      acc[ev.date] = acc[ev.date] || { title: ev.date, data: [] };
      acc[ev.date].data.push(ev);
      return acc;
    }, {})
  ).sort((a: any, b: any) => a.title.localeCompare(b.title));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar</Text>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}><Text style={{fontWeight:"600"}}>{item.title}</Text><Text>{item.time} • {item.location}</Text></View>
        )}
        ListEmptyComponent={<Text>No events yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  section: { fontWeight: "700", marginTop: 8, marginBottom: 6 },
  item: { backgroundColor: "#fff", padding: 10, borderRadius: 12, marginBottom: 8 },
});
