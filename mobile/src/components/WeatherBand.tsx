import { StyleSheet, Text, View } from "react-native";
import type { Entry, RiskLevel } from "../lib/types";

/**
 * "Weather map" — a soft mood-terrain that shows the shape of someone's risk
 * level over time. Each entry is a control-point at its real date position;
 * the band blends both colour AND height between them, so calm reads as a low
 * green ridge and rough patches swell into taller amber / clay-red peaks. The
 * silhouette is what stops it looking like a flat block.
 *
 * Purely data-driven: pass the same `entries` the timeline renders. No native
 * gradient/SVG dependency — the curve is built from thin interpolated columns
 * so it runs on the current dev client as-is.
 */

const RISK_COLOR: Record<RiskLevel, string> = {
  none: "#7fae9f",
  elevated: "#e0a13c",
  crisis: "#c25b4e",
};

// How much vertical "weight" each risk level carries. Calm still has presence
// so the ridge never collapses to nothing; rough patches rise above it.
const RISK_HEIGHT: Record<RiskLevel, number> = {
  none: 0.34,
  elevated: 0.72,
  crisis: 1,
};

// More columns = finer silhouette. High count + a blur pass turns the stepped
// terrain into smooth wave slopes.
const COLUMNS = 140;
// Blur window (in columns) applied to height + colour. Wider = gentler waves.
const SMOOTH_RADIUS = 12;
const SMOOTH_PASSES = 2;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const WHITE: RGB = { r: 255, g: 255, b: 255 };

// A soft top-down light overlay: stacked translucent white strips that fade to
// nothing, giving the flat fill some vertical depth like watercolour.
const SHEEN = Array.from({ length: 14 }, (_, i) =>
  Math.max(0, 0.11 * (1 - i / 9))
);

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbStr({ r, g, b }: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

// Parse an ISO date (YYYY-MM-DD) as UTC midnight so day boundaries don't drift
// with the device timezone.
function parseDate(d: string): number {
  return Date.parse(`${d}T00:00:00Z`);
}

function fmt(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

type Point = { t: number; rgb: RGB; h: number };
type Sample = { rgb: RGB; h: number };

/** Colour + height at normalised position p (0..1) along the timeline. */
function sampleAt(p: number, points: Point[]): Sample {
  const first = points[0];
  const last = points[points.length - 1];
  if (points.length === 1 || p <= first.t) return { rgb: first.rgb, h: first.h };
  if (p >= last.t) return { rgb: last.rgb, h: last.h };
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (p >= a.t && p <= b.t) {
      const span = b.t - a.t;
      const local = span === 0 ? 0 : (p - a.t) / span;
      return { rgb: mix(a.rgb, b.rgb, local), h: lerp(a.h, b.h, local) };
    }
  }
  return { rgb: last.rgb, h: last.h };
}

/** Box blur with clamped edges. Repeated passes approximate a gaussian. */
function smooth(values: number[], radius: number, passes: number): number[] {
  let out = values;
  for (let pass = 0; pass < passes; pass++) {
    const src = out;
    const n = src.length;
    const next = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i - radius; j <= i + radius; j++) {
        const k = j < 0 ? 0 : j >= n ? n - 1 : j;
        sum += src[k];
        count++;
      }
      next[i] = sum / count;
    }
    out = next;
  }
  return out;
}

export function WeatherBand({ entries }: { entries: Entry[] }) {
  const days = entries
    .map((e) => ({ ms: parseDate(e.date), risk: e.riskLevel ?? "none" }))
    .filter((e) => !Number.isNaN(e.ms))
    .sort((a, b) => a.ms - b.ms);

  // Need at least two days to draw a meaningful shape.
  if (days.length < 2) return null;

  const startMs = days[0].ms;
  const endMs = days[days.length - 1].ms;
  const range = endMs - startMs;

  const points: Point[] = days.map((d) => ({
    t: range === 0 ? 0.5 : (d.ms - startMs) / range,
    rgb: hexToRgb(RISK_COLOR[d.risk]),
    h: RISK_HEIGHT[d.risk],
  }));

  const raw = Array.from({ length: COLUMNS }, (_, i) =>
    sampleAt(i / (COLUMNS - 1), points)
  );

  // Smooth height + each colour channel independently so the stepped terrain
  // melts into continuous wave slopes.
  const heights = smooth(raw.map((s) => s.h), SMOOTH_RADIUS, SMOOTH_PASSES);
  const reds = smooth(raw.map((s) => s.rgb.r), SMOOTH_RADIUS, SMOOTH_PASSES);
  const greens = smooth(raw.map((s) => s.rgb.g), SMOOTH_RADIUS, SMOOTH_PASSES);
  const blues = smooth(raw.map((s) => s.rgb.b), SMOOTH_RADIUS, SMOOTH_PASSES);
  const columns = raw.map((_, i) => ({
    h: heights[i],
    rgb: {
      r: Math.round(reds[i]),
      g: Math.round(greens[i]),
      b: Math.round(blues[i]),
    },
  }));

  const labels = [0, 1 / 3, 2 / 3, 1].map((f) => fmt(startMs + range * f));

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>The past few weeks</Text>
        <Text style={styles.headerRange}>
          {fmt(startMs)} – {fmt(endMs)}
        </Text>
      </View>

      <View style={styles.plot}>
        {columns.map((col, i) => (
          <View key={i} style={styles.column}>
            <View
              style={[
                styles.fill,
                {
                  height: `${col.h * 100}%`,
                  backgroundColor: rgbStr(col.rgb),
                  borderTopColor: rgbStr(mix(col.rgb, WHITE, 0.45)),
                },
              ]}
            />
          </View>
        ))}
        <View pointerEvents="none" style={styles.sheen}>
          {SHEEN.map((opacity, i) => (
            <View
              key={i}
              style={{ flex: 1, backgroundColor: `rgba(255,255,255,${opacity})` }}
            />
          ))}
        </View>
      </View>

      <View style={styles.labelRow}>
        {labels.map((label, i) => (
          <Text key={i} style={styles.dateLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eceeed",
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLabel: { color: "#52605b", fontSize: 13, fontWeight: "500" },
  headerRange: { color: "#7b8884", fontSize: 11 },
  // The trough the terrain sits in — a faint track so low ridges still read.
  plot: {
    height: 72,
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#f2f6f4",
    borderRadius: 12,
    overflow: "hidden",
  },
  column: { flex: 1, height: "100%", justifyContent: "flex-end" },
  // borderTop traces a lighter crest line along the wave surface.
  fill: { width: "100%", borderTopWidth: 1.5 },
  sheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "column",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 2,
  },
  dateLabel: { color: "#7b8884", fontSize: 10 },
});
