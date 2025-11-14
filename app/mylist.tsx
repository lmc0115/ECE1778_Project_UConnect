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
import { selectActivityRefreshFlag } from "../store/slices/activityRefreshSlice";

import ActivityCard from "../components/ActivityCard";
import { useFocusEffect } from "@react-navigation/native";

export default function MyListScreen() {
  const reduxRole = useAppSelector(selectRole);
  const reduxUser = useAppSelector(selectUser);
  const refreshFlag = useAppSelector(selectActivityRefreshFlag);

  const router = useRouter();

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ---------------------------------------------------------
      Always load REAL USER from supabase auth
  ---------------------------------------------------------- */
  const loadMyActivities = useCallback(async () => {
    try {
      setRefreshing(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("DEBUG → Real user =", user);

      if (!user) {
        setActivities([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // 🔥 REAL ROLE from Supabase metadata (never stale)
      const realRole = user.user_metadata?.role || reduxRole;

      console.log("DEBUG → REAL ROLE determined =", realRole);

      let result: any[] = [];

      /* ------------------------
         STUDENT LOGIC
      ------------------------- */
      if (realRole === "student") {
        const { data: regs, error: regErr } = await supabase
          .from("registrations")
          .select("activity_id")
          .eq("user_id", user.id);

        console.log("DEBUG → Student registrations =", regs);

        if (regs?.length > 0) {
          const ids = regs.map((r) => r.activity_id);

          const { data: acts } = await supabase
            .from("activities")
            .select("*")
            .in("id", ids)
            .order("date", { ascending: true });

          result = acts || [];
        }
      }

      /* ------------------------
         ORGANIZER LOGIC
      ------------------------- */
      else if (realRole === "organizer") {
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
  }, [reduxRole]);

  /* FIRST LOAD */
  useEffect(() => {
    loadMyActivities();
  }, []);

  /* REFRESH when:
     - user logs in/logs out
     - user switches accounts
     - role changes
     - details page triggers refreshFlag
  */
  useEffect(() => {
    loadMyActivities();
  }, [reduxUser, reduxRole, refreshFlag]);

  /* REFRESH when returning to this tab */
  useFocusEffect(
    useCallback(() => {
      loadMyActivities();
    }, [refreshFlag])
  );

  /* ------------------------------
        Loading UI
  ------------------------------*/
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  /* ------------------------------
        Empty UI
  ------------------------------*/
  if (!activities.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>
          {reduxRole === "student"
            ? "You haven't registered for any activities yet."
            : "You haven't created any activities yet."}
        </Text>

        {reduxRole === "organizer" && (
          <Pressable onPress={() => router.push("/organizer/create")}>
            <Text style={styles.create}>＋ Create New Activity</Text>
          </Pressable>
        )}
      </View>
    );
  }

  /* ------------------------------
        Render list
  ------------------------------*/
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {reduxRole === "student" ? "My Registered Activities" : "My Activities"}
      </Text>

      <FlatList
        data={activities}
        keyExtractor={(a) => a.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadMyActivities} />
        }
        contentContainerStyle={{ paddingBottom: 80 }} // space for button
        renderItem={({ item }) => (
          <ActivityCard
            item={item}
            onPress={() => router.push(`/event/${item.id}`)}
          />
        )}
        ListFooterComponent={
          reduxRole === "organizer" ? (
            <Pressable
              style={styles.createBtn}
              onPress={() => router.push("/organizer/create")}
            >
              <Text style={styles.create}>＋ Create New Activity</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 8, color: "#666" },
  emptyText: { fontSize: 16, color: "#777", textAlign: "center", padding: 20 },

  create: {
    marginTop: 12,
    fontSize: 18,
    color: "#2563eb",
    textAlign: "center",
  },
  createBtn: {
    marginTop: 20,
    marginBottom: 30,
    alignSelf: "center",
  },
});
