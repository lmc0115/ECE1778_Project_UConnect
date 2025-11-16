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
import AppButton from "./AppButton";


type Props = { visible: boolean; onClose: () => void };

export default function LoginModal({ visible, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [role, setRole] = useState<"student" | "organizer">("student");
  const dispatch = useAppDispatch();
  const [registerMode, setRegisterMode] = useState(false);
  const [showRoleOptions, setShowRoleOptions] = useState(false);

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

  const onPressRegisterLink = () => {
    if (!registerMode) {
      // First click: just enter register mode and show role dropdown
      setRegisterMode(true);
    } else {
      // Already in register mode: perform actual registration
      onRegister();
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
          <Text style={styles.title}>
            {registerMode ? "Register" : "Login"}
          </Text>

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

          {registerMode && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Role</Text>
              <Pressable
                style={styles.input}
                onPress={() => setShowRoleOptions((prev) => !prev)}
              >
                <Text>{role === "student" ? "Student" : "Organizer"}</Text>
              </Pressable>

          {showRoleOptions && (
            <View style={styles.dropdown}>
              <Pressable
                style={styles.dropdownItem}
                onPress={() => {
                  setRole("student");
                  setShowRoleOptions(false);
                }}
              >
                <Text>Student</Text>
              </Pressable>
              <Pressable
                style={styles.dropdownItem}
                onPress={() => {
                  setRole("organizer");
                  setShowRoleOptions(false);
                }}
              >
                <Text>Organizer</Text>
              </Pressable>
            </View>
          )}
        </View>
  )}

          <AppButton
            title={registerMode ? "Register" : "Login"}
            onPress={registerMode ? onRegister : onLogin}
            disabled={false}
          />


          <View style={styles.linkRow}>
            <Pressable onPress={onPressRegisterLink}>
              <Text style={styles.linkText}>
                {registerMode ? "Login" : "Register"}
              </Text>

            </Pressable>
            <View style={styles.linkDivider} />
            <Pressable onPress={onResetPassword}>
              <Text style={styles.linkText}>Reset password</Text>
            </Pressable>
          </View>

          <AppButton
            title="Continue as guest"
            onPress={onContinueAsGuest}
            disabled={false}
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
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
