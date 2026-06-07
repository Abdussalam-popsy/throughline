import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CrisisCard } from "../src/components/CrisisCard";
import { copyContact } from "../src/lib/clipboard";
import type { University } from "../src/lib/types";
import { getUniversity } from "../src/services/storage";

// A tappable contact line (phone / email / website) for the university card.
function ContactLine({
  icon,
  label,
  value,
  copyValue,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  copyValue: string;
}) {
  return (
    <Pressable
      onPress={() => copyContact(copyValue, `${label} copied`)}
      style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Copy ${label}: ${value}`}
    >
      <Ionicons name={icon} size={18} color="#2f6f5e" />
      <View style={styles.contactText}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue}>{value}</Text>
      </View>
      <Ionicons name="copy-outline" size={18} color="#9aa5a1" />
    </Pressable>
  );
}

function UniversityCard({ university }: { university: University }) {
  return (
    <View style={styles.uniCard}>
      <Text style={styles.uniTag}>YOUR UNIVERSITY</Text>
      <Text style={styles.uniName}>{university.name}</Text>
      <Text style={styles.uniService}>{university.serviceName}</Text>

      <View style={styles.contacts}>
        {university.phone ? (
          <ContactLine
            icon="call-outline"
            label="Phone"
            value={university.phone}
            copyValue={university.phone}
          />
        ) : null}
        {university.email ? (
          <ContactLine
            icon="mail-outline"
            label="Email"
            value={university.email}
            copyValue={university.email}
          />
        ) : null}
        <ContactLine
          icon="globe-outline"
          label="Website"
          value={university.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          copyValue={university.url}
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
        <Text style={styles.kicker}>SUPPORT</Text>
        <Text style={styles.h1}>You can reach out any time</Text>
        <Text style={styles.sub}>
          These lines are always here — you never need a reason &ldquo;serious
          enough&rdquo; to use them.
        </Text>

        <View style={styles.spacer}>
          <CrisisCard prominent />
        </View>

        {university ? (
          <View style={styles.spacer}>
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
  kicker: {
    color: "#2f6f5e",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  h1: { fontSize: 24, fontWeight: "800", color: "#1d2b27", lineHeight: 30 },
  sub: { fontSize: 15, color: "#52605b", marginTop: 8, lineHeight: 21 },
  spacer: { marginTop: 18 },
  uniCard: {
    backgroundColor: "#eef5f2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d4e5de",
    padding: 18,
    gap: 4,
  },
  uniTag: { color: "#2f6f5e", fontWeight: "700", fontSize: 11, letterSpacing: 1 },
  uniName: { fontSize: 18, fontWeight: "800", color: "#1d2b27", marginTop: 2 },
  uniService: { fontSize: 14, color: "#52605b", marginBottom: 6 },
  contacts: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e1ebe7",
    marginTop: 8,
    overflow: "hidden",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eceeed",
  },
  pressed: { backgroundColor: "#f1f7f4" },
  contactText: { flex: 1 },
  contactLabel: {
    fontSize: 12,
    color: "#7b8884",
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  contactValue: { fontSize: 15, color: "#1d2b27", fontWeight: "600", marginTop: 1 },
  uniNotes: { fontSize: 13, color: "#5c6b66", lineHeight: 19, marginTop: 12 },
});
