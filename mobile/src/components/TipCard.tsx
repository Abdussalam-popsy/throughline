import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { Domain, Tip } from "../lib/types";
import { fetchTipApi } from "../services/api";

/**
 * Shows one curated tip for a domain, with a "Show another" re-roll. All content
 * comes from the server (`fetchTipApi`); the card never fabricates a tip — if a
 * re-roll fails it simply keeps the current one.
 */
export function TipCard({ tip, domain }: { tip: Tip; domain: Domain }) {
  const [current, setCurrent] = useState<Tip>(tip);
  const [loading, setLoading] = useState(false);

  async function showAnother() {
    setLoading(true);
    const next = await fetchTipApi(domain);
    if (next) setCurrent(next);
    setLoading(false);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.tag}>A TIP THAT MIGHT HELP</Text>
      <Text style={styles.tip}>{current.tip}</Text>
      <Text style={styles.source}>{current.source}</Text>
      <View style={styles.actions}>
        {current.readMore ? (
          <Pressable onPress={() => Linking.openURL(current.readMore!)} hitSlop={8}>
            <Text style={styles.link}>Read more →</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable onPress={showAnother} disabled={loading} hitSlop={8}>
          <Text style={[styles.another, loading && styles.anotherDisabled]}>
            {loading ? "Finding…" : "Show another"}
          </Text>
        </Pressable>
      </View>
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
    gap: 6,
  },
  tag: { color: "#2f6f5e", fontWeight: "700", fontSize: 11, letterSpacing: 1 },
  tip: { fontSize: 16, color: "#1d2b27", lineHeight: 23 },
  source: { fontSize: 13, color: "#5c6b66", fontWeight: "600" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  link: { color: "#2f6f5e", fontWeight: "700", fontSize: 14 },
  another: { color: "#2f6f5e", fontWeight: "700", fontSize: 14 },
  anotherDisabled: { color: "#9aaba4", opacity: 0.6 },
});
