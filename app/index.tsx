// app/index.tsx
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
  const refreshFlag = useAppSelector(
    (state) => state.activityRefresh.refreshFlag
  );

  // Read current theme
  const theme = useAppSelector((state) => state.theme.theme);
  const isDark = theme === "dark";

  const [showPrompt, setShowPrompt] = useState(!authed);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  /* -----------------------------------------------------------
     FETCH ALL ACTIVITIES
  ----------------------------------------------------------- */
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

  /* -----------------------------------------------------------
     FIRST LOAD + REFRESH WHEN refreshFlag CHANGES
  ----------------------------------------------------------- */
  useEffect(() => {
    loadActivities();
  }, [loadActivities, refreshFlag]);

  /* -----------------------------------------------------------
     LOADING STATE
  ----------------------------------------------------------- */
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
            { color: isDark ? "#E5E7EB" : "#666666" },
          ]}
        >
          Loading activities...
        </Text>
      </View>
    );
  }

  /* -----------------------------------------------------------
     EMPTY STATE
  ----------------------------------------------------------- */
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
          No activities available yet.
        </Text>
        <Pressable onPress={loadActivities}>
          <Text
            style={[
              styles.retry,
              { color: isDark ? "#60A5FA" : "#2563eb" },
            ]}
          >
            ↻ Refresh
          </Text>
        </Pressable>

        {!authed && (
          <LoginModal
            visible={showPrompt}
            onClose={() => setShowPrompt(false)}
          />
        )}
      </View>
    );
  }

  /* -----------------------------------------------------------
     RENDER LIST
  ----------------------------------------------------------- */
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#020617" : "#FFFFFF" },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: isDark ? "#E5E7EB" : "#111827" },
        ]}
      >
        Activities
      </Text>

      <FlatList
        data={activities}
        keyExtractor={(a) => a.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadActivities}
            tintColor={isDark ? "#E5E7EB" : undefined}
          />
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
        <LoginModal
          visible={showPrompt}
          onClose={() => setShowPrompt(false)}
        />
      )}
    </View>
  );
}

/* -----------------------------------------------------------
   STYLES
----------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8 },
  emptyText: { fontSize: 16 },
  retry: {
    marginTop: 6,
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
