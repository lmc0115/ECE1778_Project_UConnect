import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectRole, selectUser, setRole, signOut } from "../store/slices/userSlice";
import { Button, StyleSheet, Text, View } from "react-native";

export default function Account() {
  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectRole);
  const dispatch = useAppDispatch();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text style={{ fontSize: 16, marginBottom: 6 }}>Email: {user?.email ?? "-"}</Text>
      <Text style={{ marginBottom: 12 }}>Role: <Text style={{ fontWeight: "700" }}>{role ?? "guest"}</Text></Text>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <Button title="Set Student" onPress={() => dispatch(setRole("student"))} />
        <Button title="Set Organizer" onPress={() => dispatch(setRole("organizer"))} />
      </View>

      <Button title="Sign Out" onPress={() => dispatch(signOut())} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
});
