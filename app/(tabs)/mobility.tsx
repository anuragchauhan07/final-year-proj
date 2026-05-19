import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ModeTab = "transit" | "rides" | "parking";

const RIDE_OPTIONS = [
  {
    name: "Ola",
    icon: "🚗",
    eta: "3 min",
    price: "₹85–120",
    scheme: "olacabs://",
  },
  {
    name: "Uber",
    icon: "🚙",
    eta: "5 min",
    price: "₹90–130",
    scheme: "uber://",
  },
  {
    name: "Rapido",
    icon: "🛵",
    eta: "2 min",
    price: "₹40–60",
    scheme: "https://rapido.bike",
  },
  { name: "Auto", icon: "🛺", eta: "4 min", price: "₹50–80", scheme: null },
];

const TRANSIT_LINES = [
  {
    line: "Delhi Metro – Blue Line",
    status: "On Time",
    color: "#16A34A",
    next: "3 min",
  },
  {
    line: "BEST Bus 351 (Mumbai)",
    status: "Delayed",
    color: "#D97706",
    next: "12 min",
  },
  {
    line: "Namma Metro – Purple Line",
    status: "On Time",
    color: "#16A34A",
    next: "7 min",
  },
  {
    line: "Chennai MRT – Line 2",
    status: "Disrupted",
    color: "#E11D48",
    next: "—",
  },
];

const PARKING_SPOTS = [
  {
    name: "Connaught Place Parking, Delhi",
    spots: 12,
    distance: "0.3 km",
    price: "₹20/hr",
  },
  {
    name: "Phoenix Palassio Mall, Lucknow",
    spots: 3,
    distance: "0.8 km",
    price: "₹30/hr",
  },
  {
    name: "MG Road Basement, Bengaluru",
    spots: 28,
    distance: "1.2 km",
    price: "₹15/hr",
  },
  {
    name: "Bandra Kurla Complex, Mumbai",
    spots: 0,
    distance: "1.5 km",
    price: "₹40/hr",
  },
];

export default function MobilityScreen() {
  const [activeTab, setActiveTab] = useState<ModeTab>("transit");

  const openMaps = (query: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  };

  const TABS: {
    key: ModeTab;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
  }[] = [
    { key: "transit", icon: "train-outline", label: "Transit" },
    { key: "rides", icon: "car-outline", label: "Rides" },
    { key: "parking", icon: "business-outline", label: "Parking" },
  ];

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="bg-white px-6 pt-14 pb-4 border-b border-[#F3F0FF]">
        <Text className="text-[#111827] text-xl font-bold">Mobility</Text>
        <Text className="text-[#6B7280] text-xs mt-0.5">
          Smart navigation & transit
        </Text>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 -mx-1"
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`mx-1 flex-row items-center gap-1.5 px-4 py-2 rounded-xl ${activeTab === tab.key ? "bg-[#7C3AED]" : "bg-[#F5F3FF]"}`}
            >
              <Ionicons
                name={tab.icon}
                size={13}
                color={activeTab === tab.key ? "#fff" : "#7C3AED"}
              />
              <Text
                className={`text-xs font-semibold ${activeTab === tab.key ? "text-white" : "text-[#7C3AED]"}`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-5"
        showsVerticalScrollIndicator={false}
      >
        {/* ── TRANSIT TAB ── */}
        {activeTab === "transit" && (
          <View className="gap-3 pb-8">
            <View className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl px-4 py-3 flex-row gap-3 items-start">
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#7C3AED"
              />
              <Text className="text-[#6B7280] text-xs flex-1 leading-relaxed">
                Live status is indicative. Tap any line to open in Google Maps
                for real-time tracking.
              </Text>
            </View>

            {TRANSIT_LINES.map((line) => (
              <TouchableOpacity
                key={line.line}
                className="bg-white border border-[#F3F0FF] rounded-3xl px-5 py-4 flex-row items-center gap-4"
                onPress={() => openMaps(line.line)}
              >
                <View className="w-10 h-10 rounded-2xl bg-[#F5F3FF] items-center justify-center">
                  <Ionicons name="train-outline" size={18} color="#7C3AED" />
                </View>
                <View className="flex-1">
                  <Text className="text-[#111827] text-sm font-bold">
                    {line.line}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-1">
                    <View
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: line.color }}
                    />
                    <Text
                      className="text-xs font-medium"
                      style={{ color: line.color }}
                    >
                      {line.status}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-[#111827] text-sm font-bold">
                    {line.next}
                  </Text>
                  <Text className="text-[#9CA3AF] text-xs">next</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              className="bg-white border border-[#F3F0FF] rounded-3xl px-5 py-4 flex-row items-center justify-between"
              onPress={() => openMaps("metro stations near me India")}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-2xl bg-[#EDE9FE] items-center justify-center">
                  <Ionicons name="map-outline" size={18} color="#7C3AED" />
                </View>
                <Text className="text-[#111827] text-sm font-semibold">
                  Open Full Transit Map
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── RIDES TAB ── */}
        {activeTab === "rides" && (
          <View className="gap-3 pb-8">
            <View className="bg-[#7C3AED] rounded-3xl px-5 py-4 mb-1">
              <Text className="text-white font-bold text-sm mb-0.5">
                Ride Booking Hub
              </Text>
              <Text className="text-white/70 text-xs">
                Compare options and open your preferred app
              </Text>
            </View>

            {RIDE_OPTIONS.map((ride) => (
              <TouchableOpacity
                key={ride.name}
                className="bg-white border border-[#F3F0FF] rounded-3xl px-5 py-4 flex-row items-center gap-4"
                onPress={() => {
                  if (ride.scheme) {
                    Linking.openURL(ride.scheme).catch(() =>
                      Alert.alert(
                        "App not installed",
                        `Please install ${ride.name} app.`,
                      ),
                    );
                  } else {
                    Alert.alert(
                      "Book Auto",
                      "Use local booking or flag one down nearby.",
                    );
                  }
                }}
              >
                <Text className="text-3xl">{ride.icon}</Text>
                <View className="flex-1">
                  <Text className="text-[#111827] text-sm font-bold">
                    {ride.name}
                  </Text>
                  <Text className="text-[#6B7280] text-xs mt-0.5">
                    ETA {ride.eta}
                  </Text>
                </View>
                <View className="items-end gap-1">
                  <Text className="text-[#111827] text-sm font-bold">
                    {ride.price}
                  </Text>
                  <View className="bg-[#EDE9FE] px-2.5 py-0.5 rounded-full">
                    <Text className="text-[#7C3AED] text-xs font-semibold">
                      Book
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            <View className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl px-4 py-3 flex-row gap-3 items-start">
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#EA580C"
              />
              <Text className="text-[#92400E] text-xs flex-1 leading-relaxed">
                ETAs and prices are estimated. Final price depends on traffic,
                surge, and route.
              </Text>
            </View>
          </View>
        )}

        {/* ── PARKING TAB ── */}
        {activeTab === "parking" && (
          <View className="gap-3 pb-8">
            <View className="bg-[#7C3AED] rounded-3xl px-5 py-4 mb-1">
              <Text className="text-white font-bold text-sm mb-0.5">
                Nearby Parking
              </Text>
              <Text className="text-white/70 text-xs">
                Predicted availability near popular locations
              </Text>
            </View>

            {PARKING_SPOTS.map((spot) => {
              const available = spot.spots > 0;
              return (
                <TouchableOpacity
                  key={spot.name}
                  className="bg-white border border-[#F3F0FF] rounded-3xl px-5 py-4 flex-row items-center gap-4"
                  onPress={() => openMaps(spot.name)}
                >
                  <View
                    className={`w-11 h-11 rounded-2xl items-center justify-center ${available ? "bg-[#F0FDF4]" : "bg-[#FFF1F2]"}`}
                  >
                    <Ionicons
                      name="car"
                      size={20}
                      color={available ? "#16A34A" : "#E11D48"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#111827] text-sm font-bold">
                      {spot.name}
                    </Text>
                    <Text className="text-[#6B7280] text-xs mt-0.5">
                      {spot.distance} away · {spot.price}
                    </Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text
                      className={`text-sm font-bold ${available ? "text-[#16A34A]" : "text-[#E11D48]"}`}
                    >
                      {available ? spot.spots : "Full"}
                    </Text>
                    {available && (
                      <Text className="text-[#9CA3AF] text-xs">spots</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              className="bg-white border border-[#F3F0FF] rounded-3xl px-5 py-4 flex-row items-center justify-between"
              onPress={() => openMaps("parking near me")}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-2xl bg-[#EDE9FE] items-center justify-center">
                  <Ionicons name="search-outline" size={18} color="#7C3AED" />
                </View>
                <Text className="text-[#111827] text-sm font-semibold">
                  Find More on Maps
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
