import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CrisisCard } from "../src/components/CrisisCard";

export default function SupportScreen() {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>SUPPORT</Text>
      <Text style={styles.h1}>You can reach out any time</Text>
      <Text style={styles.sub}>
        These lines are always here — you never need a reason &ldquo;serious
        enough&rdquo; to use them.
      </Text>

      <View style={styles.spacer}>
        <CrisisCard prominent />
      </View>

      <Text style={styles.note}>
        University &amp; NHS signposting (matched to what you&apos;ve written)
        gets built out in build-order step 5.
      </Text>
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
  h1: { fontSize: 24, fontWeight: "800", color: "#1d2b27" },
  sub: { fontSize: 15, color: "#52605b", marginTop: 8, lineHeight: 21 },
  spacer: { marginTop: 18 },
  note: { color: "#7b8884", fontSize: 13, marginTop: 18, lineHeight: 19 },
});
