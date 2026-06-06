import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SEED_ENTRIES } from "../src/lib/seed";

const RISK_COLOR: Record<string, string> = {
  none: "#7fae9f",
  elevated: "#e0a13c",
  crisis: "#b4453a",
};

export default function TimelineScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>TIMELINE</Text>
      <Text style={styles.h1}>Your entries over time</Text>
      <Text style={styles.note}>
        Mood thread + entry detail get fleshed out in build-order step 5. Demo
        data shown below.
      </Text>
      {SEED_ENTRIES.map((e) => (
        <View key={e.id} style={styles.row}>
          <View
            style={[
              styles.dot,
              { backgroundColor: RISK_COLOR[e.riskLevel ?? "none"] },
            ]}
          />
          <View style={styles.rowBody}>
            <Text style={styles.date}>{e.date}</Text>
            <Text style={styles.text} numberOfLines={2}>
              {e.text}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f7faf9" },
  content: { padding: 20, paddingBottom: 48 },
  kicker: {
    color: "#2f6f5e",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  h1: { fontSize: 24, fontWeight: "800", color: "#1d2b27" },
  note: { color: "#7b8884", fontSize: 13, marginTop: 8, marginBottom: 16 },
  row: { flexDirection: "row", gap: 12, marginBottom: 14 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
  rowBody: { flex: 1 },
  date: { color: "#7b8884", fontSize: 12, fontWeight: "600" },
  text: { color: "#2b3733", fontSize: 14, lineHeight: 20, marginTop: 2 },
});
