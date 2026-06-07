# Mood Weather Map — Design Spec

## What
Add a watercolour-style weather map band to the top of the Timeline screen, showing how mood/risk has flowed over the period covered by the user's entries.

## Visual Design
- **Placement**: Above BiggestCauses, below the screen title. First thing visible on Timeline.
- **Label**: "The past few weeks" (warm, conversational) + date range on the right (e.g. "12 May – 4 Jun").
- **Band**: ~48px tall, rounded corners (12px), inside a white card with hairline border.
- **Colours**: Existing risk palette only — green (#7fae9f) for none, amber (#e0a13c) for elevated, clay-red (#b4453a) for crisis.
- **Blending**: ~15% gradient blend zones between colour changes. Green bleeds into amber, amber back into green. Watercolour wash, not discrete tiles.
- **Date markers**: Minimal — just start/end and midpoints along the bottom edge, no axis lines.
- **Empty state**: Hidden when no entries exist. Brief placeholder when 1 entry ("More entries will show the pattern").

## Scroll-linked Highlight
- As the user scrolls the timeline entries, a soft brightening region tracks which entries are currently visible on screen.
- No borders, no hard cursor — just a ~18% white gaussian overlay that fades in/out at edges.
- Implemented via `onScroll` on the ScrollView: calculate which entries are in the viewport, map their date range to a position on the band.

## Consistent Entry Dots
- Timeline entry dots already use risk colours. Ensure they stay consistent with the weather band palette (they already are — same `RISK_COLOR` map).

## Implementation Approach
- **SVG gradient**: Use `react-native-svg` (`Svg`, `LinearGradient`, `Rect`) for the band. Build gradient stops dynamically from entry data.
- **Scroll sync**: `ScrollView.onScroll` → compute visible entry indices → map to highlight position → animated `translateX`/opacity on a highlight overlay.
- **Component**: New `WeatherMap` component in `src/components/WeatherMap.tsx`. Receives `entries` array. Returns the card + band + highlight.
- **Integration**: Drop into `timeline.tsx` above `<BiggestCauses />`. Pass the same `entries` state + scroll-linked props.

## Dependencies
- `react-native-svg` (needs `npx expo install react-native-svg`)

## Files Touched
- `mobile/src/components/WeatherMap.tsx` (new)
- `mobile/app/timeline.tsx` (add WeatherMap, wire scroll sync)
- `mobile/package.json` (add react-native-svg)
