import { useState, useRef, useEffect } from "react";
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
  Linking,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";

// ─────────────────────────────────────────────────────────────
// 🔑  PASTE YOUR ANTHROPIC API KEY HERE
// ─────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = "sk-ant-REPLACE_WITH_YOUR_KEY";
// ─────────────────────────────────────────────────────────────

type AssistantTab =
  | "chat"
  | "packing"
  | "vault"
  | "safety"
  | "currency"
  | "weather";

type Message = { role: "user" | "ai"; text: string };

type Doc = {
  id: string;
  type: string;
  notes: string;
  reminder_date: string | null;
  file_url: string | null;
};

const SAFETY_ALERTS = [
  {
    place: "Manali",
    level: "moderate",
    msg: "Landslide risk on Rohtang Pass road",
    color: "#D97706",
    bg: "#FFFBEB",
  },
  {
    place: "Goa",
    level: "low",
    msg: "Beach advisory: High tide 6–8 PM",
    color: "#16A34A",
    bg: "#F0FDF4",
  },
  {
    place: "Delhi",
    level: "high",
    msg: "Air quality index: Poor (AQI 220)",
    color: "#E11D48",
    bg: "#FFF1F2",
  },
];

const CURRENCIES = ["USD", "EUR", "GBP", "AED", "SGD", "THB", "JPY"];
const RATES: Record<string, number> = {
  USD: 83.5,
  EUR: 90.2,
  GBP: 105.8,
  AED: 22.7,
  SGD: 62.1,
  THB: 2.31,
  JPY: 0.56,
};

const CHAT_PROMPTS = [
  "What to pack for Manali in December?",
  "Is it safe to travel solo in Rajasthan?",
  "Best local food in Kerala?",
  "Visa requirements for Thailand?",
];

// ── Anthropic helper ──────────────────────────────────────────
async function callClaude(
  system: string,
  messages: { role: "user" | "assistant"; content: string }[],
  maxTokens = 1000,
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

export default function AssistantScreen() {
  const [activeTab, setActiveTab] = useState<AssistantTab>("chat");

  // Chat
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hi! I'm your AI travel assistant ✈️ Ask me anything — packing tips, safety info, local guides, visa help, and more!",
    },
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Packing
  const [packDest, setPackDest] = useState("");
  const [packDays, setPackDays] = useState("");
  const [packList, setPackList] = useState<string[]>([]);
  const [packLoading, setPackLoading] = useState(false);

  // Vault
  const [docs, setDocs] = useState<Doc[]>([]);
  const [newDocType, setNewDocType] = useState("passport");
  const [newDocNote, setNewDocNote] = useState("");
  const [vaultLoading, setVaultLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null); // doc id being uploaded

  // Currency
  const [amount, setAmount] = useState("1000");
  const [fromCur, setFromCur] = useState("USD");

  // Weather
  const [weatherCity, setWeatherCity] = useState("");
  const [weatherInfo, setWeatherInfo] = useState("");
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // ── Chat ──────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg) return;
    setInput("");
    const updated: Message[] = [...messages, { role: "user", text: msg }];
    setMessages(updated);
    setChatLoading(true);
    try {
      const reply = await callClaude(
        "You are a helpful AI travel assistant. Give concise, practical advice (under 120 words). Focus on Indian travel context when relevant. Be friendly and specific.",
        updated.map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.text,
        })),
      );
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: reply || "Try again." },
      ]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: `Error: ${e.message ?? "Connection error."}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Packing ───────────────────────────────────────────────────
  const generatePackingList = async () => {
    if (!packDest.trim()) {
      Alert.alert("Enter a destination");
      return;
    }
    setPackLoading(true);
    setPackList([]);
    try {
      const text = await callClaude(
        'Return ONLY a JSON array of strings. No markdown, no preamble. Example: ["Item 1","Item 2"]',
        [
          {
            role: "user",
            content: `Packing list for ${packDest}${packDays ? ` for ${packDays} days` : ""}. 15–20 essential items.`,
          },
        ],
      );
      setPackList(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch {
      Alert.alert("Error", "Could not generate list.");
    } finally {
      setPackLoading(false);
    }
  };

  // ── Vault ─────────────────────────────────────────────────────
  const fetchDocs = async () => {
    setVaultLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setVaultLoading(false);
      return;
    }
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setDocs(data as Doc[]);
    setVaultLoading(false);
  };

  const addDoc = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("documents")
      .insert({ user_id: user.id, type: newDocType, notes: newDocNote });
    if (!error) {
      setNewDocNote("");
      fetchDocs();
    }
  };

  const deleteDoc = async (id: string) => {
    await supabase.from("documents").delete().eq("id", id);
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // Pick a file from the phone and upload to Supabase Storage
  // Matches the pattern in fileUpload util: fetch URI → blob → File → supabase.storage.upload
  const pickAndUploadFile = async (docId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploadingId(docId);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Not logged in");
        setUploadingId(null);
        return;
      }

      // Fetch the local URI and convert to a Blob (same approach as web File API)
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const ext = asset.name.split(".").pop() ?? "bin";
      const mimeType = asset.mimeType ?? "application/octet-stream";

      // Construct a File object from the blob (React Native supports this via Blob)
      const file = new File([blob], asset.name, { type: mimeType });

      // Storage path: userId/docId.ext  (mirrors your fileUpload util pattern)
      const storagePath = `${user.id}/${docId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("travel-documents")
        .upload(storagePath, file, {
          contentType: mimeType,
          upsert: true,
        });

      if (uploadError) {
        Alert.alert("Upload failed", uploadError.message);
        setUploadingId(null);
        return;
      }

      // Get a signed URL valid for 1 year (bucket is private, matching your setup)
      const { data: signedData, error: signErr } = await supabase.storage
        .from("travel-documents")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

      if (signErr || !signedData) {
        Alert.alert("Could not get file URL");
        setUploadingId(null);
        return;
      }

      // Persist URL back to the documents row
      await supabase
        .from("documents")
        .update({ file_url: signedData.signedUrl })
        .eq("id", docId);

      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, file_url: signedData.signedUrl } : d,
        ),
      );

      Alert.alert("✅ Uploaded", `${asset.name} uploaded successfully.`);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  const openFile = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert("Cannot open file"));
  };

  useEffect(() => {
    if (activeTab === "vault") fetchDocs();
  }, [activeTab]);

  // ── Weather ───────────────────────────────────────────────────
  const getWeather = async () => {
    if (!weatherCity.trim()) {
      Alert.alert("Enter a city");
      return;
    }
    setWeatherLoading(true);
    setWeatherInfo("");
    try {
      const text = await callClaude(
        "You are a travel weather advisor. Give a brief (60 words max) weather summary for the city including typical temperature, what to expect, and what to wear. Be practical.",
        [
          {
            role: "user",
            content: `Weather and travel conditions in ${weatherCity} currently`,
          },
        ],
      );
      setWeatherInfo(text || "No data.");
    } catch {
      setWeatherInfo("Could not fetch weather info.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const TABS: {
    key: AssistantTab;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
  }[] = [
    { key: "chat", icon: "chatbubble-outline", label: "Chat" },
    { key: "packing", icon: "bag-outline", label: "Packing" },
    { key: "vault", icon: "document-text-outline", label: "Vault" },
    { key: "safety", icon: "shield-outline", label: "Safety" },
    { key: "currency", icon: "cash-outline", label: "Currency" },
    { key: "weather", icon: "partly-sunny-outline", label: "Weather" },
  ];

  const DOC_TYPES = ["passport", "visa", "ticket", "other"];

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#FAFAFA]"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View className="bg-white px-6 pt-14 pb-4 border-b border-[#F3F0FF]">
        <Text className="text-[#111827] text-xl font-bold">AI Assistant</Text>
        <Text className="text-[#6B7280] text-xs mt-0.5">
          Your all-in-one travel companion
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 -mx-1"
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`mx-1 flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${
                activeTab === tab.key ? "bg-[#7C3AED]" : "bg-[#F5F3FF]"
              }`}
            >
              <Ionicons
                name={tab.icon}
                size={12}
                color={activeTab === tab.key ? "#fff" : "#7C3AED"}
              />
              <Text
                className={`text-xs font-semibold ${
                  activeTab === tab.key ? "text-white" : "text-[#7C3AED]"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── CHAT ── */}
      {activeTab === "chat" && (
        <>
          <ScrollView
            ref={scrollRef}
            className="flex-1 px-4 pt-4"
            showsVerticalScrollIndicator={false}
          >
            {messages.length <= 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4 -mx-1"
              >
                {CHAT_PROMPTS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => sendMessage(p)}
                    className="mx-1 bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl px-3 py-2"
                  >
                    <Text className="text-[#7C3AED] text-xs font-medium">
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {messages.map((msg, i) => (
              <View
                key={i}
                className={`mb-3 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {msg.role === "ai" && (
                  <View className="w-7 h-7 rounded-xl bg-[#7C3AED] items-center justify-center mb-1">
                    <Ionicons name="sparkles" size={12} color="#fff" />
                  </View>
                )}
                <View
                  className={`max-w-xs rounded-3xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#7C3AED] rounded-tr-sm"
                      : "bg-white border border-[#F3F0FF] rounded-tl-sm"
                  }`}
                >
                  <Text
                    className={`text-sm leading-relaxed ${
                      msg.role === "user" ? "text-white" : "text-[#111827]"
                    }`}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}
            {chatLoading && (
              <View className="items-start mb-3">
                <View className="bg-white border border-[#F3F0FF] rounded-3xl rounded-tl-sm px-5 py-3">
                  <ActivityIndicator size="small" color="#7C3AED" />
                </View>
              </View>
            )}
            <View className="h-4" />
          </ScrollView>
          <View className="bg-white border-t border-[#F3F0FF] px-4 py-3 flex-row items-center gap-3">
            <TextInput
              className="flex-1 bg-[#F9F5FF] border border-[#E9D5FF] rounded-2xl px-4 py-3 text-[#111827] text-sm"
              placeholder="Ask anything about travel..."
              placeholderTextColor="#C4B5FD"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => sendMessage()}
              returnKeyType="send"
            />
            <TouchableOpacity
              className={`w-11 h-11 rounded-2xl items-center justify-center ${
                input.trim() ? "bg-[#7C3AED]" : "bg-[#EDE9FE]"
              }`}
              onPress={() => sendMessage()}
              disabled={!input.trim() || chatLoading}
            >
              <Ionicons
                name="send"
                size={16}
                color={input.trim() ? "#fff" : "#C4B5FD"}
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── PACKING ── */}
      {activeTab === "packing" && (
        <ScrollView
          className="flex-1 px-5 pt-5"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white border border-[#F3F0FF] rounded-3xl p-4 gap-3 mb-4">
            <View className="flex-row items-center bg-[#F9F5FF] border border-[#E9D5FF] rounded-2xl px-4 h-12">
              <Ionicons name="location-outline" size={16} color="#7C3AED" />
              <TextInput
                className="flex-1 text-[#111827] text-sm ml-2"
                placeholder="Destination"
                placeholderTextColor="#C4B5FD"
                value={packDest}
                onChangeText={setPackDest}
              />
            </View>
            <View className="flex-row items-center bg-[#F9F5FF] border border-[#E9D5FF] rounded-2xl px-4 h-12">
              <Ionicons name="calendar-outline" size={16} color="#7C3AED" />
              <TextInput
                className="flex-1 text-[#111827] text-sm ml-2"
                placeholder="Number of days"
                placeholderTextColor="#C4B5FD"
                value={packDays}
                onChangeText={setPackDays}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              className={`h-12 rounded-2xl items-center justify-center ${packLoading ? "bg-[#6D28D9]" : "bg-[#7C3AED]"}`}
              onPress={generatePackingList}
              disabled={packLoading}
            >
              {packLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-sm font-bold">
                  Generate List ✨
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {packList.length > 0 && (
            <View className="bg-white border border-[#F3F0FF] rounded-3xl p-4 mb-8 gap-2">
              <Text className="text-[#111827] text-sm font-bold mb-1">
                Packing List for {packDest}
              </Text>
              {packList.map((item, i) => (
                <View
                  key={i}
                  className="flex-row items-center gap-3 py-1 border-b border-[#F9F5FF]"
                >
                  <View className="w-5 h-5 rounded-lg border-2 border-[#DDD6FE]" />
                  <Text className="text-[#374151] text-sm">{item}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── VAULT ── */}
      {activeTab === "vault" && (
        <ScrollView
          className="flex-1 px-5 pt-5"
          showsVerticalScrollIndicator={false}
        >
          {/* Add doc */}
          <View className="bg-white border border-[#F3F0FF] rounded-3xl p-4 gap-3 mb-4">
            <Text className="text-[#111827] text-sm font-bold">
              Add Document
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-1"
            >
              {DOC_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setNewDocType(type)}
                  className={`mx-1 px-4 py-2 rounded-xl ${
                    newDocType === type ? "bg-[#7C3AED]" : "bg-[#F5F3FF]"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold capitalize ${
                      newDocType === type ? "text-white" : "text-[#7C3AED]"
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View className="flex-row items-center bg-[#F9F5FF] border border-[#E9D5FF] rounded-2xl px-4 h-12">
              <TextInput
                className="flex-1 text-[#111827] text-sm"
                placeholder="Notes (e.g. Expires Dec 2027)"
                placeholderTextColor="#C4B5FD"
                value={newDocNote}
                onChangeText={setNewDocNote}
              />
            </View>
            <TouchableOpacity
              className="h-12 bg-[#7C3AED] rounded-2xl items-center justify-center"
              onPress={addDoc}
            >
              <Text className="text-white text-sm font-bold">
                Save Document
              </Text>
            </TouchableOpacity>
          </View>

          {vaultLoading ? (
            <ActivityIndicator color="#7C3AED" />
          ) : (
            <View className="gap-3 mb-8">
              {docs.length === 0 && (
                <Text className="text-[#9CA3AF] text-sm text-center py-6">
                  No documents saved yet.
                </Text>
              )}
              {docs.map((doc) => (
                <View
                  key={doc.id}
                  className="bg-white border border-[#F3F0FF] rounded-2xl px-4 py-3 gap-2"
                >
                  {/* Top row */}
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-[#EDE9FE] items-center justify-center">
                      <Ionicons
                        name="document-text-outline"
                        size={18}
                        color="#7C3AED"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#111827] text-sm font-semibold capitalize">
                        {doc.type}
                      </Text>
                      {doc.notes ? (
                        <Text className="text-[#6B7280] text-xs mt-0.5">
                          {doc.notes}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity onPress={() => deleteDoc(doc.id)}>
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#E11D48"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* File actions row */}
                  <View className="flex-row gap-2 mt-1">
                    {/* Upload / re-upload button */}
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center gap-1.5 h-9 rounded-xl border border-[#DDD6FE] bg-[#F5F3FF]"
                      onPress={() => pickAndUploadFile(doc.id)}
                      disabled={uploadingId === doc.id}
                    >
                      {uploadingId === doc.id ? (
                        <ActivityIndicator size="small" color="#7C3AED" />
                      ) : (
                        <>
                          <Ionicons
                            name="cloud-upload-outline"
                            size={14}
                            color="#7C3AED"
                          />
                          <Text className="text-[#7C3AED] text-xs font-semibold">
                            {doc.file_url ? "Replace File" : "Upload File"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* View button — only when file exists */}
                    {doc.file_url ? (
                      <TouchableOpacity
                        className="flex-1 flex-row items-center justify-center gap-1.5 h-9 rounded-xl bg-[#7C3AED]"
                        onPress={() => openFile(doc.file_url!)}
                      >
                        <Ionicons name="eye-outline" size={14} color="#fff" />
                        <Text className="text-white text-xs font-semibold">
                          View File
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View className="flex-1 h-9 rounded-xl bg-[#F3F0FF] items-center justify-center">
                        <Text className="text-[#C4B5FD] text-xs">
                          No file yet
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ── SAFETY ── */}
      {activeTab === "safety" && (
        <ScrollView
          className="flex-1 px-5 pt-5"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-[#7C3AED] rounded-3xl px-5 py-4 mb-4">
            <Text className="text-white font-bold text-sm">
              Travel Safety Alerts
            </Text>
            <Text className="text-white/70 text-xs mt-0.5">
              AI-curated advisories for popular destinations
            </Text>
          </View>
          {SAFETY_ALERTS.map((alert) => (
            <View
              key={alert.place}
              className="rounded-2xl border px-4 py-3 mb-3 flex-row gap-3 items-start"
              style={{
                backgroundColor: alert.bg,
                borderColor: alert.color + "40",
              }}
            >
              <View
                className="w-8 h-8 rounded-xl items-center justify-center"
                style={{ backgroundColor: alert.color + "20" }}
              >
                <Ionicons
                  name="warning-outline"
                  size={16}
                  color={alert.color}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-0.5">
                  <Text className="text-[#111827] text-sm font-bold">
                    {alert.place}
                  </Text>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: alert.color + "20" }}
                  >
                    <Text
                      className="text-xs font-semibold capitalize"
                      style={{ color: alert.color }}
                    >
                      {alert.level}
                    </Text>
                  </View>
                </View>
                <Text className="text-[#374151] text-xs leading-relaxed">
                  {alert.msg}
                </Text>
              </View>
            </View>
          ))}
          <View className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl px-4 py-3 mb-8">
            <Text className="text-[#6B7280] text-xs leading-relaxed">
              Alerts are AI-generated based on general knowledge. Always check
              official government advisories before travel.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* ── CURRENCY ── */}
      {activeTab === "currency" && (
        <ScrollView
          className="flex-1 px-5 pt-5"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white border border-[#F3F0FF] rounded-3xl p-5 mb-4 gap-4">
            <Text className="text-[#111827] text-sm font-bold">
              Convert to INR
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1 flex-row items-center bg-[#F9F5FF] border border-[#E9D5FF] rounded-2xl px-4 h-12">
                <TextInput
                  className="flex-1 text-[#111827] text-sm font-bold"
                  placeholder="Amount"
                  placeholderTextColor="#C4B5FD"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-1 -mx-1"
              >
                {CURRENCIES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setFromCur(c)}
                    className={`mx-1 px-3 h-12 rounded-2xl items-center justify-center ${
                      fromCur === c ? "bg-[#7C3AED]" : "bg-[#F5F3FF]"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        fromCur === c ? "text-white" : "text-[#7C3AED]"
                      }`}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="bg-[#F5F3FF] rounded-2xl px-5 py-4 items-center">
              <Text className="text-[#9CA3AF] text-xs font-medium">
                {amount || "0"} {fromCur} =
              </Text>
              <Text className="text-[#7C3AED] text-3xl font-bold mt-1">
                ₹
                {amount
                  ? (parseFloat(amount) * (RATES[fromCur] ?? 1)).toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits: 2,
                      },
                    )
                  : "0"}
              </Text>
              <Text className="text-[#9CA3AF] text-xs mt-1">
                1 {fromCur} = ₹{RATES[fromCur]}
              </Text>
            </View>
          </View>

          <View className="bg-white border border-[#F3F0FF] rounded-3xl p-4 gap-2 mb-8">
            <Text className="text-[#111827] text-sm font-bold mb-1">
              Exchange Rates (vs ₹ INR)
            </Text>
            {CURRENCIES.map((c) => (
              <View
                key={c}
                className="flex-row items-center justify-between py-2 border-b border-[#F9F5FF]"
              >
                <Text className="text-[#374151] text-sm font-semibold">
                  {c}
                </Text>
                <Text className="text-[#111827] text-sm font-bold">
                  ₹{RATES[c]}
                </Text>
              </View>
            ))}
            <Text className="text-[#9CA3AF] text-xs mt-1">
              Rates are approximate. Check live rates before transactions.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* ── WEATHER ── */}
      {activeTab === "weather" && (
        <ScrollView
          className="flex-1 px-5 pt-5"
          showsVerticalScrollIndicator={false}
        >
          <View className="bg-white border border-[#F3F0FF] rounded-3xl p-4 gap-3 mb-4">
            <View className="flex-row items-center bg-[#F9F5FF] border border-[#E9D5FF] rounded-2xl px-4 h-12">
              <Ionicons name="search-outline" size={16} color="#7C3AED" />
              <TextInput
                className="flex-1 text-[#111827] text-sm ml-2"
                placeholder="City (e.g. Shimla)"
                placeholderTextColor="#C4B5FD"
                value={weatherCity}
                onChangeText={setWeatherCity}
              />
            </View>
            <TouchableOpacity
              className={`h-12 rounded-2xl items-center justify-center ${
                weatherLoading ? "bg-[#6D28D9]" : "bg-[#7C3AED]"
              }`}
              onPress={getWeather}
              disabled={weatherLoading}
            >
              {weatherLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-sm font-bold">
                  Check Weather ✨
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {weatherInfo ? (
            <View className="bg-white border border-[#F3F0FF] rounded-3xl px-5 py-5 mb-4">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-xl bg-[#EDE9FE] items-center justify-center">
                  <Ionicons
                    name="partly-sunny-outline"
                    size={16}
                    color="#7C3AED"
                  />
                </View>
                <Text className="text-[#111827] text-sm font-bold">
                  {weatherCity}
                </Text>
              </View>
              <Text className="text-[#374151] text-sm leading-relaxed">
                {weatherInfo}
              </Text>
            </View>
          ) : null}

          <Text className="text-[#374151] text-sm font-bold mb-3">
            Popular Destinations
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-8">
            {[
              "Delhi",
              "Mumbai",
              "Manali",
              "Goa",
              "Jaipur",
              "Kerala",
              "Shimla",
              "Leh",
            ].map((city) => (
              <TouchableOpacity
                key={city}
                onPress={() => setWeatherCity(city)}
                className="bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl px-4 py-2"
              >
                <Text className="text-[#7C3AED] text-xs font-semibold">
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
