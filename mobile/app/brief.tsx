import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";
import { useBriefSender } from "../src/hooks/useBriefSender";
import { getEntries } from "../src/services/storage";
import { exportJournalPdf } from "../src/lib/pdfExport";
import type { Entry } from "../src/lib/types";

export default function BriefScreen() {
  const { status, brief, generate } = useBriefSender();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [exporting, setExporting] = useState(false);

  async function onExport() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportJournalPdf(entries, brief);
    } catch {
      Alert.alert("Export failed", "Couldn't create the PDF just now. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      setEntries(getEntries());
    }, [])
  );

  const hasEntries = entries.length > 0;
  const hasBrief = brief.length > 0 && (status === "review" || status === "sending" || status === "success");

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.heroRow}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>YOUR ONE-PAGE BRIEF</Text>
            <Text style={styles.h1}>A summary for{"\n"}your clinician</Text>
          </View>
          <View style={styles.heroIcon}>
            <Ionicons name="document-text" size={26} color="#2f6f5e" />
          </View>
        </View>
        <Text style={styles.sub}>
          {hasEntries
            ? `Built from ${entries.length} journal ${entries.length === 1 ? "entry" : "entries"} — in your own words. Not a diagnosis, a starting point you choose to share.`
            : "Your journal entries will appear here once you start writing on the Today tab."}
        </Text>

        {/* Empty state */}
        {!hasEntries && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="create-outline" size={28} color="#9aa5a1" />
            </View>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyBody}>
              Add a few journal entries on the Today tab. Once you have some, come back here to generate your brief.
            </Text>
          </View>
        )}

        {/* Generate CTA */}
        {hasEntries && (status === "idle" || status === "error") && (
          <>
            <Pressable
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
              onPress={() => generate(entries)}
            >
              <Ionicons name="sparkles-outline" size={18} color="#fff" />
              <Text style={styles.ctaText}>
                {status === "error" ? "Try again" : "Generate my brief"}
              </Text>
            </Pressable>
            {status === "error" && (
              <Text style={styles.error}>Couldn&apos;t reach the brief service. Check your connection and try again.</Text>
            )}
          </>
        )}

        {/* Loading */}
        {status === "generating" && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#2f6f5e" size="large" />
            <Text style={styles.loadingTitle}>Reading your entries&hellip;</Text>
            <Text style={styles.loadingBody}>This takes about 10–15 seconds.</Text>
          </View>
        )}

        {/* Brief content */}
        {hasBrief && (
          <>
            <View style={styles.card}>
              <Markdown style={markdownStyles}>{brief}</Markdown>
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={onExport}
                disabled={exporting}
                accessibilityRole="button"
                accessibilityLabel="Export your brief and entries as a PDF"
                style={({ pressed }) => [
                  styles.exportBtn,
                  exporting && styles.btnDisabled,
                  pressed && !exporting && styles.exportBtnPressed,
                ]}
              >
                {exporting ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.exportText}>Preparing PDF&hellip;</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="download-outline" size={18} color="#fff" />
                    <Text style={styles.exportText}>Export as PDF</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.refreshBtn, pressed && styles.refreshBtnPressed]}
                onPress={() => generate(entries)}
              >
                <Ionicons name="refresh-outline" size={16} color="#2f6f5e" />
                <Text style={styles.refreshText}>Regenerate from latest entries</Text>
              </Pressable>
            </View>
          </>
        )}

        {status === "review" && (
          <Text style={styles.footnote}>
            Review above, then export or share when you&apos;re ready.
          </Text>
        )}

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
  heroText: { flex: 1, paddingRight: 12 },
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
  sub: { fontSize: 15, color: "#52605b", lineHeight: 22, marginBottom: 4 },

  emptyCard: {
    marginTop: 28,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eceeed",
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#f3f5f4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: "800", color: "#1d2b27" },
  emptyBody: { fontSize: 14, color: "#7b8884", lineHeight: 20, textAlign: "center" },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2f6f5e",
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 22,
  },
  ctaPressed: { backgroundColor: "#255647" },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: "#b4453a", marginTop: 12, fontSize: 14, lineHeight: 20 },

  loadingCard: {
    marginTop: 36,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#eceeed",
    padding: 36,
  },
  loadingTitle: { fontSize: 16, fontWeight: "700", color: "#1d2b27", marginTop: 4 },
  loadingBody: { fontSize: 14, color: "#7b8884" },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginTop: 22,
    borderWidth: 1,
    borderColor: "#eceeed",
  },

  actions: { marginTop: 14, gap: 10 },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2f6f5e",
    borderRadius: 14,
    paddingVertical: 15,
  },
  exportBtnPressed: { backgroundColor: "#255647" },
  btnDisabled: { opacity: 0.65 },
  exportText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cfe0da",
    backgroundColor: "#eef5f2",
    paddingVertical: 12,
  },
  refreshBtnPressed: { backgroundColor: "#e0ece8" },
  refreshText: { color: "#2f6f5e", fontWeight: "700", fontSize: 14 },

  footnote: { color: "#7b8884", fontSize: 13, marginTop: 14, fontStyle: "italic" },
});

const markdownStyles = {
  heading1: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1d2b27",
    marginTop: 8,
    letterSpacing: 0.2,
  },
  heading2: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2f6f5e",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eceeed",
    paddingBottom: 6,
  },
  body: { color: "#2b3733", fontSize: 15, lineHeight: 22 },
  blockquote: {
    backgroundColor: "#f1f5f4",
    borderLeftWidth: 3,
    borderLeftColor: "#cdd8d4",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 6,
    color: "#52605b",
    fontStyle: "italic",
  },
  hr: { backgroundColor: "#eceeed", height: 1, marginVertical: 18 },
} as const;
