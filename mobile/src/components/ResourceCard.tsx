import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

export type ResourceCardProps = {
  title: string;
  source: string;
  snippet: string;
  url?: string;
};

export function ResourceCard({ title, source, snippet, url }: ResourceCardProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.tag}>A RESOURCE THAT MIGHT HELP</Text>
        <Pressable onPress={() => setDismissed(true)} hitSlop={10}>
          <Text style={styles.dismiss}>Dismiss</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.source}>{source}</Text>
      <Text style={styles.snippet}>{snippet}</Text>
      {url ? (
        <Pressable onPress={() => Linking.openURL(url)}>
          <Text style={styles.link}>Open resource →</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#eef5f2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d4e5de",
    padding: 18,
    marginTop: 18,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  tag: {
    color: "#2f6f5e",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1,
  },
  dismiss: { color: "#7b8884", fontSize: 13, fontWeight: "600" },
  title: { fontSize: 17, fontWeight: "800", color: "#1d2b27" },
  source: { fontSize: 13, color: "#5c6b66", fontWeight: "600", marginBottom: 4 },
  snippet: { fontSize: 14, color: "#2b3733", lineHeight: 20 },
  link: { color: "#2f6f5e", fontWeight: "700", fontSize: 14, marginTop: 8 },
});
