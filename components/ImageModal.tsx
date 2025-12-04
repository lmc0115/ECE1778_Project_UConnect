import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useState } from "react";
import * as MediaLibrary from "expo-media-library";

export default function ImageModal({ visible, url, onClose }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* const saveImage = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Needed", "Please allow gallery access to save images.");
        return;
      }

      setSaving(true);
      await MediaLibrary.createAssetAsync(url);
      setSaving(false);

      Alert.alert("Saved!", "Image saved to your gallery.");
    } catch (err) {
      setSaving(false);
      Alert.alert("Error", err.message);
    }
  }; */

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        
        {/* Close Button */}
        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        {/* Image */}
        <Image
          source={{ uri: url }}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />

        {loading && <ActivityIndicator size="large" color="#fff" />}

        {/* Save Button */}
        {/* <Pressable style={styles.saveBtn} onPress={saveImage}>
          <Text style={styles.saveText}>{saving ? "Saving..." : "Save Image"}</Text>
        </Pressable> */}

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },

  closeBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  closeText: {
    color: "#fff",
    fontSize: 24,
  },

  image: {
    width: "95%",
    height: "70%",
    marginBottom: 40,
  },

  saveBtn: {
    backgroundColor: "#1e90ff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
