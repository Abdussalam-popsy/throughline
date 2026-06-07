import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useState } from "react";
import { StyleSheet, type ColorValue } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Onboarding } from "../src/components/Onboarding";
import { UniversityPicker } from "../src/components/UniversityPicker";
import {
  hasCompletedOnboarding,
  hasSelectedUniversity,
  markOnboardingComplete,
} from "../src/services/storage";

const ACTIVE = "#2f6f5e";
const INACTIVE = "#9aa5a1";

// Each tab's icon maps to its meaning: Today = the day's entry, Timeline = time,
// Brief = a document, Support = a warm, reassuring heart. Outline when inactive,
// filled when focused, tinted by the active/inactive colors.
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];
const TAB_ICON: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  index: { active: "today", inactive: "today-outline" },
  timeline: { active: "time", inactive: "time-outline" },
  brief: { active: "document-text", inactive: "document-text-outline" },
  support: { active: "heart", inactive: "heart-outline" },
};

function tabIcon(name: keyof typeof TAB_ICON) {
  return ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons
      name={focused ? TAB_ICON[name].active : TAB_ICON[name].inactive}
      size={size}
      color={color}
    />
  );
}



export default function RootLayout() {
  // Storage is synchronous (expo-sqlite), so flags are known on first render —
  // no loading flash. First-run flow: onboarding → pick university → tabs. Each
  // step shows once and never again once its flag is set.
  // TODO: re-enable onboarding persistence. While disabled, onboarding shows on
  // every launch (handy during dev). To restore "show once", swap the line below
  // back to `useState(hasCompletedOnboarding)` and uncomment markOnboardingComplete().
  // const [onboarded, setOnboarded] = useState(hasCompletedOnboarding);
  const [onboarded, setOnboarded] = useState(false);
  const [pickedUniversity, setPickedUniversity] = useState(hasSelectedUniversity);

  function finishOnboarding() {
    // TODO: re-enable to lock in onboarding so it never shows again.
    // markOnboardingComplete();
    setOnboarded(true);
  }

  return (
    <SafeAreaProvider>
      {!onboarded ? (
        <Onboarding onDone={finishOnboarding} />
      ) : !pickedUniversity ? (
        <UniversityPicker onDone={() => setPickedUniversity(true)} />
      ) : (
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#f7faf9" },
          headerShown: false,
          tabBarActiveTintColor: ACTIVE,
          tabBarInactiveTintColor: INACTIVE,
          // White bar with a hairline top border (DESIGN.md §4) — flat, calm,
          // depth from the hairline rather than a shadow.
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopColor: "#eceeed",
            borderTopWidth: StyleSheet.hairlineWidth,
            elevation: 0,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Today", tabBarIcon: tabIcon("index") }}
        />
        <Tabs.Screen
          name="timeline"
          options={{ title: "Timeline", tabBarIcon: tabIcon("timeline") }}
        />
        <Tabs.Screen
          name="brief"
          options={{ title: "Brief", tabBarIcon: tabIcon("brief") }}
        />
        <Tabs.Screen
          name="support"
          options={{ title: "Support", tabBarIcon: tabIcon("support") }}
        />
      </Tabs>
      )}
    </SafeAreaProvider>
  );
}
