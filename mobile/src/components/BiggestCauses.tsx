import { useRouter } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { rankCauses } from "../lib/causes";
import { useCauseTips } from "../hooks/useCauseTips";
import type { Entry } from "../lib/types";

/**
 * "Biggest causes of stress" — a calm ranked summary pinned above the timeline.
 * Each non-sensitive cause shows one curated tip; sensitive causes (self-harm,
 * crisis) route to support instead of ever showing a casual tip.
 */
export function BiggestCauses({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const causes = rankCauses(entries);
  const tips = useCauseTips(causes);

  return (
    <View style={styles.section}>
      <Text style={styles.kicker}>BIGGEST CAUSES OF STRESS</Text>

      {causes.length === 0 ? (
        <Text style={styles.empty}>
          Once you&apos;ve logged a few entries, the things weighing on you most
          will show up here.
        </Text>
      ) : (
        causes.map((cause, i) => (
          <View key={cause.domain} style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.rank}>{i + 1}</Text>
              <Text style={styles.label}>{cause.label}</Text>
              <Text style={styles.count}>
                {cause.count} {cause.count === 1 ? "entry" : "entries"}
              </Text>
            </View>

            {cause.sensitive ? (
              <Pressable onPress={() => router.push("/support")}>
                <Text style={styles.supportLink}>
                  Support is available when you want it →
                </Text>
              </Pressable>
            ) : (
              <CauseTip state={tips[cause.domain]} />
            )}
          </View>
        ))
      )}
    </View>
  );
}

function CauseTip({ state }: { state: ReturnType<typeof useCauseTips>[string] }) {
  if (!state || state.status === "loading") {
    return <Text style={styles.tipMuted}>Finding a tip…</Text>;
  }
  if (state.status === "error") {
    return <Text style={styles.tipMuted}>Couldn&apos;t load a tip right now.</Text>;
  }

  const { tip } = state;
  return (
    <>
      <Text style={styles.tip}>
        <Text style={styles.tipPrefix}>Tip: </Text>
        {tip.tip}
      </Text>
      <View style={styles.tipFooter}>
        <Text style={styles.source}>{tip.source}</Text>
        {tip.readMore ? (
          <Pressable onPress={() => Linking.openURL(tip.readMore!)} hitSlop={8}>
            <Text style={styles.link}>Read more →</Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  kicker: {
    color: "#2f6f5e",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  empty: { color: "#7b8884", fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: "#eef5f2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d4e5de",
    padding: 16,
    marginBottom: 12,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rank: {
    color: "#2f6f5e",
    fontWeight: "800",
    fontSize: 15,
    width: 16,
  },
  label: { flex: 1, color: "#1d2b27", fontWeight: "800", fontSize: 16 },
  count: { color: "#7b8884", fontSize: 12, fontWeight: "600" },
  tip: { color: "#2b3733", fontSize: 14, lineHeight: 20, marginTop: 10 },
  tipPrefix: { fontWeight: "700", color: "#1d2b27" },
  tipMuted: { color: "#7b8884", fontSize: 14, lineHeight: 20, marginTop: 10 },
  tipFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  source: { color: "#5c6b66", fontSize: 12, fontWeight: "600" },
  link: { color: "#2f6f5e", fontWeight: "700", fontSize: 13 },
  supportLink: {
    color: "#2f6f5e",
    fontWeight: "700",
    fontSize: 14,
    marginTop: 10,
  },
});
