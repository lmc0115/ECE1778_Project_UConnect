import { Tabs } from "expo-router";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Set global notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true, // Added for Expo SDK 54 typing
  }),
});

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
    })();
  }, []);

  return (
    <Provider store={store}>
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: "Activity" }} />
        <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
        <Tabs.Screen name="mylist" options={{ title: "My List" }} />
        <Tabs.Screen name="account" options={{ title: "Account" }} />
      </Tabs>
    </Provider>
  );
}
