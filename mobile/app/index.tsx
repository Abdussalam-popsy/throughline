import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function TodayScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>TODAY</Text>
      <Text style={styles.h1}>How has today been?</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          The daily entry box and AI continuity prompt land here in build-order
          step 4. For now, the demo data lives under the Brief tab.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#f7faf9" },
  content: { padding: 20 },
  kicker: {
    color: "#2f6f5e",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  h1: { fontSize: 24, fontWeight: "800", color: "#1d2b27" },
  placeholder: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eceeed",
    padding: 20,
    marginTop: 20,
  },
  placeholderText: { color: "#52605b", fontSize: 15, lineHeight: 22 },
});
