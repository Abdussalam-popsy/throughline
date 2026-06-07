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
import { classifyDomainApi, processEntryApi } from "../src/services/api";
import type { ProcessEntryResult } from "../src/lib/types";

type Stage = "home" | "mood" | "grounding" | "write" | "submitting" | "result";

const MOODS = [
  { label: "Terrible", emoji: "😞", color: "#b4453a", grounding: true },
  { label: "Bad",      emoji: "😕", color: "#e0a13c", grounding: true },
  { label: "Okay",     emoji: "😐", color: "#b6c766", grounding: false },
  { label: "Good",     emoji: "🙂", color: "#7fae9f", grounding: false },
  { label: "Awesome",  emoji: "😄", color: "#2f6f5e", grounding: false },
] as const;

const EMOTIONS = [
  { label: "Tired",       emoji: "😴" },
  { label: "Content",     emoji: "😌" },
  { label: "Grateful",    emoji: "🥹" },
  { label: "Not sure",    emoji: "😶" },
  { label: "Motivated",   emoji: "💪" },
  { label: "Anxious",     emoji: "😰" },
  { label: "Relaxed",     emoji: "😮‍💨" },
  { label: "Stressed",    emoji: "😤" },
  { label: "Lonely",      emoji: "🫂" },
  { label: "Sad",         emoji: "😢" },
  { label: "Hopeful",     emoji: "🌱" },
  { label: "Overwhelmed", emoji: "🌊" },
];

const JOURNAL_PROMPTS = ["What happened today?", "What's worrying me?", "Grateful for…"];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getWeekDates() {
  const today = new Date();
  const dow = today.getDay();
  return DAY_LABELS.map((label, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    return { label, date: d.getDate(), isToday: i === dow };
  });
}

function formatTodayLong() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export default function TodayScreen() {
  const { entries, add } = useEntries();
  const [stage, setStage] = useState<Stage>("home");
  const [selectedMoodIdx, setSelectedMoodIdx] = useState<number | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [outcome, setOutcome] = useState<ProcessEntryResult | null>(null);

  const dictationBaseRef = useRef("");
  const { recognizing, error: voiceError, start: startVoice, stop: stopVoice } =
    useVoiceInput((transcript) => {
      const base = dictationBaseRef.current;
      setText(base ? `${base} ${transcript}` : transcript);
    });

  function toggleDictation() {
    if (recognizing) { stopVoice(); return; }
    dictationBaseRef.current = text.trim();
    startVoice();
  }

  function toggleEmotion(label: string) {
    setSelectedEmotions((prev) =>
      prev.includes(label) ? prev.filter((e) => e !== label) : [...prev, label]
    );
  }

  function confirmMood() {
    if (selectedMoodIdx === null) return;
    const mood = MOODS[selectedMoodIdx];
    setStage(mood.grounding ? "grounding" : "write");
  }

  async function submit() {
    if (text.trim().length === 0) return;
    setStage("submitting");
    const knownStressors = Array.from(
      new Set(entries.map((e) => e.stressor).filter((s): s is string => !!s && s.trim().length > 0))
    ).map((label) => ({ label, domain: "general" as const }));
    const [domain, result] = await Promise.all([
      classifyDomainApi(text.trim()),
      processEntryApi(entries, text.trim(), knownStressors),
    ]);
    const now = Date.now();
    add({
      id: String(now),
      date: new Date().toISOString().slice(0, 10),
      promptShown: "What's on your mind?",
      text: text.trim(),
      riskLevel: result.analysis.risk_level,
      themes: result.analysis.themes,
      domain,
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
    setSelectedMoodIdx(null);
    setSelectedEmotions([]);
    setStage("home");
  }

  const isCrisis = outcome?.analysis.risk_level === "crisis";
  const weekDates = getWeekDates();
  const lastEntry = entries[entries.length - 1] ?? null;

  // ── HOME ────────────────────────────────────────────────
  if (stage === "home") {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Today</Text>

        {/* Week calendar strip */}
        <View style={styles.calendarRow}>
          {weekDates.map((d, i) => (
            <View key={i} style={styles.calendarCell}>
              <Text style={[styles.calDayLabel, d.isToday && styles.calDayLabelActive]}>
                {d.label}
              </Text>
              <View style={[styles.calDateCircle, d.isToday && styles.calDateCircleActive]}>
                <Text style={[styles.calDateText, d.isToday && styles.calDateTextActive]}>
                  {d.date}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Daily Thread card */}
        <View style={styles.threadCard}>
          {/* Thread icon */}
          <View style={styles.threadIconWrap}>
            <View style={[styles.threadRing, { width: 56, height: 56, opacity: 0.15 }]} />
            <View style={[styles.threadRing, { width: 38, height: 38, opacity: 0.25, top: 9, left: 9 }]} />
            <View style={[styles.threadRing, { width: 22, height: 22, opacity: 0.8, top: 17, left: 17 }]} />
          </View>
          <Text style={styles.threadTitle}>Daily Thread</Text>
          <Text style={styles.threadSub}>Track your day for {formatTodayLong()}</Text>
          <Pressable
            onPress={() => setStage("mood")}
            style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}
          >
            <Text style={styles.startBtnText}>Start</Text>
          </Pressable>
        </View>

        {/* Recent entries */}
        {lastEntry && (
          <>
            <Text style={styles.sectionLabel}>RECENT ENTRIES</Text>
            <View style={styles.entryPreviewCard}>
              <View style={[styles.entryPreviewDot,
                { backgroundColor: lastEntry.riskLevel === "crisis" ? "#b4453a"
                    : lastEntry.riskLevel === "elevated" ? "#e0a13c" : "#7fae9f" }
              ]} />
              <View style={styles.entryPreviewBody}>
                <Text style={styles.entryPreviewMeta}>
                  {lastEntry.date}{lastEntry.stressor ? `  ·  ${lastEntry.stressor}` : ""}
                </Text>
                <Text style={styles.entryPreviewText} numberOfLines={2}>{lastEntry.text}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    );
  }

  // ── MOOD + EMOTIONS ─────────────────────────────────────
  if (stage === "mood") {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>{formatTodayLong()}</Text>
        <Text style={styles.pageSubtitle}>How are you doing today?</Text>

        {/* Mood section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mood</Text>
          <Text style={styles.cardHint}>How are you feeling today?</Text>
          <View style={styles.moodRow}>
            {MOODS.map((mood, i) => (
              <Pressable
                key={mood.label}
                onPress={() => setSelectedMoodIdx(i)}
                style={styles.moodItem}
              >
                <View style={[
                  styles.moodCircle,
                  { backgroundColor: mood.color },
                  selectedMoodIdx === i && styles.moodCircleSelected,
                ]}>
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                </View>
                <Text style={[styles.moodLabel, selectedMoodIdx === i && styles.moodLabelActive]}>
                  {mood.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Emotions section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emotions</Text>
          <Text style={styles.cardHint}>What are you feeling? Pick all that apply.</Text>
          <View style={styles.emotionGrid}>
            {EMOTIONS.map((em) => {
              const active = selectedEmotions.includes(em.label);
              return (
                <Pressable
                  key={em.label}
                  onPress={() => toggleEmotion(em.label)}
                  style={styles.emotionItem}
                >
                  <View style={[styles.emotionCircle, active && styles.emotionCircleActive]}>
                    <Text style={styles.emotionEmoji}>{em.emoji}</Text>
                  </View>
                  <Text style={[styles.emotionLabel, active && styles.emotionLabelActive]}>
                    {em.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={confirmMood}
          disabled={selectedMoodIdx === null}
          style={({ pressed }) => [
            styles.cta,
            selectedMoodIdx === null && styles.ctaDisabled,
            pressed && selectedMoodIdx !== null && styles.ctaPressed,
          ]}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
        {selectedMoodIdx === null && (
          <Text style={styles.hint}>Select at least one mood to continue</Text>
        )}
      </ScrollView>
    );
  }

  // ── GROUNDING ────────────────────────────────────────────
  if (stage === "grounding") {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <GroundingActivity
          onReady={() => setStage("write")}
          onSkip={() => setStage("write")}
        />
      </ScrollView>
    );
  }

  // ── WRITE ────────────────────────────────────────────────
  if (stage === "write") {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Now, let's journal{"\n"}these thoughts.</Text>
        <Text style={styles.hint}>What's on your mind? Write or speak as little or as much as you like.</Text>

        {/* Prompt chips */}
        <View style={styles.promptChips}>
          {JOURNAL_PROMPTS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setText((prev) => prev ? `${prev} ${p}` : p)}
              style={styles.promptChip}
            >
              <Text style={styles.promptChipText}>{p}</Text>
            </Pressable>
          ))}
        </View>

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
            accessibilityLabel={recognizing ? "Stop voice dictation" : "Dictate with your voice"}
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
        {voiceError ? <Text style={styles.voiceError}>{voiceError}</Text> : null}

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
      </ScrollView>
    );
  }

  // ── SUBMITTING ───────────────────────────────────────────
  if (stage === "submitting") {
    return (
      <View style={[styles.screen, styles.loading]}>
        <ActivityIndicator color="#2f6f5e" />
        <Text style={styles.hint}>Saving and reflecting…</Text>
      </View>
    );
  }

  // ── RESULT ───────────────────────────────────────────────
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
          {outcome?.analysis.next_prompt ? (
            <View style={styles.promptCard}>
              <Text style={styles.promptLabel}>SOMETHING TO SIT WITH</Text>
              <Text style={styles.promptText}>{outcome.analysis.next_prompt}</Text>
            </View>
          ) : null}
          {outcome?.resource && (
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7faf9" },
  content: { padding: 20, paddingBottom: 48 },
  loading: { alignItems: "center", justifyContent: "center", gap: 12 },

  // ── Home
  pageTitle: { fontSize: 28, fontWeight: "800", color: "#1d2b27", marginBottom: 16 },
  pageSubtitle: { fontSize: 14, color: "#52605b", marginBottom: 20 },

  calendarRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  calendarCell: { alignItems: "center", flex: 1 },
  calDayLabel: { fontSize: 11, fontWeight: "600", color: "#9aa5a1", marginBottom: 6 },
  calDayLabelActive: { color: "#2f6f5e" },
  calDateCircle: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "#eceeed",
    alignItems: "center", justifyContent: "center",
  },
  calDateCircleActive: { backgroundColor: "#2f6f5e" },
  calDateText: { fontSize: 13, fontWeight: "500", color: "#52605b" },
  calDateTextActive: { color: "#fff", fontWeight: "700" },

  divider: { height: 1, backgroundColor: "#eceeed", marginBottom: 20 },

  threadCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#eceeed",
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  threadIconWrap: { width: 56, height: 56, marginBottom: 16, position: "relative" },
  threadRing: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "#2f6f5e",
  },
  threadTitle: { fontSize: 22, fontWeight: "800", color: "#1d2b27", marginBottom: 6 },
  threadSub: { fontSize: 13, color: "#52605b", marginBottom: 20, textAlign: "center" },
  startBtn: {
    backgroundColor: "#2f6f5e",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: "center",
    width: "100%",
  },
  startBtnPressed: { backgroundColor: "#255647" },
  startBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  sectionLabel: {
    fontSize: 10, fontWeight: "600", color: "#9aa5a1",
    letterSpacing: 1, marginBottom: 10,
  },
  entryPreviewCard: {
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: "#eceeed",
    flexDirection: "row", alignItems: "flex-start",
    padding: 14, gap: 10,
  },
  entryPreviewDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  entryPreviewBody: { flex: 1 },
  entryPreviewMeta: { fontSize: 11, color: "#9aa5a1", marginBottom: 4 },
  entryPreviewText: { fontSize: 13, color: "#1d2b27", lineHeight: 18 },

  // ── Mood + Emotions
  card: {
    backgroundColor: "#fff", borderRadius: 18,
    borderWidth: 1, borderColor: "#eceeed",
    padding: 18, marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1d2b27", marginBottom: 4 },
  cardHint: { fontSize: 12, color: "#9aa5a1", marginBottom: 16 },

  moodRow: { flexDirection: "row", justifyContent: "space-between" },
  moodItem: { alignItems: "center", flex: 1 },
  moodCircle: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center",
    marginBottom: 6,
  },
  moodCircleSelected: { borderWidth: 3, borderColor: "#1d2b27" },
  moodEmoji: { fontSize: 26 },
  moodLabel: { fontSize: 10, color: "#9aa5a1", textAlign: "center" },
  moodLabelActive: { color: "#1d2b27", fontWeight: "600" },

  emotionGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: 8,
  },
  emotionItem: { alignItems: "center", width: "22%" },
  emotionCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#eef5f2",
    borderWidth: 1.5, borderColor: "#d4e5de",
    alignItems: "center", justifyContent: "center",
    marginBottom: 5,
  },
  emotionCircleActive: { backgroundColor: "#2f6f5e", borderColor: "#2f6f5e" },
  emotionEmoji: { fontSize: 24 },
  emotionLabel: { fontSize: 10, color: "#9aa5a1", textAlign: "center" },
  emotionLabelActive: { color: "#2f6f5e", fontWeight: "600" },

  // ── Write
  h1: { fontSize: 26, fontWeight: "800", color: "#1d2b27", lineHeight: 34, marginBottom: 8 },
  hint: { fontSize: 14, color: "#52605b", lineHeight: 20, marginBottom: 16 },

  promptChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  promptChip: {
    backgroundColor: "#eef5f2", borderRadius: 20,
    borderWidth: 1, borderColor: "#d4e5de",
    paddingVertical: 7, paddingHorizontal: 14,
  },
  promptChipText: { fontSize: 12, fontWeight: "500", color: "#2f6f5e" },

  inputWrap: { position: "relative", marginBottom: 8 },
  input: {
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: "#e2e7e5",
    minHeight: 180, padding: 16, paddingBottom: 56,
    fontSize: 16, color: "#1d2b27",
  },
  micBtn: {
    position: "absolute", right: 12, bottom: 12,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#eef5f2", borderWidth: 1, borderColor: "#cfe4dc",
    alignItems: "center", justifyContent: "center",
  },
  micBtnActive: { backgroundColor: "#2f6f5e", borderColor: "#2f6f5e" },
  micPressed: { opacity: 0.7 },
  micIcon: { fontSize: 20 },
  micIconActive: { color: "#fff", fontSize: 16, fontWeight: "800" },
  micHint: { fontSize: 13, color: "#7a857f", marginBottom: 8 },
  listeningRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  listeningText: { fontSize: 13, color: "#2f6f5e", fontWeight: "600" },
  voiceError: { fontSize: 13, color: "#b3261e", marginBottom: 8 },

  // ── Shared
  cta: {
    backgroundColor: "#2f6f5e", borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
  },
  ctaDisabled: { backgroundColor: "#dbe5e1" },
  ctaPressed: { backgroundColor: "#255647" },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // ── Result
  crisisFull: { gap: 14 },
  crisisNote: { color: "#52605b", fontSize: 14, lineHeight: 20 },
  promptCard: {
    backgroundColor: "#fff", borderRadius: 16,
    borderWidth: 1, borderColor: "#eceeed",
    padding: 18, marginTop: 16,
  },
  promptLabel: {
    color: "#2f6f5e", fontWeight: "700",
    fontSize: 11, letterSpacing: 1, marginBottom: 6,
  },
  promptText: { fontSize: 17, color: "#1d2b27", lineHeight: 24 },
  secondary: { alignItems: "center", marginTop: 22, padding: 8 },
  secondaryText: { color: "#2f6f5e", fontWeight: "700", fontSize: 15 },
});
