// app/_layout.tsx
import { Tabs } from "expo-router";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { useEffect } from "react";
import { View } from "react-native";

import { setTheme } from "../store/slices/themeSlice";
import { loadTheme } from "../lib/themeStorage";
import { useAppSelector } from "../store/hooks";

// Deep linking config
const linking = {
  prefixes: ["uconnect://"],
  config: {
    screens: {
      index: "",
      mylist: "mylist",
      account: "account",
      resetPassword: "reset-password",
    },
  },
};

function TabsWithTheme() {
  const theme = useAppSelector((state) => state.theme.theme);
  const isDark = theme === "dark";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? "#020617" : "#FFFFFF",
      }}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? "#020617" : "#FFFFFF",
            borderTopColor: isDark ? "#1F2937" : "#E5E7EB",
          },
          tabBarActiveTintColor: isDark ? "#60A5FA" : "#2563eb",
          tabBarInactiveTintColor: isDark ? "#9CA3AF" : "#6B7280",
          sceneContainerStyle: {
            backgroundColor: isDark ? "#020617" : "#FFFFFF",
          },
        }}
        linking={linking}
      >
        <Tabs.Screen name="index" options={{ title: "Activity" }} />
        <Tabs.Screen name="mylist" options={{ title: "My List" }} />
        <Tabs.Screen name="account" options={{ title: "Account" }} />

        <Tabs.Screen
          name="reset-password"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="calendar"
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
        <Tabs.Screen
          name="event/[id]"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      const saved = await loadTheme();
      if (saved === "light" || saved === "dark") {
        store.dispatch(setTheme(saved));
      }
    })();
  }, []);

  return (
    <Provider store={store}>
      <TabsWithTheme />
    </Provider>
  );
}
