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

export default function Account() {
  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectRole);
  const usernameInStore = useAppSelector(selectUsername);
  const avatarUrl = useAppSelector(selectAvatarUrl);

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
      const url = await uploadProfilePhoto(uri, user.id);

      await updateProfile(user.id, { avatar_url: url });
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
      Alert.alert("Error", err);
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
     UI
  -------------------------------------------------------------- */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>

      {!user && (
        <>
          <Pressable style={styles.button} onPress={() => setShowLogin(true)}>
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
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </View>

          {/* Info card */}
          <View style={styles.infoCard}>
            {/* Username + Edit */}
            <View style={styles.row}>
              <Text style={styles.label}>Username</Text>
              <Pressable onPress={() => setEditVisible(true)}>
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
            </View>
            <Text style={styles.currentValue}>{usernameInStore}</Text>

            {/* Email */}
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>

            {/* Role + badge */}
            <Text style={styles.infoLabel}>Role</Text>
            <View style={styles.roleRow}>
              <Text style={styles.infoValue}>{role}</Text>
              <View
                style={[
                  styles.roleChip,
                  role === "student"
                    ? styles.roleChipStudent
                    : styles.roleChipOrganizer,
                ]}
              >
                <Text style={styles.roleChipText}>
                  {role === "student" ? "Student" : "Organizer"}
                </Text>
              </View>
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
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>
        </>
      )}

      {/* ----------------------------------------------------------
          Username Edit Modal
      ----------------------------------------------------------- */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit Username</Text>

            <TextInput
              style={styles.input}
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder="Enter new username"
            />

            <Pressable
              style={[styles.button, { backgroundColor: "#2563eb" }]}
              onPress={saveUsername}
              disabled={saving}
            >
              <Text style={styles.buttonText}>
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.button, { backgroundColor: "#777" }]}
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
    color: "#2563eb",
  },

  infoCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
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
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "500",
  },

  currentValue: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
    marginTop: 4,
  },

  infoLabel: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 15,
    color: "#111827",
    marginBottom: 4,
  },

  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  roleChipStudent: {
    backgroundColor: "#16a34a",
  },
  roleChipOrganizer: {
    backgroundColor: "#2563eb",
  },
  roleChipText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },

  button: {
    backgroundColor: "#2563eb",
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
    color: "#2563eb",
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
    backgroundColor: "white",
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
