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

  // Export the generated brief + full entry log to a PDF and open the OS
  // share/save sheet. The brief is already in hand here, so no regeneration is
  // needed.
  async function onExport() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportJournalPdf(entries, brief);
    } catch {
      Alert.alert(
        "Export failed",
        "Couldn't create the PDF just now. Please try again."
      );
    } finally {
      setExporting(false);
    }
  }

  // Build the brief from the live timeline (entries logged on the Today tab and
  // shown on the Timeline tab), not a hardcoded sample. Reload on focus so the
  // brief always reflects what the user has actually written.
  useFocusEffect(
    useCallback(() => {
      setEntries(getEntries());
    }, [])
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>YOUR ONE-PAGE BRIEF</Text>
      <Text style={styles.h1}>A summary a clinician can read in 30 seconds</Text>
      <Text style={styles.sub}>
        Built from {entries.length} of your own journal entries, in your own
        words. Not a diagnosis — a starting point you choose to share.
      </Text>

      {(status === "idle" || status === "error") &&
        (entries.length === 0 ? (
          <Text style={styles.footnote}>
            No entries yet. Add a few on the Today tab and they&apos;ll appear on
            your Timeline — then you can build a brief from them here.
          </Text>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
            onPress={() => generate(entries)}
          >
            <Text style={styles.ctaText}>
              {status === "error" ? "Try again" : "Generate my brief"}
            </Text>
          </Pressable>
        ))}

      {status === "error" && (
        <Text style={styles.error}>
          Couldn&apos;t reach the brief service.{" "}
          {/* {process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:300"}? */}
        </Text>
      )}

      {status === "generating" && (
        <View style={styles.loading}>
          <ActivityIndicator color="#2f6f5e" />
          <Text style={styles.loadingText}>Reading your entries…</Text>
        </View>
      )}

      {(status === "review" ||
        status === "sending" ||
        status === "success") &&
        brief.length > 0 && (
          <>
            <View style={styles.card}>
              <Markdown style={markdownStyles}>{brief}</Markdown>
            </View>
            <Pressable
              onPress={onExport}
              disabled={exporting}
              accessibilityRole="button"
              accessibilityLabel="Export your brief and entries as a PDF"
              style={({ pressed }) => [
                styles.export,
                exporting && styles.exportDisabled,
                pressed && !exporting && styles.exportPressed,
              ]}
            >
              {exporting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.exportText}>Preparing PDF…</Text>
                </>
              ) : (
                <Text style={styles.exportText}>⬇  Export as PDF</Text>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.refresh,
                pressed && styles.refreshPressed,
              ]}
              onPress={() => generate(entries)}
            >
              <Text style={styles.refreshText}>↻ Regenerate from latest entries</Text>
            </Pressable>
          </>
        )}

      {status === "review" && (
        <Text style={styles.footnote}>
          Next: review, pick who to share with, and consent before anything is
          sent.
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
  kicker: {
    color: "#2f6f5e",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  h1: { fontSize: 24, fontWeight: "800", color: "#1d2b27", lineHeight: 30 },
  sub: { fontSize: 15, color: "#52605b", marginTop: 10, lineHeight: 21 },
  cta: {
    backgroundColor: "#2f6f5e",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 22,
  },
  ctaPressed: { backgroundColor: "#255647", transform: [{ scale: 0.99 }] },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 0.2 },
  error: { color: "#b4453a", marginTop: 14, fontSize: 14, lineHeight: 20 },
  loading: { alignItems: "center", marginTop: 36, gap: 10 },
  loadingText: { color: "#52605b", fontSize: 14 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginTop: 22,
    borderWidth: 1,
    borderColor: "#eceeed",
  },
  footnote: {
    color: "#7b8884",
    fontSize: 13,
    marginTop: 16,
    fontStyle: "italic",
  },
  export: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2f6f5e",
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 18,
  },
  exportPressed: { backgroundColor: "#255647" },
  exportDisabled: { opacity: 0.7 },
  exportText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  refresh: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cfe0da",
    backgroundColor: "#eef5f2",
  },
  refreshPressed: { backgroundColor: "#e0ece8" },
  refreshText: { color: "#2f6f5e", fontWeight: "700", fontSize: 14 },
});

const markdownStyles = {
  // Doc title — top of the rendered brief (DESIGN.md §5.3 / Brief-document hierarchy).
  heading1: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1d2b27",
    marginTop: 8,
    letterSpacing: 0.2,
  },
  // Section labels read as a clinical document: uppercase green over a hairline rule.
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
  // Quoted journal lines as evidence — italic, left-bordered, soft-filled.
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
