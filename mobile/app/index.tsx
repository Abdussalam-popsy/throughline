import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GroundingActivity } from "../src/components/GroundingActivity";
import { ResourceCard } from "../src/components/ResourceCard";
import { CrisisCard } from "../src/components/CrisisCard";
import { useEntries } from "../src/hooks/useEntries";
import { useVoiceInput } from "../src/hooks/useVoiceInput";
import { processEntryApi } from "../src/services/api";
import type { ProcessEntryResult } from "../src/lib/types";

type Stage = "triage" | "grounding" | "write" | "submitting" | "result";

const EMOJIS = [
  { e: "😊", mood: "good", grounding: false, sos: false },
  { e: "😐", mood: "ok", grounding: false, sos: false },
  { e: "😔", mood: "low", grounding: false, sos: false },
  { e: "😢", mood: "sad", grounding: true, sos: false },
  { e: "😡", mood: "angry", grounding: true, sos: false },
  { e: "🆘", mood: "sos", grounding: true, sos: true },
] as const;

export default function TodayScreen() {
  const { entries, add } = useEntries();
  const [stage, setStage] = useState<Stage>("triage");
  const [sos, setSos] = useState(false);
  const [text, setText] = useState("");
  const [outcome, setOutcome] = useState<ProcessEntryResult | null>(null);

  // Text already in the field when the current dictation began. Live transcripts
  // are appended to it so speaking doesn't wipe out what was typed earlier.
  const dictationBaseRef = useRef("");
  const {
    recognizing,
    error: voiceError,
    start: startVoice,
    stop: stopVoice,
  } = useVoiceInput((transcript) => {
    const base = dictationBaseRef.current;
    setText(base ? `${base} ${transcript}` : transcript);
  });

  function toggleDictation() {
    if (recognizing) {
      stopVoice();
      return;
    }
    dictationBaseRef.current = text.trim();
    startVoice();
  }

  function pickEmoji(emoji: (typeof EMOJIS)[number]) {
    setSos(emoji.sos);
    setStage(emoji.grounding ? "grounding" : "write");
  }

  async function submit() {
    if (text.trim().length === 0) return;
    setStage("submitting");
    // Send the distinct stressors already on the device so the model reuses an
    // existing label verbatim instead of inventing a near-duplicate.
    const knownStressors = Array.from(
      new Set(
        entries
          .map((e) => e.stressor)
          .filter((s): s is string => !!s && s.trim().length > 0)
      )
    ).map((label) => ({ label, domain: "general" as const }));
    const result = await processEntryApi(entries, text.trim(), knownStressors);
    const now = Date.now();
    add({
      id: String(now),
      date: new Date().toISOString().slice(0, 10),
      promptShown: "How has today been?",
      text: text.trim(),
      riskLevel: result.analysis.risk_level,
      themes: result.analysis.themes,
      domain: result.analysis.domain,
      // The stressor is chosen by the model, never the user.
      stressor: result.analysis.related_stressor?.label,
      createdAt: now,
    });
    setOutcome(result);
    setStage("result");
  }

  function reset() {
    if (recognizing) stopVoice();
    setText("");
    setOutcome(null);
    setSos(false);
    setStage("triage");
  }

  const isCrisis = sos || outcome?.analysis.risk_level === "crisis";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>TODAY</Text>

      {stage === "triage" && (
        <>
          <Text style={styles.h1}>How are you feeling right now?</Text>
          <View style={styles.emojiRow}>
            {EMOJIS.map((item) => (
              <Pressable
                key={item.e}
                onPress={() => pickEmoji(item)}
                style={({ pressed }) => [
                  styles.emojiBtn,
                  pressed && styles.emojiPressed,
                ]}
              >
                <Text style={styles.emoji}>{item.e}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>Tap whichever is closest. We&apos;ll take it from there.</Text>
        </>
      )}

      {stage === "grounding" && (
        <>
          {sos && (
            <View style={styles.sosWrap}>
              <CrisisCard prominent />
            </View>
          )}
          <GroundingActivity
            onReady={() => setStage("write")}
            onSkip={() => setStage("write")}
          />
        </>
      )}

      {stage === "write" && (
        <>
          {sos && (
            <View style={styles.sosWrap}>
              <CrisisCard prominent />
            </View>
          )}
          <Text style={styles.h1}>How has today been?</Text>
          <Text style={styles.hint}>
            Write or speak as much or as little as you like. It stays on your
            device.
          </Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              multiline
              autoFocus
              placeholder="Today I…"
              placeholderTextColor="#9aa5a1"
              textAlignVertical="top"
            />
            <Pressable
              onPress={toggleDictation}
              accessibilityRole="button"
              accessibilityLabel={
                recognizing ? "Stop voice dictation" : "Dictate with your voice"
              }
              style={({ pressed }) => [
                styles.micBtn,
                recognizing && styles.micBtnActive,
                pressed && styles.micPressed,
              ]}
            >
              <Text style={[styles.micIcon, recognizing && styles.micIconActive]}>
                {recognizing ? "■" : "🎤"}
              </Text>
            </Pressable>
          </View>
          {recognizing ? (
            <View style={styles.listeningRow}>
              <ActivityIndicator size="small" color="#2f6f5e" />
              <Text style={styles.listeningText}>Listening… tap the square to stop.</Text>
            </View>
          ) : (
            <Text style={styles.micHint}>Tap the mic to dictate your entry.</Text>
          )}
          {voiceError ? (
            <Text style={styles.voiceError}>{voiceError}</Text>
          ) : null}
          <Pressable
            disabled={text.trim().length === 0}
            onPress={submit}
            style={({ pressed }) => [
              styles.cta,
              text.trim().length === 0 && styles.ctaDisabled,
              pressed && text.trim().length > 0 && styles.ctaPressed,
            ]}
          >
            <Text style={styles.ctaText}>Save entry</Text>
          </Pressable>
        </>
      )}

      {stage === "submitting" && (
        <View style={styles.loading}>
          <ActivityIndicator color="#2f6f5e" />
          <Text style={styles.hint}>Saving and reflecting…</Text>
        </View>
      )}

      {stage === "result" && outcome && (
        <>
          {isCrisis ? (
            <View style={styles.crisisFull}>
              <CrisisCard prominent />
              <Text style={styles.crisisNote}>
                Your entry is saved. Please reach out to one of the lines above —
                they&apos;re there for exactly this.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.h1}>Entry saved</Text>
              {outcome.analysis.next_prompt ? (
                <View style={styles.promptCard}>
                  <Text style={styles.promptLabel}>SOMETHING TO SIT WITH</Text>
                  <Text style={styles.promptText}>
                    {outcome.analysis.next_prompt}
                  </Text>
                </View>
              ) : null}
              {outcome.resource && (
                <ResourceCard
                  title={outcome.resource.title}
                  source={outcome.resource.source}
                  snippet={outcome.resource.snippet}
                  url={outcome.resource.url}
                />
              )}
            </>
          )}
          <Pressable onPress={reset} style={styles.secondary}>
            <Text style={styles.secondaryText}>New entry</Text>
          </Pressable>
        </>
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
  h1: { fontSize: 24, fontWeight: "800", color: "#1d2b27", marginBottom: 6 },
  hint: { fontSize: 14, color: "#52605b", lineHeight: 20 },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 10,
    gap: 10,
  },
  emojiBtn: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eceeed",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiPressed: { backgroundColor: "#eef5f2", borderColor: "#bfe0d6" },
  emoji: { fontSize: 40 },
  inputWrap: { position: "relative", marginTop: 14 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e7e5",
    minHeight: 160,
    padding: 16,
    paddingBottom: 56,
    fontSize: 16,
    color: "#1d2b27",
  },
  micBtn: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eef5f2",
    borderWidth: 1,
    borderColor: "#cfe4dc",
    alignItems: "center",
    justifyContent: "center",
  },
  micBtnActive: { backgroundColor: "#2f6f5e", borderColor: "#2f6f5e" },
  micPressed: { opacity: 0.7 },
  micIcon: { fontSize: 20 },
  micIconActive: { color: "#fff", fontSize: 16, fontWeight: "800" },
  micHint: { fontSize: 13, color: "#7a857f", marginTop: 8 },
  listeningRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  listeningText: { fontSize: 13, color: "#2f6f5e", fontWeight: "600" },
  voiceError: { fontSize: 13, color: "#b3261e", marginTop: 8 },
  cta: {
    backgroundColor: "#2f6f5e",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  ctaDisabled: { backgroundColor: "#dbe5e1" },
  ctaPressed: { backgroundColor: "#255647" },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  loading: { alignItems: "center", marginTop: 40, gap: 12 },
  sosWrap: { marginBottom: 18 },
  crisisFull: { gap: 14 },
  crisisNote: { color: "#52605b", fontSize: 14, lineHeight: 20 },
  promptCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eceeed",
    padding: 18,
    marginTop: 16,
  },
  promptLabel: {
    color: "#2f6f5e",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
  },
  promptText: { fontSize: 17, color: "#1d2b27", lineHeight: 24 },
  secondary: { alignItems: "center", marginTop: 22, padding: 8 },
  secondaryText: { color: "#2f6f5e", fontWeight: "700", fontSize: 15 },
});
