import { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Slide = {
  image: ImageSourcePropType;
  title: string;
  body: string;
};

// Illustrations were cropped from assets/onboarding/fotor-ai-2026060774956.jpg —
// one tile per slide. Copy follows the warm, second-person voice in DESIGN.md §7.
const SLIDES: Slide[] = [
  {
    image: require("../../assets/onboarding/slide1.png"),
    title: "A safe space to be you",
    body: "Your journal is private and judgment-free. Write freely, at your own pace.",
  },
  {
    image: require("../../assets/onboarding/slide2.png"),
    title: "Track how you feel",
    body: "Quick check-ins help you notice patterns and understand what matters most.",
  },
  {
    image: require("../../assets/onboarding/slide3.png"),
    title: "See your story unfold",
    body: "Your timeline highlights what's been on your mind and how things change over time.",
  },
  {
    image: require("../../assets/onboarding/slide4.png"),
    title: "Get a clear summary",
    body: "Create a one-page brief you can share with a clinician — or keep just for yourself.",
  },
  {
    image: require("../../assets/onboarding/slide5.png"),
    title: "Help is always here",
    body: "Find trusted resources and reach out any time. You don't have to handle this alone.",
  },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { width } = Dimensions.get("window");
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) setIndex(next);
  }

  function goNext() {
    if (isLast) {
      onDone();
      return;
    }
    const next = index + 1;
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setIndex(next);
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <View style={styles.topBar}>
        {!isLast ? (
          <Pressable
            onPress={onDone}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <View style={styles.imageWrap}>
              <Image
                source={slide.image}
                style={styles.image}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.title}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <Pressable
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? "Get started" : "Next"}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <Text style={styles.ctaText}>{isLast ? "Get started" : "Next"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7faf9" },
  topBar: {
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
  },
  skip: { color: "#7b8884", fontSize: 15, fontWeight: "600" },
  pressed: { opacity: 0.6 },
  slide: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrap: {
    width: "100%",
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  image: { width: "100%", height: "100%" },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1d2b27",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: "#52605b",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 340,
  },
  footer: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#cfe4dc",
  },
  dotActive: { width: 22, backgroundColor: "#2f6f5e" },
  cta: {
    backgroundColor: "#2f6f5e",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaPressed: { backgroundColor: "#255647", transform: [{ scale: 0.99 }] },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 0.2 },
});
