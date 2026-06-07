import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getEntries } from "../src/services/storage";
import { BiggestCauses } from "../src/components/BiggestCauses";
import { WeatherBand } from "../src/components/WeatherBand";
import type { Entry } from "../src/lib/types";

const RISK_COLOR: Record<string, string> = {
  none: "#7fae9f",
  elevated: "#e0a13c",
  crisis: "#b4453a",
};

export default function TimelineScreen() {
  const [entries, setEntries] = useState<Entry[]>([]);

  const load = useCallback(() => {
    setEntries(getEntries());
  }, []);

  // Reload every time the tab regains focus so entries added on the Today
  // screen show up here without a restart.
  useFocusEffect(load);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>TIMELINE</Text>
      <Text style={styles.h1}>Your entries over time</Text>
      <Text style={styles.note}>
        Every journal entry you log, in the order it happened. Each is tagged with
        the stressor it&apos;s about — chosen automatically, never by hand.
      </Text>

      <WeatherBand entries={entries} />

      <BiggestCauses entries={entries} />

      {entries.length === 0 ? (
        <Text style={styles.empty}>
          Nothing yet. Add an entry on the Today tab and it&apos;ll appear here.
        </Text>
      ) : (
        entries.map((entry, i) => {
          const isLast = i === entries.length - 1;
          return (
            <View key={entry.id} style={styles.row}>
              <View style={styles.gutter}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: RISK_COLOR[entry.riskLevel ?? "none"] },
                  ]}
                />
                {!isLast ? <View style={styles.connector} /> : null}
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.date}>{entry.date}</Text>
                <Text style={styles.text} numberOfLines={2}>
                  {entry.text}
                </Text>
                {entry.stressor ? (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{entry.stressor}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7faf9" },
  screen: { flex: 1, backgroundColor: "#f7faf9" },
  content: { padding: 20, paddingBottom: 48 },
  kicker: {
    color: "#2f6f5e",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  h1: { fontSize: 24, fontWeight: "800", color: "#1d2b27", lineHeight: 30 },
  note: { color: "#7b8884", fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 16 },
  empty: { color: "#7b8884", fontSize: 14, lineHeight: 20, marginTop: 8 },
  row: { flexDirection: "row", gap: 12 },
  // Left rail: a ring-dot over a soft connector line so entries read as one
  // continuous thread rather than a plain list.
  gutter: { width: 16, alignItems: "center" },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#f7faf9",
    marginTop: 2,
  },
  connector: { width: 2, flex: 1, backgroundColor: "#dde8e3", borderRadius: 1, marginTop: 2 },
  rowBody: { flex: 1, paddingBottom: 22 },
  date: { color: "#7b8884", fontSize: 12, fontWeight: "600" },
  text: { color: "#2b3733", fontSize: 14, lineHeight: 20, marginTop: 2 },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: "#eef5f2",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d4e5de",
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  chipText: { color: "#2f6f5e", fontSize: 12, fontWeight: "600" },
});
