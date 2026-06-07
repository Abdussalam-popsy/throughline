import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { University } from "../lib/types";
import { fetchUniversitiesApi } from "../services/api";
import { saveUniversity } from "../services/storage";

/**
 * Shown once after onboarding: the user picks their university from a dropdown
 * (the full list comes from the backend). On confirm, the chosen service's
 * contact details are persisted to SQLite so the Support page can show them.
 */
export function UniversityPicker({ onDone }: { onDone: () => void }) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<University | null>(null);

  async function load() {
    setLoading(true);
    setUniversities(await fetchUniversitiesApi());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return universities;
    return universities.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q)
    );
  }, [universities, query]);

  function choose(u: University) {
    setSelected(u);
    setOpen(false);
    setQuery("");
  }

  function confirm() {
    if (!selected) return;
    saveUniversity(selected);
    onDone();
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.kicker}>ONE LAST THING</Text>
        <Text style={styles.h1}>Select your university</Text>
        <Text style={styles.sub}>
          We&apos;ll add your university&apos;s mental health service to your
          Support page, so help is always one tap away.
        </Text>

        <Pressable
          onPress={() => !loading && setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Choose your university"
          style={({ pressed }) => [styles.select, pressed && styles.pressed]}
        >
          <Text
            style={[styles.selectText, !selected && styles.selectPlaceholder]}
            numberOfLines={1}
          >
            {loading
              ? "Loading universities…"
              : selected
                ? selected.name
                : "Choose your university"}
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color="#2f6f5e" />
          ) : (
            <Ionicons name="chevron-down" size={20} color="#7b8884" />
          )}
        </Pressable>

        {!loading && universities.length === 0 ? (
          <Pressable onPress={load} hitSlop={8} style={styles.retry}>
            <Text style={styles.retryText}>
              Couldn&apos;t load the list. Tap to try again.
            </Text>
          </Pressable>
        ) : null}

        {selected ? (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>{selected.serviceName}</Text>
            {selected.phone ? (
              <Text style={styles.previewLine}>Phone · {selected.phone}</Text>
            ) : null}
            {selected.email ? (
              <Text style={styles.previewLine}>Email · {selected.email}</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Pressable
          onPress={confirm}
          disabled={!selected}
          accessibilityRole="button"
          accessibilityLabel="Continue"
          style={({ pressed }) => [
            styles.cta,
            !selected && styles.ctaDisabled,
            pressed && selected && styles.ctaPressed,
          ]}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </View>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <SafeAreaView edges={["bottom"]} style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Your university</Text>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={24} color="#52605b" />
              </Pressable>
            </View>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color="#9aa5a1" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name or city"
                placeholderTextColor="#9aa5a1"
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(u) => u.key}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.empty}>No universities match.</Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => choose(item)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowName}>{item.name}</Text>
                    <Text style={styles.rowCity}>{item.city}</Text>
                  </View>
                  {selected?.key === item.key ? (
                    <Ionicons name="checkmark" size={20} color="#2f6f5e" />
                  ) : null}
                </Pressable>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f7faf9" },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  kicker: {
    color: "#2f6f5e",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  h1: { fontSize: 28, fontWeight: "800", color: "#1d2b27", lineHeight: 34 },
  sub: {
    fontSize: 16,
    color: "#52605b",
    marginTop: 10,
    lineHeight: 23,
    marginBottom: 28,
  },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d4e5de",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  pressed: { opacity: 0.7 },
  selectText: { flex: 1, fontSize: 16, color: "#1d2b27", fontWeight: "600" },
  selectPlaceholder: { color: "#9aa5a1", fontWeight: "500" },
  retry: { marginTop: 14 },
  retryText: { color: "#b4453a", fontSize: 14, fontWeight: "600" },
  preview: {
    marginTop: 20,
    backgroundColor: "#eef5f2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d4e5de",
    padding: 16,
    gap: 4,
  },
  previewTitle: { fontSize: 15, fontWeight: "700", color: "#1d2b27" },
  previewLine: { fontSize: 14, color: "#52605b" },
  footer: { paddingHorizontal: 20, paddingBottom: 12, paddingTop: 8 },
  cta: {
    backgroundColor: "#2f6f5e",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaDisabled: { backgroundColor: "#b9cec7" },
  ctaPressed: { backgroundColor: "#255647", transform: [{ scale: 0.99 }] },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 0.2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(29,43,39,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#f7faf9",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "82%",
    paddingTop: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#1d2b27" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1ebe7",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#1d2b27" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e6ece9",
  },
  rowPressed: { backgroundColor: "#eef5f2" },
  rowText: { flex: 1, paddingRight: 12 },
  rowName: { fontSize: 16, color: "#1d2b27", fontWeight: "600" },
  rowCity: { fontSize: 13, color: "#7b8884", marginTop: 2 },
  empty: { textAlign: "center", color: "#7b8884", paddingVertical: 32, fontSize: 15 },
});
