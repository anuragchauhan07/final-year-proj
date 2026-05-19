import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { Link, router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing Fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      router.replace("/(tabs)/home");
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Invalid credentials.");
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

      <View className="flex-1 px-6 justify-center">
        {/* Logo / Brand */}
        <View className="mb-10">
          <View className="w-14 h-14 rounded-2xl bg-[#7C3AED] items-center justify-center mb-6">
            <Ionicons name="airplane" size={28} color="#fff" />
          </View>
          <Text className="text-[#111827] text-4xl font-bold tracking-tight">
            Welcome back
          </Text>
          <Text className="text-[#6B7280] text-base mt-2">
            Sign in to continue your journey
          </Text>
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className="text-[#374151] text-sm mb-2 font-semibold">
            Email
          </Text>
          <View className="flex-row items-center bg-[#F9F5FF] border border-[#E9D5FF] rounded-2xl px-4 h-14">
            <Ionicons name="mail-outline" size={18} color="#7C3AED" />
            <TextInput
              className="flex-1 text-[#111827] text-base ml-3"
              placeholder="you@example.com"
              placeholderTextColor="#C4B5FD"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
        </View>

        {/* Password */}
        <View className="mb-2">
          <Text className="text-[#374151] text-sm mb-2 font-semibold">
            Password
          </Text>
          <View className="flex-row items-center bg-[#F9F5FF] border border-[#E9D5FF] rounded-2xl px-4 h-14">
            <Ionicons name="lock-closed-outline" size={18} color="#7C3AED" />
            <TextInput
              className="flex-1 text-[#111827] text-base ml-3"
              placeholder="Your password"
              placeholderTextColor="#C4B5FD"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#7C3AED"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity className="self-end mb-6 mt-1">
          <Text className="text-[#7C3AED] text-sm font-semibold">
            Forgot password?
          </Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          className={`h-14 rounded-2xl items-center justify-center ${
            loading ? "bg-[#6D28D9]" : "bg-[#7C3AED]"
          }`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-bold tracking-wide">
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-[#E9D5FF]" />
          <Text className="text-[#9CA3AF] text-xs mx-4 font-medium">OR</Text>
          <View className="flex-1 h-px bg-[#E9D5FF]" />
        </View>

        {/* Info Card */}
        <View className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl p-4 mb-6">
          <View className="flex-row items-center gap-3">
            <View className="w-9 h-9 rounded-xl bg-[#EDE9FE] items-center justify-center">
              <Ionicons name="sparkles-outline" size={18} color="#7C3AED" />
            </View>
            <View className="flex-1">
              <Text className="text-[#111827] text-sm font-semibold">
                AI-Powered Travel
              </Text>
              <Text className="text-[#6B7280] text-xs mt-0.5">
                Plan smarter trips with your personal AI assistant
              </Text>
            </View>
          </View>
        </View>

        {/* Register Link */}
        <View className="flex-row justify-center items-center">
          <Text className="text-[#6B7280] text-sm">
            Don't have an account?{" "}
          </Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-[#7C3AED] text-sm font-bold">Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
