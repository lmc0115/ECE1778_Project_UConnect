import { Tabs } from "expo-router";
import { Provider } from "react-redux";
import { store } from "../store/store";
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";

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
  }, []);

  return (
    <Provider store={store}>
      <Tabs screenOptions={{ headerShown: false }} linking={linking}>
        <Tabs.Screen name="index" options={{ title: "Activity" }} />
        <Tabs.Screen name="mylist" options={{ title: "My List" }} />
        <Tabs.Screen name="account" options={{ title: "Account" }} />

        {/* The following pages can still be accessed via router.push(...) , but they will not appear on the bottom. */}

        {/* Reset password */}
        <Tabs.Screen
          name="reset-password"
          options={{
            href: null, 
          }}
        />

        {/* Calendar */}
        <Tabs.Screen
          name="calendar"
          options={{
            href: null,
          }}
        />

        {/* Organizer */}
        <Tabs.Screen
          name="organizer/create"
          options={{
            href: null,
          }}
        />

        {/* Event details */}
        <Tabs.Screen
          name="event/[id]"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </Provider>
  );
}
