import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";

export default function SupportScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>SUPPORT</Text>
      <Text style={styles.h1}>If you need to talk to someone</Text>

      <View style={styles.crisisCard}>
        <Text style={styles.crisisTitle}>In a crisis right now?</Text>
        <Text style={styles.crisisBody}>
          If you&apos;re in immediate danger or thinking about harming yourself,
          you don&apos;t have to wait.
        </Text>
        <Text style={styles.crisisLine} onPress={() => Linking.openURL("tel:999")}>
          Call 999
        </Text>
        <Text
          style={styles.crisisLine}
          onPress={() => Linking.openURL("sms:85258&body=SHOUT")}
        >
          Text SHOUT to 85258
        </Text>
        <Text
          style={styles.crisisLine}
          onPress={() => Linking.openURL("tel:116123")}
        >
          Samaritans — call 116 123 (free, 24/7)
        </Text>
      </View>

      <Text style={styles.note}>
        NHS / university signposting (driven by risk_level) is built out in
        build-order step 5.
      </Text>
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
  crisisCard: {
    backgroundColor: "#fbeeec",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f0cfc9",
    padding: 20,
    marginTop: 20,
    gap: 8,
  },
  crisisTitle: { fontSize: 17, fontWeight: "800", color: "#9c352b" },
  crisisBody: { color: "#7a4039", fontSize: 14, lineHeight: 20, marginBottom: 4 },
  crisisLine: {
    color: "#b4453a",
    fontSize: 16,
    fontWeight: "700",
    paddingVertical: 4,
  },
  note: { color: "#7b8884", fontSize: 13, marginTop: 18, lineHeight: 19 },
});
