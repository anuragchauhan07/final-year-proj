import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

type FormField = "name" | "phone" | "email" | "password" | "confirmPassword";

const fields: {
  key: FormField;
  label: string;
  placeholder: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  keyboard?: "default" | "email-address" | "phone-pad";
  secure?: boolean;
  capitalize?: "none" | "words";
}[] = [
  {
    key: "name",
    label: "Full Name",
    placeholder: "John Doe",
    icon: "person-outline",
    capitalize: "words",
  },
  {
    key: "phone",
    label: "Phone Number",
    placeholder: "+91 98765 43210",
    icon: "call-outline",
    keyboard: "phone-pad",
  },
  {
    key: "email",
    label: "Email",
    placeholder: "you@example.com",
    icon: "mail-outline",
    keyboard: "email-address",
    capitalize: "none",
  },
  {
    key: "password",
    label: "Password",
    placeholder: "Min. 6 characters",
    icon: "lock-closed-outline",
    secure: true,
  },
  {
    key: "confirmPassword",
    label: "Confirm Password",
    placeholder: "Re-enter password",
    icon: "lock-closed-outline",
    secure: true,
  },
];

export default function RegisterScreen() {
  const [form, setForm] = useState<Record<FormField, string>>({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: FormField, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (!/^\+?[0-9]{7,15}$/.test(form.phone.trim()))
      return "Enter a valid phone number.";
    if (!form.email.trim()) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email.";
    if (form.password.length < 6)
      return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword)
      return "Passwords do not match.";
    return null;
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Validation Error", err);
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { name: form.name.trim(), phone: form.phone.trim() } },
      });
      if (signUpError) throw signUpError;
      Alert.alert("Account Created!", "Welcome aboard. You can now log in.", [
        { text: "Go to Login", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Registration Failed",
        err.message || "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Purple top accent bar */}
      <View className="h-1 bg-[#7C3AED]" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-14 pb-6">
          <View className="w-12 h-12 rounded-2xl bg-[#7C3AED] items-center justify-center mb-6">
            <Ionicons name="airplane" size={24} color="#fff" />
          </View>
          <Text className="text-[#111827] text-3xl font-bold tracking-tight">
            Create Account
          </Text>
          <Text className="text-[#6B7280] text-base mt-2">
            Your AI travel companion awaits
          </Text>
        </View>

        {/* Form */}
        <View className="px-6 flex-1 gap-4">
          {fields.map((field) => (
            <View key={field.key}>
              <Text className="text-[#374151] text-sm mb-2 font-semibold">
                {field.label}
              </Text>
              <View className="flex-row items-center bg-[#F9F5FF] border border-[#E9D5FF] rounded-2xl px-4 h-14">
                <Ionicons name={field.icon} size={18} color="#7C3AED" />
                <TextInput
                  className="flex-1 text-[#111827] text-base ml-3"
                  placeholder={field.placeholder}
                  placeholderTextColor="#C4B5FD"
                  value={form[field.key]}
                  onChangeText={(v) => handleChange(field.key, v)}
                  keyboardType={field.keyboard ?? "default"}
                  autoCapitalize={field.capitalize ?? "none"}
                  secureTextEntry={field.secure ? !showPassword : false}
                />
                {field.secure && field.key === "password" && (
                  <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#7C3AED"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {/* Terms note */}
          <Text className="text-[#9CA3AF] text-xs text-center mt-1">
            By creating an account, you agree to our{" "}
            <Text className="text-[#7C3AED] font-semibold">
              Terms of Service
            </Text>
          </Text>

          {/* Register Button */}
          <TouchableOpacity
            className={`h-14 rounded-2xl items-center justify-center mt-2 ${
              loading ? "bg-[#6D28D9]" : "bg-[#7C3AED]"
            }`}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-bold tracking-wide">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View className="flex-row justify-center items-center pb-10 mt-2">
            <Text className="text-[#6B7280] text-sm">
              Already have an account?{" "}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-[#7C3AED] text-sm font-bold">
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
