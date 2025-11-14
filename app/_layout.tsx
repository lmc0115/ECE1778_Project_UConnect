import { Tabs } from "expo-router";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import * as Linking from "expo-linking";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
  }),
});

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
