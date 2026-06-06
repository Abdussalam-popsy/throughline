import { Tabs } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

const ACTIVE = "#2f6f5e";
const INACTIVE = "#9aa5a1";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#f7faf9" },
          headerTitleStyle: { color: "#1d2b27", fontWeight: "700" },
          tabBarActiveTintColor: ACTIVE,
          tabBarInactiveTintColor: INACTIVE,
          tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: "#eceeed" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Today" }} />
        <Tabs.Screen name="timeline" options={{ title: "Timeline" }} />
        <Tabs.Screen name="brief" options={{ title: "Brief" }} />
        <Tabs.Screen name="support" options={{ title: "Support" }} />
      </Tabs>
    </SafeAreaProvider>
  );
}
