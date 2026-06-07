import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Grounding } from "../lib/types";
import { GroundingActivity } from "./GroundingActivity";

// A small visual cue per technique type. Falls back to a neutral grounding icon.
const ICON: Record<string, string> = {
  breathing: "🌬️",
  physical_relaxation: "💆",
  movement: "🚶",
  grounding: "🧘",
  expressive_writing: "✍️",
  cognitive_offload: "🧠",
  creative: "🎨",
  physical_release: "💥",
  music: "🎧",
  reframing: "🔄",
  social: "💬",
  environment: "🧹",
  passive_rest: "🌿",
  sensory_interrupt: "💧",
};

/**
 * Renders one server-chosen grounding technique. Breathing techniques reuse the
 * existing animated breather; everything else is a descriptive card with a "Done"
 * button. `onDone` collapses the technique back to the result screen.
 */
export function GroundingTechniqueCard({
  grounding,
  onDone,
}: {
  grounding: Grounding;
  onDone: () => void;
}) {
  if (grounding.type === "breathing") {
    return <GroundingActivity onReady={onDone} onSkip={onDone} />;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.tag}>A GROUNDING TECHNIQUE</Text>
      <View style={styles.titleRow}>
        <Text style={styles.icon}>{ICON[grounding.type] ?? "🧘"}</Text>
        <View style={styles.titleText}>
          <Text style={styles.title}>{grounding.title}</Text>
          <Text style={styles.duration}>{grounding.durationLabel}</Text>
        </View>
      </View>
      <Text style={styles.description}>{grounding.description}</Text>
      <Pressable
        onPress={onDone}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
      >
        <Text style={styles.ctaText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d4e5de",
    padding: 18,
    marginTop: 16,
    gap: 10,
  },
  tag: { color: "#2f6f5e", fontWeight: "700", fontSize: 11, letterSpacing: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { fontSize: 30 },
  titleText: { flex: 1 },
  title: { fontSize: 17, fontWeight: "800", color: "#1d2b27" },
  duration: { fontSize: 13, color: "#5c6b66", fontWeight: "600", marginTop: 2 },
  description: { fontSize: 15, color: "#2b3733", lineHeight: 22 },
  cta: {
    backgroundColor: "#2f6f5e",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  ctaPressed: { backgroundColor: "#255647" },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
