import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const tabs: {
  name: string;
  title: string;
  icon: IoniconsName;
  activeIcon: IoniconsName;
}[] = [
  { name: "home", title: "Home", icon: "home-outline", activeIcon: "home" },
  { name: "planner", title: "Planner", icon: "map-outline", activeIcon: "map" },
  {
    name: "trips",
    title: "My Trips",
    icon: "briefcase-outline",
    activeIcon: "briefcase",
  },
  {
    name: "mobility",
    title: "Mobility",
    icon: "navigate-outline",
    activeIcon: "navigate",
  },
  {
    name: "assistant",
    title: "AI",
    icon: "sparkles-outline",
    activeIcon: "sparkles",
  },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#F3F0FF",
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.activeIcon : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
