import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

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

export default function ActivityCard({ item, onPress, compact = false }: Props) {
  return (
    <Pressable
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPress}
    >
      <Image
        source={{
          uri: item.image_urls?.[0] ?? "https://placehold.co/300x200?text=No+Image",
        }}
        style={[styles.cover, compact && styles.coverCompact]}
        transition={200}
        contentFit="cover"
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.title}</Text>
        <Text style={styles.meta}>
          {item.date}
          {item.start_time ? ` • ${item.start_time}` : ""}
        </Text>

        {item.location ? (
          <Text style={styles.location} numberOfLines={1}>
            📍 {item.location}
          </Text>
        ) : null}

        {item.introduction ? (
          <Text style={styles.intro} numberOfLines={compact ? 1 : 2}>
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
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
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
    backgroundColor: "#eee",
  },
  coverCompact: {
    width: 72,
    height: 54,
  },
  name: { fontSize: 16, fontWeight: "600" },
  meta: { color: "#666", fontSize: 13, marginTop: 2 },
  location: { color: "#444", fontSize: 13, marginTop: 2 },
  intro: { color: "#555", marginTop: 4, fontSize: 12, lineHeight: 16 },
});
