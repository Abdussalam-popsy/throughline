import { useRouter } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { GroundingActivity } from "../src/components/GroundingActivity";
import { GroundingTechniqueCard } from "../src/components/GroundingTechniqueCard";
import { TipCard } from "../src/components/TipCard";
import { CrisisCard } from "../src/components/CrisisCard";
import { useEntries } from "../src/hooks/useEntries";
import { useVoiceInput } from "../src/hooks/useVoiceInput";
import {
  classifyDomainApi,
  fetchSupportApi,
  processEntryApi,
} from "../src/services/api";
import type { ProcessEntryResult, SupportResult } from "../src/lib/types";

type Stage = "triage" | "grounding" | "write" | "submitting" | "result";

const EMOJIS = [
  { e: "😊", mood: "good", label: "Good", grounding: false, sos: false },
  { e: "😐", mood: "ok", label: "Okay", grounding: false, sos: false },
  { e: "😔", mood: "low", label: "Low", grounding: false, sos: false },
  { e: "😢", mood: "sad", label: "Sad", grounding: true, sos: false },
  { e: "😡", mood: "angry", label: "Angry", grounding: true, sos: false },
  { e: "🆘", mood: "sos", label: "Need help", grounding: true, sos: true },
] as const;

// A warm, time-aware greeting so the first thing the user sees feels personal
// rather than like a form. Recomputed each render — cheap and always current.
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const TODAY_LABEL = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function TodayScreen() {
  const router = useRouter();
  const { entries, add } = useEntries();
  const [stage, setStage] = useState<Stage>("triage");
  const [sos, setSos] = useState(false);
  // Whether the current entry's mood routed through the grounding breather, so
  // the back button can return to it (rather than skipping straight to triage).
  const [grounded, setGrounded] = useState(false);
  const [text, setText] = useState("");
  const [outcome, setOutcome] = useState<ProcessEntryResult | null>(null);
  // Server-owned support bundle (tip + grounding) for the result screen. Null
  // until fetched; its tip/grounding are individually null on crisis or error.
  const [support, setSupport] = useState<SupportResult | null>(null);
  const [showGrounding, setShowGrounding] = useState(false);

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
    // SOS / "Need help" is a safety affordance, not a journaling mood — send the
    // user straight to the always-on Support tab (crisis lines) rather than into
    // the grounding → write → brief flow.
    if (emoji.sos) {
      router.navigate("/support");
      return;
    }
    setSos(emoji.sos);
    setGrounded(emoji.grounding);
    setStage(emoji.grounding ? "grounding" : "write");
  }

  // Step one stage back through the flow. Typed text is preserved; only `reset`
  // (New entry) clears it. Not shown on triage / submitting / result.
  function goBack() {
    if (recognizing) stopVoice();
    if (stage === "grounding") setStage("triage");
    else if (stage === "write") setStage(grounded ? "grounding" : "triage");
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
    // Quick domain triage runs alongside the full reflection; its result is the
    // entry's stored domain. Both finish before the entry is saved.
    const [domain, result] = await Promise.all([
      classifyDomainApi(text.trim()),
      processEntryApi(entries, text.trim(), knownStressors),
    ]);
    const now = Date.now();
    add({
      id: String(now),
      date: new Date().toISOString().slice(0, 10),
      promptShown: "How has today been?",
      text: text.trim(),
      riskLevel: result.analysis.risk_level,
      themes: result.analysis.themes,
      domain,
      // The stressor is chosen by the model, never the user.
      stressor: result.analysis.related_stressor?.label,
      createdAt: now,
    });
    setOutcome(result);
    // The server owns the support content. Skip it for crisis (CrisisCard only);
    // otherwise fetch the tip + grounding bundle before showing the result.
    const crisis = sos || result.analysis.risk_level === "crisis";
    if (!crisis) {
      setSupport(await fetchSupportApi(domain, result.analysis.risk_level));
    }
    setStage("result");
  }

  function reset() {
    if (recognizing) stopVoice();
    setText("");
    setOutcome(null);
    setSupport(null);
    setShowGrounding(false);
    setSos(false);
    setGrounded(false);
    setStage("triage");
  }

  const isCrisis = sos || outcome?.analysis.risk_level === "crisis";

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {(stage === "grounding" || stage === "write") && (
        <Pressable
          onPress={goBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
      )}
      {stage !== "triage" && <Text style={styles.kicker}>TODAY</Text>}

      {stage === "triage" && (
        <>
          <View style={styles.greetHeader}>
            <Text style={styles.dateLabel}>{TODAY_LABEL.toUpperCase()}</Text>
            <Text style={styles.greeting}>{greeting()}.</Text>
            <Text style={styles.h1}>How are you feeling right now?</Text>
            <Text style={styles.greetSub}>
              Tap whichever is closest. We&apos;ll take it from there.
            </Text>
          </View>

          <View style={styles.emojiRow}>
            {EMOJIS.map((item) => (
              <Pressable
                key={item.e}
                onPress={() => pickEmoji(item)}
                accessibilityRole="button"
                accessibilityLabel={`I'm feeling ${item.label}`}
                style={({ pressed }) => [
                  styles.emojiBtn,
                  item.sos && styles.emojiBtnSos,
                  pressed && styles.emojiPressed,
                  pressed && item.sos && styles.emojiPressedSos,
                ]}
              >
                <Text style={styles.emoji}>{item.e}</Text>
                <Text style={[styles.emojiLabel, item.sos && styles.emojiLabelSos]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.privacyNote}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              Your check-in stays private on this device.
            </Text>
          </View>
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
              {support?.tip ? (
                <TipCard tip={support.tip} domain={outcome.analysis.domain} />
              ) : support ? (
                <Text style={styles.supportNote}>
                  Couldn&apos;t load a tip right now.
                </Text>
              ) : null}
              {support?.grounding ? (
                showGrounding ? (
                  <GroundingTechniqueCard
                    grounding={support.grounding}
                    onDone={() => setShowGrounding(false)}
                  />
                ) : (
                  <Pressable
                    onPress={() => setShowGrounding(true)}
                    style={({ pressed }) => [
                      styles.groundingBtn,
                      pressed && styles.groundingBtnPressed,
                    ]}
                  >
                    <Text style={styles.groundingBtnText}>
                      🌀 Want a grounding technique?
                    </Text>
                  </Pressable>
                )
              ) : null}
            </>
          )}
          <Pressable onPress={reset} style={styles.secondary}>
            <Text style={styles.secondaryText}>New entry</Text>
          </Pressable>
        </>
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
  backBtn: { alignSelf: "flex-start", marginBottom: 10, paddingVertical: 2 },
  backPressed: { opacity: 0.6 },
  backText: { color: "#2f6f5e", fontWeight: "700", fontSize: 15 },
  h1: { fontSize: 24, fontWeight: "800", color: "#1d2b27", lineHeight: 30, marginBottom: 6 },
  hint: { fontSize: 14, color: "#52605b", lineHeight: 20 },
  // Triage greeting: a warm, personal header that fills the top with intent.
  greetHeader: { marginTop: 8, marginBottom: 4 },
  dateLabel: {
    color: "#7b8884",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2f6f5e",
    marginBottom: 2,
  },
  greetSub: { fontSize: 15, color: "#52605b", lineHeight: 21, marginTop: 2 },
  emojiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 24,
    marginBottom: 12,
    gap: 12,
  },
  emojiBtn: {
    // flexBasis + grow gives three even columns that fill the row and stay
    // aligned across both rows; gap (not space-between) keeps spacing uniform.
    flexBasis: "30%",
    flexGrow: 1,
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eceeed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  // The SOS tile keeps the neutral white surface; only its label is tinted so it
  // reads as "help is here" without an alarming fill.
  emojiBtnSos: {},
  // Press feedback: tint + a gentle inward press. Calm, tactile, no shadow.
  emojiPressed: {
    backgroundColor: "#eef5f2",
    borderColor: "#bfe0d6",
    transform: [{ scale: 0.96 }],
  },
  emojiPressedSos: {},
  emoji: { fontSize: 40, lineHeight: 46, textAlign: "center" },
  emojiLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#52605b",
    textAlign: "center",
  },
  emojiLabelSos: { color: "#9c352b", fontWeight: "700" },
  privacyNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 24,
  },
  privacyIcon: { fontSize: 13 },
  privacyText: { fontSize: 13, color: "#7b8884", fontWeight: "500" },
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
  ctaPressed: { backgroundColor: "#255647", transform: [{ scale: 0.99 }] },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 0.2 },
  loading: { alignItems: "center", marginTop: 40, gap: 12 },
  sosWrap: { marginBottom: 18 },
  crisisFull: { gap: 14 },
  crisisNote: { color: "#52605b", fontSize: 14, lineHeight: 20 },
  supportNote: { color: "#7a857f", fontSize: 14, marginTop: 18, fontStyle: "italic" },
  groundingBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cfe4dc",
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 16,
  },
  groundingBtnPressed: { backgroundColor: "#eef5f2" },
  groundingBtnText: { color: "#2f6f5e", fontWeight: "700", fontSize: 15 },
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
