import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CrisisCard } from "../src/components/CrisisCard";
import type { University } from "../src/lib/types";
import { getUniversity } from "../src/services/storage";

function ContactLine({
  icon,
  label,
  value,
  action,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  action: string;
}) {
  return (
    <Pressable
      onPress={() => Linking.openURL(action)}
      style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.contactIconWrap}>
        <Ionicons name={icon} size={16} color="#2f6f5e" />
      </View>
      <View style={styles.contactText}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9aa5a1" />
    </Pressable>
  );
}

function UniversityCard({ university }: { university: University }) {
  return (
    <View style={styles.uniCard}>
      <View style={styles.uniHeader}>
        <View style={styles.uniIconWrap}>
          <Ionicons name="school-outline" size={18} color="#2f6f5e" />
        </View>
        <View style={styles.uniHeaderText}>
          <Text style={styles.uniTag}>YOUR UNIVERSITY</Text>
          <Text style={styles.uniName}>{university.name}</Text>
          <Text style={styles.uniService}>{university.serviceName}</Text>
        </View>
      </View>

      <View style={styles.contacts}>
        {university.phone ? (
          <ContactLine
            icon="call-outline"
            label="Call"
            value={university.phone}
            action={`tel:${university.phone.replace(/\s+/g, "")}`}
          />
        ) : null}
        {university.email ? (
          <ContactLine
            icon="mail-outline"
            label="Email"
            value={university.email}
            action={`mailto:${university.email}`}
          />
        ) : null}
        <ContactLine
          icon="globe-outline"
          label="Visit website"
          value={university.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          action={university.url}
        />
      </View>

      {university.notes ? (
        <Text style={styles.uniNotes}>{university.notes}</Text>
      ) : null}
    </View>
  );
}

export default function SupportScreen() {
  const university = getUniversity();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

        <View style={styles.heroRow}>
          <View>
            <Text style={styles.kicker}>SUPPORT</Text>
            <Text style={styles.h1}>You can reach{"\n"}out any time</Text>
          </View>
          <View style={styles.heroIcon}>
            <Ionicons name="heart" size={28} color="#2f6f5e" />
          </View>
        </View>
        <Text style={styles.sub}>
          These lines are always here — you never need a reason{" "}
          <Text style={styles.subEmphasis}>&ldquo;serious enough&rdquo;</Text> to use them.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CRISIS LINES</Text>
          <CrisisCard prominent />
        </View>

        {university ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>UNIVERSITY SUPPORT</Text>
            <UniversityCard university={university} />
          </View>
        ) : null}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7faf9" },
  screen: { flex: 1, backgroundColor: "#f7faf9" },
  content: { padding: 20, paddingBottom: 48 },

  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#eef5f2",
    borderWidth: 1,
    borderColor: "#d4e5de",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  kicker: {
    color: "#2f6f5e",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  h1: { fontSize: 28, fontWeight: "800", color: "#1d2b27", lineHeight: 34 },
  sub: { fontSize: 15, color: "#52605b", lineHeight: 22, marginBottom: 6 },
  subEmphasis: { fontStyle: "italic", color: "#2f6f5e" },

  section: { marginTop: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9aa5a1",
    letterSpacing: 1,
    marginBottom: 10,
  },

  uniCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d4e5de",
    overflow: "hidden",
  },
  uniHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 18,
    paddingBottom: 14,
    backgroundColor: "#eef5f2",
  },
  uniIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#d4e8de",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  uniHeaderText: { flex: 1 },
  uniTag: { color: "#2f6f5e", fontWeight: "700", fontSize: 11, letterSpacing: 1, marginBottom: 2 },
  uniName: { fontSize: 17, fontWeight: "800", color: "#1d2b27" },
  uniService: { fontSize: 13, color: "#52605b", marginTop: 2 },

  contacts: {
    backgroundColor: "#ffffff",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eceeed",
  },
  pressed: { backgroundColor: "#f4faf7" },
  contactIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#eef5f2",
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: { flex: 1 },
  contactLabel: { fontSize: 12, color: "#7b8884", fontWeight: "600", letterSpacing: 0.3 },
  contactValue: { fontSize: 15, color: "#1d2b27", fontWeight: "600", marginTop: 1 },
  uniNotes: { fontSize: 13, color: "#5c6b66", lineHeight: 19, padding: 16, paddingTop: 12 },
});
