import { Linking, StyleSheet, Text, View } from "react-native";

type Line = { label: string; action: string };

const LINES: Line[] = [
  { label: "Call 999 (immediate danger)", action: "tel:999" },
  { label: "Samaritans — 116 123 (free, 24/7)", action: "tel:116123" },
  { label: "Text SHOUT to 85258", action: "sms:85258&body=SHOUT" },
  { label: "Papyrus HOPELINE247 — 0800 068 4141", action: "tel:08000684141" },
];

/**
 * Hardcoded, always-available crisis support. Never gated by model output.
 * `prominent` raises its visual weight (e.g. on a crisis signal or SOS emoji).
 */
export function CrisisCard({ prominent = false }: { prominent?: boolean }) {
  return (
    <View style={[styles.card, prominent && styles.cardProminent]}>
      <Text style={styles.title}>
        {prominent ? "You don't have to handle this alone" : "If you need to talk to someone now"}
      </Text>
      {prominent ? (
        <Text style={styles.body}>
          If you&apos;re in immediate danger or thinking about harming yourself,
          please reach out right now.
        </Text>
      ) : null}
      {LINES.map((l) => (
        <Text
          key={l.action}
          style={styles.line}
          onPress={() => Linking.openURL(l.action)}
        >
          {l.label}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fbeeec",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0cfc9",
    padding: 18,
    gap: 6,
  },
  cardProminent: {
    borderWidth: 2,
    borderColor: "#b4453a",
    backgroundColor: "#fbe4e0",
  },
  title: { fontSize: 17, fontWeight: "800", color: "#9c352b" },
  body: { color: "#7a4039", fontSize: 14, lineHeight: 20, marginBottom: 2 },
  line: {
    color: "#b4453a",
    fontSize: 16,
    fontWeight: "700",
    paddingVertical: 4,
  },
});
