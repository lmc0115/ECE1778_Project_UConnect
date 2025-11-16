import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAppDispatch, useAppSelector } from "../store/hooks";

import {
  selectUser,
  selectRole,
  selectUsername,
  selectAvatarUrl,
  logoutUser,
  updateUsername,
  updateAvatarUrl,
} from "../store/slices/userSlice";

import LoginModal from "../components/LoginModal";
import { uploadProfilePhoto, updateProfile } from "../lib/profile";
import { supabase } from "lib/supabase";
import { toggleTheme } from "../store/slices/themeSlice";

export default function Account() {
  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectRole);
  const usernameInStore = useAppSelector(selectUsername);
  const avatarUrl = useAppSelector(selectAvatarUrl);

  const theme = useAppSelector((state) => state.theme.theme);
  const isDark = theme === "dark";

  const dispatch = useAppDispatch();

  const [showLogin, setShowLogin] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [usernameInput, setUsernameInput] = useState(usernameInStore);

  const onLogout = () => dispatch(logoutUser());

  /* --------------------------------------------------------------
     Pick + Upload Profile Photo
  -------------------------------------------------------------- */
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.9,
      mediaTypes: ["images"],
    });

    if (result.canceled) return;

    try {
      setSaving(true);

      const uri = result.assets[0].uri;
      const url = await uploadProfilePhoto(uri, user!.id);

      await updateProfile(user!.id, { avatar_url: url });
      dispatch(updateAvatarUrl(url));

      Alert.alert("Success", "Profile photo updated.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------------------------------------
     Save username (from modal)
  -------------------------------------------------------------- */
  const saveUsername = async () => {
    if (!usernameInput.trim()) return Alert.alert("Username required");

    try {
      setSaving(true);
      await dispatch(updateUsername(usernameInput)).unwrap();
      setEditVisible(false);
      Alert.alert("Updated", "Username saved.");
    } catch (err: any) {
      Alert.alert("Error", String(err));
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------------------------------------
     RESET PASSWORD (send email)
  -------------------------------------------------------------- */
  const handleResetPassword = async () => {
    if (!user?.email) {
      Alert.alert("Missing email", "You must be logged in.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: "uconnect://reset-password",
      });

      if (error) throw error;

      Alert.alert(
        "Check your email",
        "We sent a password reset link to your inbox."
      );
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  /* --------------------------------------------------------------
     Theme colors
  -------------------------------------------------------------- */
  const bgColor = isDark ? "#020617" : "#F9FAFB";
  const cardBg = isDark ? "#0B1120" : "#FFFFFF";
  const mainText = isDark ? "#F9FAFB" : "#111827";
  const secondaryText = isDark ? "#9CA3AF" : "#6B7280";
  const hintBlue = "#2563eb";
  const borderColor = isDark ? "#1F2937" : "#E5E7EB";

  const onToggleTheme = () => {
    dispatch(toggleTheme());
  };

  const themeDisplay = isDark ? "Dark" : "Light";
  const themeButtonLabel = isDark
    ? "Click to switch to Light"
    : "Click to switch to Dark";

  /* --------------------------------------------------------------
     UI
  -------------------------------------------------------------- */
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Text style={[styles.title, { color: mainText }]}>Account</Text>

      {!user && (
        <>
          <Pressable
            style={[
              styles.button,
              { backgroundColor: hintBlue, marginTop: 8 },
            ]}
            onPress={() => setShowLogin(true)}
          >
            <Text style={styles.buttonText}>Login / Register</Text>
          </Pressable>

          <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} />
        </>
      )}

      {user && (
        <>
          {/* Avatar & photo hint */}
          <View style={styles.profileHeader}>
            <Pressable onPress={pickPhoto} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="large" style={{ marginBottom: 10 }} />
              ) : (
                <Image
                  source={{
                    uri:
                      avatarUrl ||
                      "https://img.icons8.com/ios-filled/200/user.png",
                  }}
                  style={styles.avatar}
                />
              )}
            </Pressable>
            <Text style={[styles.photoHint, { color: hintBlue }]}>
              Tap to change photo
            </Text>
          </View>

          {/* Info card */}
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: cardBg,
                borderColor,
                borderWidth: isDark ? 1 : 0,
                shadowOpacity: isDark ? 0 : 0.05,
              },
            ]}
          >
            {/* Username + Edit */}
            <View style={styles.row}>
              <Text style={[styles.label, { color: mainText }]}>Username</Text>
              <Pressable onPress={() => setEditVisible(true)}>
                <Text style={[styles.editText, { color: hintBlue }]}>Edit</Text>
              </Pressable>
            </View>
            <Text style={[styles.currentValue, { color: mainText }]}>
              {usernameInStore}
            </Text>

            {/* Email */}
            <Text style={[styles.infoLabel, { color: secondaryText }]}>
              Email
            </Text>
            <Text style={[styles.infoValue, { color: mainText }]}>
              {user.email}
            </Text>

            {/* Role */}
            <Text style={[styles.infoLabel, { color: secondaryText }]}>
              Role
            </Text>
            <Text style={[styles.infoValue, { color: mainText }]}>{role}</Text>

            {/* Theme */}
            <Text
              style={[
                styles.infoLabel,
                { color: secondaryText, marginTop: 12 },
              ]}
            >
              Theme
            </Text>
            <View style={styles.themeRow}>
              <Text style={[styles.infoValue, { color: mainText }]}>
                {themeDisplay}
              </Text>

              <Pressable
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: isDark ? "#4B5563" : "#111827",
                  },
                ]}
                onPress={onToggleTheme}
              >
                <Text style={styles.themeButtonText}>{themeButtonLabel}</Text>
              </Pressable>
            </View>
          </View>

          {/* Logout */}
          <Pressable
            style={[styles.button, styles.logoutButton]}
            onPress={onLogout}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </Pressable>

          <Pressable onPress={handleResetPassword}>
            <Text
              style={[
                styles.forgotText,
                { color: hintBlue, textAlign: "center" },
              ]}
            >
              Forgot Password?
            </Text>
          </Pressable>
        </>
      )}

      {/* ----------------------------------------------------------
          Username Edit Modal
      ----------------------------------------------------------- */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: cardBg, borderColor, borderWidth: 1 },
            ]}
          >
            <Text style={[styles.modalTitle, { color: mainText }]}>
              Edit Username
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#020617" : "#FFFFFF",
                  color: mainText,
                  borderColor,
                },
              ]}
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder="Enter new username"
              placeholderTextColor={secondaryText}
            />

            <Pressable
              style={[
                styles.button,
                { backgroundColor: hintBlue, marginTop: 0 },
              ]}
              onPress={saveUsername}
              disabled={saving}
            >
              <Text style={styles.buttonText}>
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                { backgroundColor: "#6B7280", marginTop: 12 },
              ]}
              onPress={() => setEditVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* --------------------------------------------------------------
   STYLES
-------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },

  profileHeader: {
    alignItems: "center",
    marginBottom: 12,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 80,
    marginBottom: 6,
  },
  photoHint: {
    textAlign: "center",
  },

  infoCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  editText: {
    fontSize: 14,
    fontWeight: "500",
  },

  currentValue: {
    fontSize: 16,
    marginBottom: 12,
    marginTop: 4,
  },

  infoLabel: {
    marginTop: 4,
    fontSize: 13,
  },
  infoValue: {
    fontSize: 15,
    marginBottom: 4,
  },

  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    gap: 8,
  },
  themeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  themeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },

  button: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 999,
    marginTop: 16,
  },
  logoutButton: {
    backgroundColor: "#DC2626",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },

  forgotText: {
    marginTop: 10,
    fontSize: 14,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalBox: {
    borderRadius: 12,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
});
