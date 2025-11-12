import { Modal, Pressable, StyleSheet, Text, TextInput, View, Button } from "react-native";
import { useState } from "react";
import { useAppDispatch } from "../store/hooks";
import { signIn } from "../store/slices/userSlice";

type Props = { visible: boolean; onClose: () => void };

export default function LoginModal({ visible, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [role, setRole] = useState<"student" | "organizer">("student");
  const dispatch = useAppDispatch();

  const onLogin = async () => {
    // In production, call Supabase Auth here.
    dispatch(signIn({ email, role }));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" />
        <TextInput placeholder="Password" value={pwd} onChangeText={setPwd} style={styles.input} secureTextEntry />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
          <Button title="Student" onPress={() => setRole("student")} />
          <Button title="Organizer" onPress={() => setRole("organizer")} />
        </View>
        <Button title="Login" onPress={onLogin} />
        <Pressable onPress={onClose} style={{ marginTop: 10 }}><Text style={{ textAlign: "center" }}>Close</Text></Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.35)" },
  card: { position: "absolute", top: "25%", left: 16, right: 16, backgroundColor: "#fff", borderRadius: 16, padding: 16, elevation: 3 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: "#fff", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#eee", marginBottom: 8 },
});
