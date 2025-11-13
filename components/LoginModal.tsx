import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  SafeAreaView,
} from "react-native";
import { useState } from "react";
import { useAppDispatch } from "../store/hooks";
import { loginUser, signupUser } from "../store/slices/userSlice";
import { supabase } from "../lib/supabase";


type Props = { visible: boolean; onClose: () => void };

export default function LoginModal({ visible, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [role, setRole] = useState<"student" | "organizer">("student");
  const dispatch = useAppDispatch();

  // ---- LOGIN ----
  const onLogin = async () => {
    if (!email || !pwd) {
      Alert.alert("Missing info", "Please enter both email and password.");
      return;
    }

    try {
      const result = await dispatch(loginUser({ email, password: pwd })).unwrap();
      console.log("Logged in:", result.user.email, "Role:", result.role);
      onClose();
    } catch (err: any) {
      const message = String(err).toLowerCase();

      if (message.includes("email not confirmed")) {
        Alert.alert(
          "Email not confirmed",
          "We’ve sent you a verification email. Please confirm your email before logging in.",
          [
            {
              text: "Resend Email",
              onPress: async () => {
                try {
                  await supabase.auth.resend({
                    type: "signup",
                    email,
                  });
                  Alert.alert("Email sent", "Check your inbox for the new confirmation link.");
                } catch (e: any) {
                  Alert.alert("Error", e.message);
                }
              },
            },
            { text: "OK" },
          ]
        );
      } else {
        Alert.alert("Login failed", String(err));
      }
    }
  };

  // ---- REGISTER ----
  const onRegister = async () => {
    if (!email || !pwd) {
      Alert.alert("Missing info", "Please enter both email and password.");
      return;
    }

    try {
      const result = await dispatch(signupUser({ email, password: pwd, role })).unwrap();
      console.log("Registered:", result.email, "Role:", role);

      Alert.alert(
        "Registration successful!",
        "We've sent a confirmation link to your email.\nPlease verify your account before logging in."
      );
      onClose();
    } catch (err: any) {
      Alert.alert("Sign-up failed", String(err));
    }
  };

  // ---- RESET PASSWORD ----
  const onResetPassword = () => {
    if (!email) {
      Alert.alert("Enter email", "Please enter your email first.");
      return;
    }

    supabase.auth
      .resetPasswordForEmail(email)
      .then(() =>
        Alert.alert(
          "Reset link sent",
          "Check your email for instructions to reset your password."
        )
      )
      .catch((err) => Alert.alert("Error", err.message));
  };

  // ---- CONTINUE AS GUEST ----
  const onContinueAsGuest = () => onClose();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <SafeAreaView style={styles.safeArea}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <Text style={styles.title}>Login</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Password"
            value={pwd}
            onChangeText={setPwd}
            style={styles.input}
            secureTextEntry
          />

          <View style={styles.roleRow}>
            <Pressable
              onPress={() => setRole("student")}
              style={[styles.roleChip, role === "student" && styles.roleChipActive]}
            >
              <Text
                style={[
                  styles.roleChipText,
                  role === "student" && styles.roleChipTextActive,
                ]}
              >
                Student
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRole("organizer")}
              style={[styles.roleChip, role === "organizer" && styles.roleChipActive]}
            >
              <Text
                style={[
                  styles.roleChipText,
                  role === "organizer" && styles.roleChipTextActive,
                ]}
              >
                Organizer
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.primaryButton} onPress={onLogin}>
            <Text style={styles.primaryButtonText}>Login</Text>
          </Pressable>

          <View style={styles.linkRow}>
            <Pressable onPress={onRegister}>
              <Text style={styles.linkText}>Register</Text>
            </Pressable>
            <View style={styles.linkDivider} />
            <Pressable onPress={onResetPassword}>
              <Text style={styles.linkText}>Reset password</Text>
            </Pressable>
          </View>

          <Pressable onPress={onContinueAsGuest} style={styles.ghostButton}>
            <Text style={styles.ghostButtonText}>Continue as guest</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: "center",
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  card: {
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    marginBottom: 10,
    fontSize: 14,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    alignItems: "center",
    marginHorizontal: 4,
    backgroundColor: "#ffffff",
  },
  roleChipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  roleChipText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  roleChipTextActive: {
    color: "#ffffff",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  linkText: {
    fontSize: 13,
    color: "#2563eb",
    textDecorationLine: "underline",
    paddingHorizontal: 4,
  },
  linkDivider: {
    width: 1,
    height: 12,
    backgroundColor: "#ddd",
    marginHorizontal: 4,
  },
  ghostButton: {
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e1e1e1",
    alignItems: "center",
  },
  ghostButtonText: {
    fontSize: 13,
    color: "#444",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
});