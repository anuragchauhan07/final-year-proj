import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

type Trip = {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  status: string;
};

type QuickAction = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  route: string;
  bg: string;
  iconColor: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: "map-outline",
    label: "Plan Trip",
    route: "/(tabs)/planner",
    bg: "#F5F3FF",
    iconColor: "#7C3AED",
  },
  {
    icon: "search-outline",
    label: "Explore",
    route: "/(tabs)/planner",
    bg: "#FFF7ED",
    iconColor: "#EA580C",
  },
  {
    icon: "navigate-outline",
    label: "Navigate",
    route: "/(tabs)/mobility",
    bg: "#F0FDF4",
    iconColor: "#16A34A",
  },
  {
    icon: "sparkles-outline",
    label: "AI Chat",
    route: "/(tabs)/assistant",
    bg: "#FFF1F2",
    iconColor: "#E11D48",
  },
];

const AI_TIPS = [
  "Best time to visit Rajasthan is Oct–Mar 🌤️",
  "Manali roads are open — snow forecast this week ❄️",
  "Goa beach season starts November 🏖️",
  "Kedarnath temple opens May 10th 🛕",
];

export default function HomeScreen() {
  const [userName, setUserName] = useState("Traveller");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();
    if (profile?.name) setUserName(profile.name.split(" ")[0]);

    const { data: tripData } = await supabase
      .from("trips")
      .select("id, destination, start_date, end_date, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("start_date", { ascending: true })
      .limit(3);
    if (tripData) setTrips(tripData);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % AI_TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7C3AED"
          />
        }
      >
        {/* ── Header ── */}
        <View className="bg-white px-6 pt-14 pb-5 border-b border-[#F3F0FF]">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[#9CA3AF] text-sm font-medium">
                {getGreeting()},
              </Text>
              <Text className="text-[#111827] text-2xl font-bold mt-0.5">
                {userName} 👋
              </Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 rounded-2xl bg-[#F5F3FF] items-center justify-center"
              onPress={() => router.push("/(tabs)/assistant")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#7C3AED"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-5 pt-5 gap-5">
          {/* ── AI Tip Banner ── */}
          <View className="bg-[#7C3AED] rounded-3xl px-5 py-4 flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-2xl bg-white/20 items-center justify-center">
              <Ionicons name="sparkles" size={18} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-white/70 text-xs font-medium mb-0.5">
                AI Travel Tip
              </Text>
              <Text className="text-white text-sm font-semibold leading-snug">
                {AI_TIPS[tipIndex]}
              </Text>
            </View>
          </View>

          {/* ── Quick Actions ── */}
          <View>
            <Text className="text-[#111827] text-base font-bold mb-3">
              Quick Actions
            </Text>
            <View className="flex-row gap-3">
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  className="flex-1 items-center py-4 rounded-2xl border border-[#F3F0FF]"
                  style={{ backgroundColor: action.bg }}
                  onPress={() => router.push(action.route as any)}
                >
                  <Ionicons
                    name={action.icon}
                    size={22}
                    color={action.iconColor}
                  />
                  <Text className="text-[#374151] text-xs font-semibold mt-2">
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Upcoming Trips ── */}
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[#111827] text-base font-bold">
                Upcoming Trips
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/trips")}>
                <Text className="text-[#7C3AED] text-sm font-semibold">
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            {trips.length === 0 ? (
              <TouchableOpacity
                className="bg-white border border-dashed border-[#DDD6FE] rounded-3xl py-8 items-center gap-2"
                onPress={() => router.push("/(tabs)/planner")}
              >
                <View className="w-12 h-12 rounded-2xl bg-[#F5F3FF] items-center justify-center">
                  <Ionicons name="add" size={24} color="#7C3AED" />
                </View>
                <Text className="text-[#374151] text-sm font-semibold">
                  Plan your first trip
                </Text>
                <Text className="text-[#9CA3AF] text-xs">
                  Tap to start with AI assistance
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="gap-3">
                {trips.map((trip) => (
                  <TouchableOpacity
                    key={trip.id}
                    className="bg-white border border-[#F3F0FF] rounded-3xl px-5 py-4 flex-row items-center gap-4"
                    onPress={() => router.push("/(tabs)/trips")}
                  >
                    <View className="w-11 h-11 rounded-2xl bg-[#F5F3FF] items-center justify-center">
                      <Ionicons name="location" size={20} color="#7C3AED" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#111827] text-sm font-bold">
                        {trip.destination}
                      </Text>
                      {trip.start_date && (
                        <Text className="text-[#6B7280] text-xs mt-0.5">
                          {formatDate(trip.start_date)}
                          {trip.end_date
                            ? ` → ${formatDate(trip.end_date)}`
                            : ""}
                        </Text>
                      )}
                    </View>
                    <View className="bg-[#EDE9FE] px-3 py-1 rounded-full">
                      <Text className="text-[#7C3AED] text-xs font-semibold capitalize">
                        {trip.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Explore Cards ── */}
          <View>
            <Text className="text-[#111827] text-base font-bold mb-3">
              Trending Destinations
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-1"
            >
              {[
                {
                  name: "Manali",
                  tag: "Mountains",
                  emoji: "🏔️",
                  color: "#EDE9FE",
                },
                { name: "Goa", tag: "Beaches", emoji: "🏖️", color: "#FFF7ED" },
                {
                  name: "Jaipur",
                  tag: "Heritage",
                  emoji: "🏯",
                  color: "#FFF1F2",
                },
                {
                  name: "Kerala",
                  tag: "Nature",
                  emoji: "🌿",
                  color: "#F0FDF4",
                },
              ].map((dest) => (
                <TouchableOpacity
                  key={dest.name}
                  className="mx-1.5 rounded-3xl px-5 py-4 w-36 justify-between"
                  style={{ backgroundColor: dest.color }}
                  onPress={() => router.push("/(tabs)/planner")}
                >
                  <Text className="text-3xl mb-3">{dest.emoji}</Text>
                  <Text className="text-[#111827] text-sm font-bold">
                    {dest.name}
                  </Text>
                  <Text className="text-[#6B7280] text-xs mt-0.5">
                    {dest.tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── AI Features Banner ── */}
          <TouchableOpacity
            className="bg-white border border-[#EDE9FE] rounded-3xl px-5 py-4 flex-row items-center gap-4 mb-6"
            onPress={() => router.push("/(tabs)/assistant")}
          >
            <View className="w-12 h-12 rounded-2xl bg-[#7C3AED] items-center justify-center">
              <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-[#111827] text-sm font-bold">
                Ask AI Assistant
              </Text>
              <Text className="text-[#6B7280] text-xs mt-0.5">
                Packing lists, safety tips, local guides…
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
