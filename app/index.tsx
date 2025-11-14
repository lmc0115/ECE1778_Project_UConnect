import { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppSelector } from "../store/hooks";
import LoginModal from "../components/LoginModal";
import ActivityCard from "../components/ActivityCard";
import { fetchActivities } from "../lib/activities";
import { selectIsAuthed } from "../store/slices/userSlice";

export default function ActivityScreen() {
  const authed = useAppSelector(selectIsAuthed);
  const [showPrompt, setShowPrompt] = useState(!authed);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const refreshFlag = useAppSelector((state) => state.activityRefresh.refreshFlag);

  const router = useRouter();

  // --- Fetch activities from Supabase ---
  const loadActivities = useCallback(async () => {
    try {
      setRefreshing(true);
      const data = await fetchActivities();
      setActivities(data || []);
    } catch (err) {
      console.error("Failed to load activities:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities, refreshFlag]);

  // --- Loading state ---
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading activities...</Text>
      </View>
    );
  }

  // --- Empty state ---
  if (!activities.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No activities available yet.</Text>
        <Pressable onPress={loadActivities}>
          <Text style={styles.retry}>↻ Refresh</Text>
        </Pressable>
        {!authed && (
          <LoginModal visible={showPrompt} onClose={() => setShowPrompt(false)} />
        )}
      </View>
    );
  }

  // --- Render list ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activities</Text>

      <FlatList
        data={activities}
        keyExtractor={(a) => a.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadActivities} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <ActivityCard
            item={item}
            onPress={() => router.push(`/event/${item.id}`)}
          />
        )}
      />

      {!authed && (
        <LoginModal visible={showPrompt} onClose={() => setShowPrompt(false)} />
      )}
    </View>
  );
}

/* ---------------------------
   Styles
---------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: "#666" },
  emptyText: { fontSize: 16, color: "#777" },
  retry: {
    marginTop: 6,
    fontSize: 14,
    color: "#2563eb",
    textDecorationLine: "underline",
  },
});
