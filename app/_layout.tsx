// app/_layout.tsx
import { Tabs } from "expo-router";
import { Provider } from "react-redux";
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";

import { store } from "../store/store";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setTheme } from "../store/slices/themeSlice";
import { loadTheme } from "../lib/themeStorage";


function ThemedTabs() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.theme);
  const isDark = theme === "dark";

  useEffect(() => {
    (async () => {
      const saved = await loadTheme();
      if (saved) {
        dispatch(setTheme(saved));
      }
    })();
  }, [dispatch]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#020617" : "#FFFFFF",
          borderTopColor: isDark ? "#1f2937" : "#e5e7eb",
        },
        tabBarActiveTintColor: isDark ? "#60A5FA" : "#2563eb",
        tabBarInactiveTintColor: isDark ? "#9CA3AF" : "#6B7280",
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
      }}
    >
      {/* Activity tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />

      {/* My List tab */}
      <Tabs.Screen
        name="mylist"
        options={{
          title: "My List",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Account tab */}
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reset-password"
        options={{
          href: null,
        }}
      />
      
      <Tabs.Screen
        name="event/[id]"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="organizer/create"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemedTabs />
    </Provider>
  );
}
