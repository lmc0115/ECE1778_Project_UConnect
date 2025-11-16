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
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loginUser, signupUser } from "../store/slices/userSlice";
import { supabase } from "../lib/supabase";
import AppButton from "./AppButton";

type Props = { visible: boolean; onClose: () => void };

// Color const
const STUDENT_COLOR = "#16a34a";
const ORGANIZER_COLOR = "#2563eb";
const GUEST_COLOR = "#6b7280";

export default function LoginModal({ visible, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [role, setRole] = useState<"student" | "organizer">("student");
  const dispatch = useAppDispatch();

  // Read theme
  const theme = useAppSelector((state) => state.theme.theme);
  const isDark = theme === "dark";

  const primaryColor = role === "student" ? STUDENT_COLOR : ORGANIZER_COLOR;

  // ---- LOGIN ----
  const onLogin = async () => {
    if (!email || !pwd) {
      Alert.alert("Missing info", "Please enter both email and password.");
      return;
    }

    try {
      const result = await dispatch(
        loginUser({ email, password: pwd })
      ).unwrap();
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
                  Alert.alert(
                    "Email sent",
                    "Check your inbox for the new confirmation link."
                  );
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
      const result = await dispatch(
        signupUser({ email, password: pwd, role })
      ).unwrap();
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
        <Pressable
          style={[
            styles.backdrop,
            {
              backgroundColor: isDark
                ? "rgba(15,23,42,0.85)"
                : "rgba(0,0,0,0.35)",
            },
          ]}
          onPress={onClose}
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#020617" : "#ffffff",
              borderColor: isDark ? "#1f2937" : "#e5e7eb",
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              { color: isDark ? "#E5E7EB" : "#111827" },
            ]}
          >
            Login / Register
          </Text>

          {/* Role select area */}
          <View style={styles.roleRow}>
            <Pressable
              onPress={() => setRole("student")}
              style={[
                styles.roleChip,
                {
                  backgroundColor: isDark ? "#020617" : "#ffffff",
                  borderColor: isDark ? "#4B5563" : "#d0d0d0",
                },
                role === "student" && styles.roleChipStudentActive,
              ]}
            >
              <Text
                style={[
                  styles.roleChipText,
                  { color: isDark ? "#E5E7EB" : "#555" },
                  role === "student" && styles.roleChipTextActive,
                ]}
              >
                Student
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setRole("organizer")}
              style={[
                styles.roleChip,
                {
                  backgroundColor: isDark ? "#020617" : "#ffffff",
                  borderColor: isDark ? "#4B5563" : "#d0d0d0",
                },
                role === "organizer" && styles.roleChipOrganizerActive,
              ]}
            >
              <Text
                style={[
                  styles.roleChipText,
                  { color: isDark ? "#E5E7EB" : "#555" },
                  role === "organizer" && styles.roleChipTextActive,
                ]}
              >
                Organizer
              </Text>
            </Pressable>
          </View>
          <Text
            style={[
              styles.roleHint,
              { color: isDark ? "#9CA3AF" : "#6b7280" },
            ]}
          >
            Role will be locked for this email after registration.
          </Text>

          {/* input area */}
          <Text
            style={[
              styles.label,
              { color: isDark ? "#E5E7EB" : "#333" },
            ]}
          >
            Email
          </Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#020617" : "#f7f7f7",
                borderColor: isDark ? "#4B5563" : "#e1e1e1",
                color: isDark ? "#E5E7EB" : "#111827",
              },
            ]}
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text
            style={[
              styles.label,
              { color: isDark ? "#E5E7EB" : "#333" },
            ]}
          >
            Password
          </Text>
          <TextInput
            placeholder="Password"
            value={pwd}
            onChangeText={setPwd}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#020617" : "#f7f7f7",
                borderColor: isDark ? "#4B5563" : "#e1e1e1",
                color: isDark ? "#E5E7EB" : "#111827",
              },
            ]}
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            secureTextEntry
          />

          {/* The color changes with the role */}
          <AppButton title="Login" onPress={onLogin} color={primaryColor} />
          <AppButton
            title="Register"
            onPress={onRegister}
            color={primaryColor}
          />

          {/* Reset password */}
          <View style={styles.linkRow}>
            <Pressable onPress={onResetPassword}>
              <Text
                style={[
                  styles.linkText,
                  { color: isDark ? "#60A5FA" : "#2563eb" },
                ]}
              >
                Reset password
              </Text>
            </Pressable>
          </View>

          {/* Guest*/}
          <AppButton
            title="Continue as guest"
            onPress={onContinueAsGuest}
            color={GUEST_COLOR}
          />
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
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 10,
    fontSize: 14,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    marginHorizontal: 4,
  },

  // Different roles activate their respective styles.
  roleChipStudentActive: {
    backgroundColor: STUDENT_COLOR,
    borderColor: STUDENT_COLOR,
  },
  roleChipOrganizerActive: {
    backgroundColor: ORGANIZER_COLOR,
    borderColor: ORGANIZER_COLOR,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  roleChipTextActive: {
    color: "#ffffff",
  },
  roleHint: {
    fontSize: 11,
    marginBottom: 12,
    textAlign: "center",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  linkText: {
    fontSize: 13,
    textDecorationLine: "underline",
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
});
