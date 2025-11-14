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
     Pick + Upload Profile Photo (same method as activity upload)
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
          {/* Avatar */}
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
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </Pressable>

          {/* Username Row */}
          <View style={styles.row}>
            <Text style={styles.label}>Username</Text>
            <Pressable onPress={() => setEditVisible(true)}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          </View>

          <Text style={styles.currentValue}>{usernameInStore}</Text>

          {/* Email + Role */}
          <Text style={styles.info}>Email: {user.email}</Text>
          <Text style={styles.info}>Role: {role}</Text>

          {/* Logout */}
          <Pressable
            style={[styles.button, { backgroundColor: "#DC2626" }]}
            onPress={onLogout}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </Pressable>

          <Pressable onPress={handleResetPassword}>
            <Text style={{ color: "#2563eb", marginTop: 10 }}>
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

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 80,
    alignSelf: "center",
    marginBottom: 6,
  },
  photoHint: {
    textAlign: "center",
    color: "#2563eb",
    marginBottom: 20,
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
    marginBottom: 20,
    marginTop: 4,
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
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },

  info: {
    marginTop: 6,
    fontSize: 15,
    color: "#444",
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
