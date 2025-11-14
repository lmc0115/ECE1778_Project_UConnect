import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { selectRole, selectUser, logoutUser } from "../store/slices/userSlice";
import { Button, StyleSheet, Text, View } from "react-native";
import LoginModal from "../components/LoginModal";

export default function Account() {
  const user = useAppSelector(selectUser);
  const role = useAppSelector(selectRole);
  const dispatch = useAppDispatch();
  const [showLogin, setShowLogin] = useState(false);

  const onLogout = () => dispatch(logoutUser());

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account</Text>

      <Text style={{ fontSize: 16, marginBottom: 6 }}>
        Email: {user?.email ?? "-"}
      </Text>

      <Text style={{ marginBottom: 12 }}>
        Role:{" "}
        <Text style={{ fontWeight: "700" }}>
          {role ?? (user ? "unknown" : "guest")}
        </Text>
      </Text>

      {user ? (
        // Logged-in user: show sign-out
        <Button title="Sign Out" onPress={onLogout} />
      ) : (
        // Guest: show login/register button
        <Button title="Login / Register" onPress={() => setShowLogin(true)} />
      )}

      {/* Modal for guests */}
      <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
});
