// app/mylist.tsx
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
import { selectRole, selectUser } from "../store/slices/userSlice";
import ActivityCard from "../components/ActivityCard";
import { useFocusEffect } from "@react-navigation/native";

export default function MyListScreen() {
  const role = useAppSelector(selectRole);
  const user = useAppSelector(selectUser);
  const refreshFlag = useAppSelector(
    (state) => state.activityRefresh.refreshFlag
  );

  const router = useRouter();

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* -------------------------------------------------------
     Load My Activities (for student or organizer)
  -------------------------------------------------------- */
  const loadMyActivities = useCallback(async () => {
    try {
      setRefreshing(true);

      // User not logged in
      if (!user) {
        setActivities([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      let result: any[] = [];

      if (role === "student") {
        // Fetch registered event IDs
        const { data: regs } = await supabase
          .from("registrations")
          .select("activity_id")
          .eq("user_id", user.id);

        if (regs?.length) {
          const ids = regs.map((r) => r.activity_id);

          const { data: acts } = await supabase
            .from("activities")
            .select("*")
            .in("id", ids)
            .order("date", { ascending: true });

          result = acts || [];
        }
      } else if (role === "organizer") {
        // Fetch organizer-created events
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
  }, [user, role]);

  /* -------------------------------------------------------
     Load on:
     - First load
     - Role change
     - User change
     - refreshFlag change
  -------------------------------------------------------- */
  useEffect(() => {
    loadMyActivities();
  }, [loadMyActivities, user, role, refreshFlag]);

  /* -------------------------------------------------------
     Also reload when returning to MyList
  -------------------------------------------------------- */
  useFocusEffect(
    useCallback(() => {
      loadMyActivities();
    }, [user, role, refreshFlag])
  );

  /* -------------------------------------------------------
     Loading state
  -------------------------------------------------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  /* -------------------------------------------------------
     Empty state
  -------------------------------------------------------- */
  if (!activities.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          {role === "student"
            ? "You haven't registered for any activities yet."
            : "You haven't created any activities yet."}
        </Text>

        {/* Organizer create button */}
        {role === "organizer" && user && (
          <Pressable onPress={() => router.push("/organizer/create")}>
            <Text style={styles.create}>＋ Create New Activity</Text>
          </Pressable>
        )}
      </View>
    );
  }

  /* -------------------------------------------------------
     Render list
  -------------------------------------------------------- */
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

      {/* Organizer create button */}
      {role === "organizer" && user && (
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

/* -------------------------------------------------------
   Styles
-------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: "#666" },
  emptyText: { fontSize: 16, color: "#777", textAlign: "center", padding: 20 },

  create: { marginTop: 12, fontSize: 18, color: "#2563eb" },
  createBtn: { marginTop: 20, alignSelf: "center" },
});
