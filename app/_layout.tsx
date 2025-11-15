import { Tabs } from "expo-router";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";

// Notification handler (your existing config kept)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
  }),
});

// Deep linking config (kept exactly from your logic)
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

/* ============================================================
   Store Expo Push Token into Supabase "profiles" table
============================================================ */
async function saveExpoPushToken() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const expoPushToken = tokenData.data;

  await supabase
    .from("profiles")
    .update({ expo_push_token: expoPushToken })
    .eq("id", user.id);
}

/* ============================================================
   Root Layout
============================================================ */
export default function RootLayout() {
  useEffect(() => {
    (async () => {
      // 1 — Request notification permissions
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }

      // 2 — Android channel setup
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      // 3 — Save Expo push token to Supabase whenever user logs in
      saveExpoPushToken();
    })();
  }, []);

  return (
    <Provider store={store}>
      <Tabs screenOptions={{ headerShown: false }} linking={linking}>
        <Tabs.Screen name="index" options={{ title: "Activity" }} />
        <Tabs.Screen name="mylist" options={{ title: "My List" }} />
        <Tabs.Screen name="account" options={{ title: "Account" }} />
        <Tabs.Screen
          name="reset-password"
          options={{ title: "Reset Password", href: "/reset-password" }}
        />
      </Tabs>
    </Provider>
  );
}
