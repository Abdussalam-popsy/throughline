import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

const PHASE_MS = 4000; // box breathing: 4s in / 4s hold / 4s out / 4s hold
const CYCLES_TO_READY = 2; // ~32 seconds

type Phase = "in" | "hold1" | "out" | "hold2";
const LABEL: Record<Phase, string> = {
  in: "Breathe in",
  hold1: "Hold",
  out: "Breathe out",
  hold2: "Hold",
};

export function GroundingActivity({
  onReady,
  onSkip,
}: {
  onReady: () => void;
  onSkip: () => void;
}) {
  const scale = useRef(new Animated.Value(0.55)).current;
  const [phase, setPhase] = useState<Phase>("in");
  const [ready, setReady] = useState(false);
  const stopped = useRef(false);
  const cycles = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    breatheIn();
    return () => {
      stopped.current = true;
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function hold(next: () => void) {
    timer.current = setTimeout(() => {
      if (!stopped.current) next();
    }, PHASE_MS);
  }

  function breatheIn() {
    if (stopped.current) return;
    setPhase("in");
    Animated.timing(scale, {
      toValue: 1,
      duration: PHASE_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setPhase("hold1");
      hold(breatheOut);
    });
  }

  function breatheOut() {
    if (stopped.current) return;
    setPhase("out");
    Animated.timing(scale, {
      toValue: 0.55,
      duration: PHASE_MS,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setPhase("hold2");
      cycles.current += 1;
      if (cycles.current >= CYCLES_TO_READY) setReady(true);
      hold(breatheIn);
    });
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Let&apos;s take a moment first</Text>
      <Text style={styles.sub}>Follow the circle. There&apos;s no rush.</Text>

      <View style={styles.stage}>
        <View style={styles.halo} />
        <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
        <Text style={styles.phase}>{LABEL[phase]}</Text>
      </View>

      <Pressable
        disabled={!ready}
        onPress={onReady}
        style={({ pressed }) => [
          styles.cta,
          !ready && styles.ctaDisabled,
          pressed && ready && styles.ctaPressed,
        ]}
      >
        <Text style={[styles.ctaText, !ready && styles.ctaTextDisabled]}>
          {ready ? "I'm ready to write" : "Keep breathing…"}
        </Text>
      </Pressable>

      <Pressable onPress={onSkip} hitSlop={12}>
        <Text style={styles.skip}>Skip for now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 24, gap: 6 },
  title: { fontSize: 22, fontWeight: "800", color: "#1d2b27" },
  sub: { fontSize: 15, color: "#52605b", marginBottom: 8 },
  stage: {
    width: 260,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  // A still outer ring the breath expands toward — adds depth without a shadow.
  halo: {
    position: "absolute",
    width: 252,
    height: 252,
    borderRadius: 126,
    backgroundColor: "#f1f7f5",
    borderWidth: 1,
    borderColor: "#e0ece8",
  },
  circle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#bfe0d6",
    borderWidth: 2,
    borderColor: "#2f6f5e",
  },
  phase: { fontSize: 18, fontWeight: "700", color: "#255647" },
  cta: {
    backgroundColor: "#2f6f5e",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginTop: 12,
  },
  ctaDisabled: { backgroundColor: "#dbe5e1" },
  ctaPressed: { backgroundColor: "#255647", transform: [{ scale: 0.99 }] },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  ctaTextDisabled: { color: "#8b9893" },
  skip: { color: "#7b8884", fontSize: 14, marginTop: 14, padding: 6 },
});
