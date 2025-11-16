import { Tabs } from "expo-router";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import * as Notifications from "expo-notifications";


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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // No notification logic — effect remains if you want to add other setup later.
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
