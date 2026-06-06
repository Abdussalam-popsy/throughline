import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import Markdown from "react-native-markdown-display";
import { useBriefSender } from "../src/hooks/useBriefSender";
import { getEntries } from "../src/services/storage";
import type { Entry } from "../src/lib/types";

export default function BriefScreen() {
  const { status, brief, generate } = useBriefSender();
  const [entries, setEntries] = useState<Entry[]>([]);

  // Build the brief from the live timeline (entries logged on the Today tab and
  // shown on the Timeline tab), not a hardcoded sample. Reload on focus so the
  // brief always reflects what the user has actually written.
  useFocusEffect(
    useCallback(() => {
      setEntries(getEntries());
    }, [])
  );

  return (
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
          Couldn&apos;t reach the brief service. Is the backend running on{" "}
          {process.env.EXPO_PUBLIC_API_URL ?? "adsfafasfdsa, http://localhost:300"}?
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
          <View style={styles.card}>
            <Markdown style={markdownStyles}>{brief}</Markdown>
          </View>
        )}

      {status === "review" && (
        <Text style={styles.footnote}>
          Next: review, pick who to share with, and consent before anything is
          sent.
        </Text>
      )}
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
  h1: { fontSize: 24, fontWeight: "800", color: "#1d2b27", lineHeight: 30 },
  sub: { fontSize: 15, color: "#52605b", marginTop: 10, lineHeight: 21 },
  cta: {
    backgroundColor: "#2f6f5e",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 22,
  },
  ctaPressed: { backgroundColor: "#255647" },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
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
});

const markdownStyles = {
  heading1: { fontSize: 20, fontWeight: "800", color: "#1d2b27", marginTop: 8 },
  heading2: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1d2b27",
    marginTop: 18,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eceeed",
    paddingBottom: 4,
  },
  body: { color: "#2b3733", fontSize: 15, lineHeight: 22 },
  blockquote: {
    backgroundColor: "#f1f5f4",
    borderLeftWidth: 3,
    borderLeftColor: "#cdd8d4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: "#52605b",
  },
  hr: { backgroundColor: "#eceeed", height: 1, marginVertical: 16 },
} as const;
