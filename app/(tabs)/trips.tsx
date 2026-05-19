import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

type Trip = {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  status: "active" | "past" | "saved";
  shared_with: string[];
  itinerary: any[];
};

const STATUS_TABS = ["all", "active", "saved", "past"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const STATUS_META: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  active: { color: "#16A34A", bg: "#F0FDF4", label: "Active" },
  saved: { color: "#7C3AED", bg: "#F5F3FF", label: "Saved" },
  past: { color: "#6B7280", bg: "#F9FAFB", label: "Past" },
};

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<StatusTab>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTrips = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setTrips(data as Trip[]);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTrips().finally(() => setLoading(false));
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  };

  const deleteTrip = (id: string) => {
    Alert.alert("Delete Trip", "Are you sure you want to delete this trip?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase.from("trips").delete().eq("id", id);
          setTrips((prev) => prev.filter((t) => t.id !== id));
        },
      },
    ]);
  };

  const updateStatus = async (id: string, status: Trip["status"]) => {
    await supabase.from("trips").update({ status }).eq("id", id);
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        })
      : "—";

  const filtered =
    filter === "all" ? trips : trips.filter((t) => t.status === filter);

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="bg-white px-6 pt-14 pb-4 border-b border-[#F3F0FF]">
        <Text className="text-[#111827] text-xl font-bold">My Trips</Text>
        <Text className="text-[#6B7280] text-xs mt-0.5">
          {trips.length} trip{trips.length !== 1 ? "s" : ""} total
        </Text>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 -mx-1"
        >
          {STATUS_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              className={`mx-1 px-4 py-2 rounded-xl ${filter === tab ? "bg-[#7C3AED]" : "bg-[#F5F3FF]"}`}
            >
              <Text
                className={`text-xs font-semibold capitalize ${filter === tab ? "text-white" : "text-[#7C3AED]"}`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#7C3AED" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7C3AED"
            />
          }
        >
          {filtered.length === 0 ? (
            <View className="items-center justify-center py-20 gap-3">
              <View className="w-16 h-16 rounded-3xl bg-[#F5F3FF] items-center justify-center">
                <Ionicons name="briefcase-outline" size={28} color="#7C3AED" />
              </View>
              <Text className="text-[#374151] text-base font-semibold">
                No trips here yet
              </Text>
              <Text className="text-[#9CA3AF] text-sm text-center">
                Use the Planner tab to create your first AI-powered trip
              </Text>
            </View>
          ) : (
            <View className="gap-3 pb-8">
              {filtered.map((trip) => {
                const meta = STATUS_META[trip.status];
                const isExpanded = expandedId === trip.id;
                const dayCount = trip.itinerary?.length ?? 0;

                return (
                  <View
                    key={trip.id}
                    className="bg-white border border-[#F3F0FF] rounded-3xl overflow-hidden"
                  >
                    {/* Card Header */}
                    <TouchableOpacity
                      className="px-5 py-4 flex-row items-center gap-4"
                      onPress={() => setExpandedId(isExpanded ? null : trip.id)}
                    >
                      <View className="w-12 h-12 rounded-2xl bg-[#F5F3FF] items-center justify-center">
                        <Ionicons name="location" size={22} color="#7C3AED" />
                      </View>

                      <View className="flex-1">
                        <Text className="text-[#111827] text-sm font-bold">
                          {trip.destination}
                        </Text>
                        <Text className="text-[#6B7280] text-xs mt-0.5">
                          {formatDate(trip.start_date)} · {dayCount} day
                          {dayCount !== 1 ? "s" : ""}
                          {trip.budget > 0
                            ? ` · ₹${trip.budget.toLocaleString("en-IN")}`
                            : ""}
                        </Text>
                      </View>

                      <View className="items-end gap-1">
                        <View
                          className="px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: meta.bg }}
                        >
                          <Text
                            className="text-xs font-semibold"
                            style={{ color: meta.color }}
                          >
                            {meta.label}
                          </Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={14}
                          color="#9CA3AF"
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Itinerary */}
                    {isExpanded && (
                      <View className="border-t border-[#F3F0FF] px-5 py-4 gap-3">
                        {/* Itinerary days */}
                        {Array.isArray(trip.itinerary) &&
                        trip.itinerary.length > 0 ? (
                          trip.itinerary.map((day: any, i: number) => (
                            <View key={i} className="gap-1.5">
                              <View className="flex-row items-center gap-2">
                                <View className="w-6 h-6 rounded-lg bg-[#7C3AED] items-center justify-center">
                                  <Text className="text-white text-[10px] font-bold">
                                    {day.day ?? i + 1}
                                  </Text>
                                </View>
                                <Text className="text-[#111827] text-xs font-bold">
                                  {day.title}
                                </Text>
                              </View>
                              {Array.isArray(day.activities) &&
                                day.activities.map((act: string, j: number) => (
                                  <View
                                    key={j}
                                    className="flex-row items-start gap-2 ml-8"
                                  >
                                    <View className="w-1 h-1 rounded-full bg-[#C4B5FD] mt-1.5" />
                                    <Text className="text-[#6B7280] text-xs flex-1">
                                      {act}
                                    </Text>
                                  </View>
                                ))}
                            </View>
                          ))
                        ) : (
                          <Text className="text-[#9CA3AF] text-xs">
                            No itinerary saved for this trip.
                          </Text>
                        )}

                        {/* Shared with */}
                        {trip.shared_with?.length > 0 && (
                          <View className="flex-row items-center gap-2 pt-1">
                            <Ionicons
                              name="people-outline"
                              size={14}
                              color="#7C3AED"
                            />
                            <Text className="text-[#6B7280] text-xs">
                              Shared with {trip.shared_with.join(", ")}
                            </Text>
                          </View>
                        )}

                        {/* Action row */}
                        <View className="flex-row gap-2 pt-1">
                          {trip.status !== "active" && (
                            <TouchableOpacity
                              className="flex-1 h-9 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl items-center justify-center"
                              onPress={() => updateStatus(trip.id, "active")}
                            >
                              <Text className="text-[#16A34A] text-xs font-semibold">
                                Mark Active
                              </Text>
                            </TouchableOpacity>
                          )}
                          {trip.status !== "past" && (
                            <TouchableOpacity
                              className="flex-1 h-9 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl items-center justify-center"
                              onPress={() => updateStatus(trip.id, "past")}
                            >
                              <Text className="text-[#6B7280] text-xs font-semibold">
                                Mark Past
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            className="w-9 h-9 bg-[#FFF1F2] border border-[#FECDD3] rounded-xl items-center justify-center"
                            onPress={() => deleteTrip(trip.id)}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={14}
                              color="#E11D48"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
