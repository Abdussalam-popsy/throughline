import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

type Line = { label: string; sub: string; action: string; icon: React.ComponentProps<typeof Ionicons>["name"] };

const LINES: Line[] = [
  { label: "999",            sub: "Immediate danger",    action: "tel:999",                    icon: "call" },
  { label: "116 123",        sub: "Samaritans · free, 24/7", action: "tel:116123",             icon: "call-outline" },
  { label: "Text SHOUT",     sub: "Text to 85258",       action: "sms:85258&body=SHOUT",       icon: "chatbubble-outline" },
  { label: "0800 068 4141",  sub: "Papyrus HOPELINE247", action: "tel:08000684141",             icon: "call-outline" },
];

export function CrisisCard({ prominent = false }: { prominent?: boolean }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="heart" size={18} color="#2f6f5e" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {prominent ? "You don't have to handle this alone" : "Need to talk to someone now?"}
          </Text>
          {prominent && (
            <Text style={styles.body}>
              If you're in immediate danger or thinking about harming yourself, please reach out.
            </Text>
          )}
        </View>
      </View>

      <View style={styles.lines}>
        {LINES.map((l, i) => (
          <Pressable
            key={l.action}
            onPress={() => Linking.openURL(l.action)}
            style={({ pressed }) => [
              styles.row,
              i < LINES.length - 1 && styles.rowBorder,
              pressed && styles.rowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${l.label}: ${l.sub}`}
          >
            <View style={styles.rowIcon}>
              <Ionicons name={l.icon} size={16} color="#2f6f5e" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{l.label}</Text>
              <Text style={styles.rowSub}>{l.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9aa5a1" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d4e5de",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 18,
    paddingBottom: 14,
    backgroundColor: "#eef5f2",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#d4e8de",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  headerText: { flex: 1 },
  title: { fontSize: 16, fontWeight: "800", color: "#1d2b27", lineHeight: 22 },
  body: { fontSize: 13, color: "#52605b", lineHeight: 19, marginTop: 4 },
  lines: { backgroundColor: "#ffffff" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eceeed",
  },
  rowPressed: { backgroundColor: "#f4faf7" },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#eef5f2",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "700", color: "#1d2b27" },
  rowSub: { fontSize: 12, color: "#7b8884", marginTop: 1 },
});
