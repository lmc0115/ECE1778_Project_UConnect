import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
    // Solid primary button
    primaryButton: {
        backgroundColor: "#2563eb",
        borderRadius: 999,
        paddingVertical: 12,
        alignItems: "center",
    },
    primaryButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },

    // Outlined ghost button
    ghostButton: {
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "#d1d5db",
        alignItems: "center",
    },
    ghostButtonText: {
        fontSize: 14,
        color: "#444",
        fontWeight: "500",
    },
});