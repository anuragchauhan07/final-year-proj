import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

type TripStatus = "active" | "past" | "saved";

const STATUS_OPTIONS: { value: TripStatus; label: string; icon: string }[] = [
  { value: "active", label: "Active", icon: "🟢" },
  { value: "saved", label: "Saved", icon: "🔖" },
  { value: "past", label: "Past", icon: "🕐" },
];

const Field = ({
  label,
  icon,
  children,
  error,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  children: React.ReactNode;
  error?: string;
}) => (
  <View className="mb-4">
    <View className="flex-row items-center gap-1.5 mb-1.5">
      <Ionicons name={icon} size={13} color="#7C3AED" />
      <Text className="text-[#374151] text-xs font-semibold uppercase tracking-wide">
        {label}
      </Text>
    </View>
    {children}
    {error ? (
      <Text className="text-[#E11D48] text-xs mt-1 ml-1">{error}</Text>
    ) : null}
  </View>
);

export default function PlannerScreen() {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState<TripStatus>("active");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!destination.trim()) newErrors.destination = "Destination is required";
    if (!startDate.trim()) {
      newErrors.startDate = "Start date is required";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      newErrors.startDate = "Use format YYYY-MM-DD";
    }
    if (!endDate.trim()) {
      newErrors.endDate = "End date is required";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      newErrors.endDate = "Use format YYYY-MM-DD";
    }
    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = "End date must be after start date";
    }
    if (budget && isNaN(parseFloat(budget))) {
      newErrors.budget = "Enter a valid number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Not logged in", "Please sign in to save a trip.");
        return;
      }
      const { error } = await supabase.from("trips").insert({
        user_id: user.id,
        destination: destination.trim(),
        start_date: startDate,
        end_date: endDate,
        budget: budget ? parseFloat(budget) : 0,
        status,
        itinerary: [],
      });
      if (error) throw error;
      Alert.alert(
        "Trip Created!",
        `Your trip to ${destination} has been saved.`,
      );
      // Reset form
      setDestination("");
      setStartDate("");
      setEndDate("");
      setBudget("");
      setStatus("active");
      setErrors({});
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not save trip. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#FAFAFA]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="bg-white px-6 pt-14 pb-5 border-b border-[#F3F0FF]">
        <Text className="text-[#111827] text-xl font-bold">New Trip</Text>
        <Text className="text-[#6B7280] text-xs mt-0.5">
          Plan and save your journey
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
      >
        {/* Destination */}
        <Field
          label="Destination"
          icon="location-outline"
          error={errors.destination}
        >
          <View
            className={`flex-row items-center bg-white border rounded-2xl px-4 h-12 ${
              errors.destination ? "border-[#E11D48]" : "border-[#E9D5FF]"
            }`}
          >
            <TextInput
              className="flex-1 text-[#111827] text-sm"
              placeholder="e.g. Manali, Goa, Jaipur"
              placeholderTextColor="#C4B5FD"
              value={destination}
              onChangeText={(v) => {
                setDestination(v);
                if (errors.destination)
                  setErrors((e) => ({ ...e, destination: "" }));
              }}
            />
          </View>
        </Field>

        {/* Dates row */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field
              label="Start Date"
              icon="calendar-outline"
              error={errors.startDate}
            >
              <View
                className={`flex-row items-center bg-white border rounded-2xl px-4 h-12 ${
                  errors.startDate ? "border-[#E11D48]" : "border-[#E9D5FF]"
                }`}
              >
                <TextInput
                  className="flex-1 text-[#111827] text-sm"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#C4B5FD"
                  value={startDate}
                  onChangeText={(v) => {
                    setStartDate(v);
                    if (errors.startDate)
                      setErrors((e) => ({ ...e, startDate: "" }));
                  }}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </Field>
          </View>
          <View className="flex-1">
            <Field
              label="End Date"
              icon="calendar-outline"
              error={errors.endDate}
            >
              <View
                className={`flex-row items-center bg-white border rounded-2xl px-4 h-12 ${
                  errors.endDate ? "border-[#E11D48]" : "border-[#E9D5FF]"
                }`}
              >
                <TextInput
                  className="flex-1 text-[#111827] text-sm"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#C4B5FD"
                  value={endDate}
                  onChangeText={(v) => {
                    setEndDate(v);
                    if (errors.endDate)
                      setErrors((e) => ({ ...e, endDate: "" }));
                  }}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </Field>
          </View>
        </View>

        {/* Budget */}
        <Field label="Budget (₹)" icon="wallet-outline" error={errors.budget}>
          <View
            className={`flex-row items-center bg-white border rounded-2xl px-4 h-12 ${
              errors.budget ? "border-[#E11D48]" : "border-[#E9D5FF]"
            }`}
          >
            <Text className="text-[#7C3AED] text-sm font-bold mr-2">₹</Text>
            <TextInput
              className="flex-1 text-[#111827] text-sm"
              placeholder="e.g. 15000"
              placeholderTextColor="#C4B5FD"
              value={budget}
              onChangeText={(v) => {
                setBudget(v);
                if (errors.budget) setErrors((e) => ({ ...e, budget: "" }));
              }}
              keyboardType="numeric"
            />
          </View>
        </Field>

        {/* Status */}
        <Field label="Status" icon="flag-outline">
          <View className="flex-row gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setStatus(opt.value)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-2xl border ${
                  status === opt.value
                    ? "bg-[#7C3AED] border-[#7C3AED]"
                    : "bg-white border-[#E9D5FF]"
                }`}
              >
                <Text className="text-sm">{opt.icon}</Text>
                <Text
                  className={`text-xs font-semibold ${
                    status === opt.value ? "text-white" : "text-[#6B7280]"
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* Summary card (shown when fields filled) */}
        {destination && startDate && endDate ? (
          <View className="bg-[#7C3AED] rounded-3xl px-5 py-4 mb-4">
            <Text className="text-white/70 text-xs font-medium mb-2">
              Trip Summary
            </Text>
            <Text className="text-white text-base font-bold">
              {destination}
            </Text>
            <View className="flex-row items-center gap-2 mt-1.5">
              <Ionicons
                name="calendar-outline"
                size={12}
                color="rgba(255,255,255,0.7)"
              />
              <Text className="text-white/70 text-xs">
                {startDate} → {endDate}
              </Text>
            </View>
            {budget ? (
              <View className="flex-row items-center gap-2 mt-1">
                <Ionicons
                  name="wallet-outline"
                  size={12}
                  color="rgba(255,255,255,0.7)"
                />
                <Text className="text-white/70 text-xs">
                  Budget ₹{parseFloat(budget).toLocaleString("en-IN")}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Submit */}
        <TouchableOpacity
          className={`h-14 rounded-2xl items-center justify-center mb-10 flex-row gap-2 ${
            saving ? "bg-[#6D28D9]" : "bg-[#7C3AED]"
          }`}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="bookmark-outline" size={18} color="#fff" />
              <Text className="text-white text-sm font-bold">Save Trip</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
