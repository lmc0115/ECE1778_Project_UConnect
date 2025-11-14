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
import { supabase } from "../lib/supabase";
import { useAppSelector } from "../store/hooks";
import { selectRole } from "../store/slices/userSlice";
import ActivityCard from "../components/ActivityCard";

export default function MyListScreen() {
  const role = useAppSelector(selectRole);
  const router = useRouter();

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ---------------------------------------------
     Load activities depending on role
  ---------------------------------------------- */
  const loadMyActivities = useCallback(async () => {
    try {
      setRefreshing(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setActivities([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let result = [];

      if (role === "student") {
        // ⭐ Fetch registered events
        const { data: regs, error } = await supabase
          .from("registrations")
          .select("activity_id")
          .eq("user_id", user.id);

        if (!error && regs.length > 0) {
          const ids = regs.map((r) => r.activity_id);

          const { data: acts } = await supabase
            .from("activities")
            .select("*")
            .in("id", ids)
            .order("date", { ascending: true });

          result = acts || [];
        }
      } else {
        // ⭐ Organizer: fetch own events
        const { data: acts } = await supabase
          .from("activities")
          .select("*")
          .eq("organizer_id", user.id)
          .order("date", { ascending: true });

        result = acts || [];
      }

      setActivities(result);
    } catch (err) {
      console.error("Failed to load MyList:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [role]);

  useEffect(() => {
    loadMyActivities();
  }, [loadMyActivities]);

  /* ---------------------------------------------
     Loading
  ---------------------------------------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  /* ---------------------------------------------
     Empty state
  ---------------------------------------------- */
  if (!activities.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          {role === "student"
            ? "You haven't registered for any activities yet."
            : "You haven't created any activities yet."}
        </Text>

        {role === "organizer" && (
          <Pressable onPress={() => router.push("/organizer/create")}>
            <Text style={styles.create}>＋ Create New Activity</Text>
          </Pressable>
        )}
      </View>
    );
  }

  /* ---------------------------------------------
     Render list (same as index)
  ---------------------------------------------- */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {role === "student" ? "My Registered Activities" : "My Activities"}
      </Text>

      <FlatList
        data={activities}
        keyExtractor={(a) => a.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadMyActivities} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <ActivityCard
            item={item}
            onPress={() => router.push(`/event/${item.id}`)}
          />
        )}
      />

      {role === "organizer" && (
        <Pressable
          style={styles.createBtn}
          onPress={() => router.push("/organizer/create")}
        >
          <Text style={styles.create}>＋ Create New Activity</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: "#666" },
  emptyText: { fontSize: 16, color: "#777", textAlign: "center", padding: 20 },
  create: { marginTop: 12, fontSize: 18, color: "#2563eb" },
  createBtn: { marginTop: 20, alignSelf: "center" },
});
