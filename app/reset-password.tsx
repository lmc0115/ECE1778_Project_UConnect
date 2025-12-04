import { View, Text, TextInput, Pressable, Alert, StyleSheet } from "react-native";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
import { useAppDispatch } from "../store/hooks";
import { logoutUser } from "../store/slices/userSlice";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleReset = async () => {
    if (!password.trim()) {
      return Alert.alert("Missing password", "Please enter a new password.");
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      // Sign out from Supabase and clear Redux user state
      await supabase.auth.signOut();
      dispatch(logoutUser());

      Alert.alert(
        "Success",
        "Your password has been reset. Please log in again with your new password.",
        [
          {
            text: "OK",
            onPress: () => {
              // Send them back to Account tab (where your login UI lives)
              router.replace("/account");
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to reset password.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>

      <TextInput
        style={styles.input}
        placeholder="New password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Save New Password</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
});
