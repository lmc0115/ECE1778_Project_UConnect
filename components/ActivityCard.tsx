import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useAppSelector } from "../store/hooks";

type Props = {
  item: {
    id: string;
    title: string;
    date: string;
    start_time?: string;
    location?: string;
    introduction?: string;
    image_urls?: string[];
  };
  onPress?: () => void;
  compact?: boolean; // optional for smaller layout variants
};

const formatTime = (t?: string) => {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
};

export default function ActivityCard({ item, onPress, compact = false }: Props) {
  const theme = useAppSelector((state) => state.theme.theme);
  const isDark = theme === "dark";

  const mainTextColor = isDark ? "#E5E7EB" : "#111827";
  const secondaryTextColor = isDark ? "#9CA3AF" : "#666666";
  const locationColor = isDark ? "#D1D5DB" : "#444444";
  const introColor = isDark ? "#9CA3AF" : "#555555";

  return (
    <Pressable
      style={[
        styles.card,
        compact && styles.cardCompact,
        {
          backgroundColor: isDark ? "#020617" : "#FFFFFF",
          borderColor: isDark ? "#374151" : "transparent",
          borderWidth: isDark ? 1 : 0,
          shadowOpacity: isDark ? 0 : 0.05,
        },
      ]}
      onPress={onPress}
    >
      <Image
        source={{
          uri:
            item.image_urls?.[0] ??
            "https://placehold.co/300x200?text=No+Image",
        }}
        style={[styles.cover, compact && styles.coverCompact]}
        transition={200}
        contentFit="cover"
      />

      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: mainTextColor }]}>
          {item.title}
        </Text>
        <Text style={[styles.meta, { color: secondaryTextColor }]}>
          {item.date}
          {item.start_time ? ` • ${formatTime(item.start_time)}` : ""}
        </Text>

        {item.location ? (
          <Text
            style={[styles.location, { color: locationColor }]}
            numberOfLines={1}
          >
            📍 {item.location}
          </Text>
        ) : null}

        {item.introduction ? (
          <Text
            style={[styles.intro, { color: introColor }]}
            numberOfLines={compact ? 1 : 2}
          >
            {item.introduction}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowRadius: 4,
    elevation: 2,
  },
  cardCompact: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  cover: {
    width: 96,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#111827",
  },
  coverCompact: {
    width: 72,
    height: 54,
  },
  name: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 13, marginTop: 2 },
  location: { fontSize: 13, marginTop: 2 },
  intro: { marginTop: 4, fontSize: 12, lineHeight: 16 },
});
