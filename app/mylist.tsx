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
  const theme = useAppSelector((state) => state.theme.theme);
  const isDark = theme === "dark";

  const router = useRouter();

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* -------------------------------------------------------
     Load My Activities (for student or organizer)
     fromPull = true  -> pull to refresh
     fromPull = false -> normal
  -------------------------------------------------------- */
  const loadMyActivities = useCallback(
    async (fromPull: boolean = false) => {
      try {
        if (fromPull) {
          setRefreshing(true);
        }

        // User not logged in
        if (!user) {
          setActivities([]);
          setLoading(false);
          if (fromPull) setRefreshing(false);
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
        if (fromPull) {
          setRefreshing(false);
        }
      }
    },
    [user, role]
  );

  /* -------------------------------------------------------
     Load on:
     - First load
     - Role change
     - User change
     - refreshFlag change
  -------------------------------------------------------- */
  useEffect(() => {
    loadMyActivities(false);
  }, [loadMyActivities, user, role, refreshFlag]);

  /* -------------------------------------------------------
     Also reload when returning to MyList
  -------------------------------------------------------- */
  useFocusEffect(
    useCallback(() => {
      loadMyActivities(false);
    }, [user, role, refreshFlag, loadMyActivities])
  );

  const headerTitle =
    role === "student" ? "My Registered Activities" : "My Activities";

  /* -------------------------------------------------------
     Loading state
  -------------------------------------------------------- */
  if (loading) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: isDark ? "#020617" : "#FFFFFF" },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? "#60A5FA" : "#2563eb"}
        />
        <Text
          style={[
            styles.loadingText,
            { color: isDark ? "#9CA3AF" : "#666666" },
          ]}
        >
          Loading...
        </Text>
      </View>
    );
  }

  /* -------------------------------------------------------
     Empty state
  -------------------------------------------------------- */
  if (!activities.length) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: isDark ? "#020617" : "#FFFFFF" },
        ]}
      >
        <Text
          style={[
            styles.emptyText,
            { color: isDark ? "#9CA3AF" : "#777777" },
          ]}
        >
          {role === "student"
            ? "You haven't registered for any activities yet."
            : "You haven't created any activities yet."}
        </Text>

        {/* Organizer create button */}
        {role === "organizer" && user && (
          <Pressable
            style={[
              styles.createBtn,
              { backgroundColor: isDark ? "#3B82F6" : "#2563eb" },
            ]}
            onPress={() => router.push("/organizer/create")}
          >
            <Text style={styles.createBtnText}>＋ Create New Activity</Text>
          </Pressable>
        )}
      </View>
    );
  }

  /* -------------------------------------------------------
     Render list
  -------------------------------------------------------- */
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#020617" : "#FFFFFF" },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: isDark ? "#E5E7EB" : "#111827" },
          ]}
        >
          {headerTitle}
        </Text>

        {role === "organizer" && user && (
          <Pressable
            style={[
              styles.createBtn,
              { backgroundColor: isDark ? "#3B82F6" : "#2563eb" },
            ]}
            onPress={() => router.push("/organizer/create")}
          >
            <Text style={styles.createBtnText}>＋ Create New Activity</Text>
          </Pressable>
        )}
      </View>

      {/* list area */}
      <FlatList
        style={styles.list}
        data={activities}
        keyExtractor={(a) => a.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMyActivities(true)}
            tintColor={isDark ? "#60A5FA" : "#2563eb"}
          />
        }
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ActivityCard
            item={item}
            onPress={() => router.push(`/event/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

/* -------------------------------------------------------
   Styles
-------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },

  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },

  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8 },
  emptyText: { fontSize: 16, textAlign: "center", padding: 20 },

  createBtn: {
    marginTop: 4,
    alignSelf: "stretch",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
