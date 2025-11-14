import { Pressable, Text, StyleSheet } from "react-native";

export default function AppButton({
  title,
  onPress,
  disabled,
  color = "#2563eb",
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: disabled ? "#9ca3af" : color },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
