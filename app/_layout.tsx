import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import "../global.css"; // NativeWind global styles

// ─────────────────────────────────────────────
// Auth Guard Hook
// Redirects user based on session state
// ─────────────────────────────────────────────
function useAuthGuard(session: Session | null, initialized: boolean) {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (session && inAuthGroup) {
      // Logged in but on auth screen → go to app
      router.replace("/(tabs)/home");
    } else if (!session && !inAuthGroup) {
      // Not logged in and not on auth screen → go to login
      router.replace("/(auth)/login");
    }
  }, [session, initialized, segments]);
}

// ─────────────────────────────────────────────
// Root Layout
// ─────────────────────────────────────────────
export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useAuthGuard(session, initialized);

  // Show splash/loading while checking session
  if (!initialized) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#0A0F1E",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <Slot />;
}
