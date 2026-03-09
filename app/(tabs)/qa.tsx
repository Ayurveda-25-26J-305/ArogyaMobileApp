import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Share,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { Audio } from "expo-av";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useFocusEffect } from "expo-router";
import { askQuestion, fetchStats } from "../../services/api";
import { STORAGE_KEYS, generateFollowUps } from "../../utils/constants";
import { API_BASE_URL } from "../../config";

// ─── TypeScript interfaces ────────────────────────────────────────────────────

interface Citation {
  source: string;
  type?: string;
  chapter?: string;
  paragraph?: string;
  qa_id?: string;
  related_question?: string;
  similarity_percentage?: number;
}

interface Message {
  id: number;
  type: "question" | "answer";
  content: string;
  citations?: Citation[];
  validation?: { confidence: number; confidence_level: string } | null;
  personalized?: boolean;
  userInfo?: { dominant_dosha: string; current_season: string } | null;
  detectedLanguage?: string;
  detectedDosha?: string;
  personalizedTips?: string;
  followUps?: string[];
  bookmarked?: boolean;
}

interface UserProfile {
  dominant_dosha: string;
  current_season: string;
}

interface ChatSession {
  id: string;
  title: string;
  date: string;
  messageCount: number;
  messages: Message[];
}

interface BookmarkItem {
  id: string;
  question: string;
  answer: string;
  date: string;
  detectedLanguage?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "#2e7d32",
  medium: "#f57f17",
  low: "#c62828",
};

const DOSHA_COLORS: Record<string, string> = {
  vata: "#7986cb",
  pitta: "#ef5350",
  kapha: "#26a69a",
};

function ConfidenceBadge({
  confidence,
  level,
}: {
  confidence: number;
  level: string;
}) {
  const color = CONFIDENCE_COLORS[level?.toLowerCase()] ?? "#555";
  return (
    <View
      style={{
        backgroundColor: color + "20",
        borderColor: color,
        borderWidth: 1,
      }}
      className="px-2 py-0.5 rounded-full flex-row items-center gap-1"
    >
      <View
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <Text style={{ color }} className="text-[11px] font-semibold capitalize">
        {level} (
        {Number.isFinite(confidence)
          ? confidence > 1
            ? confidence.toFixed(1)
            : (confidence * 100).toFixed(1)
          : 0}
        %)
      </Text>
    </View>
  );
}

function CitationItem({ citation }: { citation: Citation }) {
  return (
    <View className="bg-[#f9fbe7] border border-[#c5e1a5] rounded-lg p-2.5 mb-1.5">
      <Text className="text-[12px] font-semibold text-[#33691e] mb-0.5">
        📖 {citation.source}
      </Text>
      {!!citation.type && (
        <Text className="text-[11px] text-gray-500 capitalize">
          {citation.type}
        </Text>
      )}
      {!!citation.chapter && (
        <Text className="text-[11px] text-gray-500">
          Chapter: {citation.chapter}
        </Text>
      )}
      {!!citation.paragraph && (
        <Text className="text-[11px] text-gray-500">
          Para: {citation.paragraph}
        </Text>
      )}
      {!!citation.related_question && (
        <Text className="text-[11px] text-[#558b2f] italic mt-0.5">
          &ldquo;{citation.related_question}&rdquo;
        </Text>
      )}
      {citation.similarity_percentage != null && (
        <Text className="text-[11px] text-gray-400 mt-0.5">
          Match: {citation.similarity_percentage.toFixed(1)}%
        </Text>
      )}
    </View>
  );
}

// ─── Tooltip Icon Button ──────────────────────────────────────────────────────
function IconButton({
  label,
  onPress,
  btnClass,
  children,
}: {
  label: string;
  onPress: () => void;
  btnClass: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const hoverProps =
    Platform.OS === "web"
      ? ({
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => setHovered(false),
        } as any)
      : {};
  return (
    <View style={{ position: "relative" }}>
      <TouchableOpacity
        className={btnClass}
        onPress={onPress}
        accessibilityLabel={label}
        {...hoverProps}
      >
        {children}
      </TouchableOpacity>
      {hovered && (
        <View
          style={{
            position: "absolute",
            top: 40,
            alignSelf: "center",
            backgroundColor: "rgba(30,30,30,0.82)",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 5,
            zIndex: 9999,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 11 } as any}>{label}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function QAScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Core chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<{
    total_documents?: number;
    model?: string;
  } | null>(null);
  const [expandedCitations, setExpandedCitations] = useState<number | null>(
    null,
  );

  // Session tracking
  const [sessionId, setSessionId] = useState(() => Date.now().toString());

  // Panels
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");

  // History & bookmarks data
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // ── Bootstrap (run once on first mount) ─────────────────────────────────
  useEffect(() => {
    (async () => {
      let uid = await AsyncStorage.getItem(STORAGE_KEYS.USER_ID);
      if (!uid) {
        uid = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_ID, uid);
      }
      setUserId(uid);

      const sessionsStr = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (sessionsStr) setMessages(JSON.parse(sessionsStr));

      const historyStr = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      if (historyStr) setChatHistory(JSON.parse(historyStr));

      const bookmarksStr = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (bookmarksStr) setBookmarks(JSON.parse(bookmarksStr));

      try {
        const result = await fetchStats();
        if (result.success) setStats(result.stats);
      } catch (_) {}
    })();
  }, []);

  // ── Reload profile every time this tab comes into focus ───────────────────
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE).then((str) => {
        if (str) setUserProfile(JSON.parse(str));
      });
    }, []),
  );

  // ── Persist session messages ──────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(
        STORAGE_KEYS.SESSIONS,
        JSON.stringify(messages.slice(-100)),
      );
    } else {
      AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS);
    }
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── Save current session to history ──────────────────────────────────────
  const saveCurrentSession = useCallback(
    async (msgs: Message[], sid: string) => {
      if (msgs.length === 0) return;
      const firstQ = msgs.find((m) => m.type === "question");
      if (!firstQ) return;
      const session: ChatSession = {
        id: sid,
        title:
          firstQ.content.length > 60
            ? firstQ.content.slice(0, 60) + "…"
            : firstQ.content,
        date: new Date().toLocaleDateString("en-GB"),
        messageCount: msgs.filter((m) => m.type === "question").length,
        messages: msgs,
      };
      setChatHistory((prev) => {
        const updated = [session, ...prev.filter((s) => s.id !== sid)].slice(
          0,
          50,
        );
        AsyncStorage.setItem(
          STORAGE_KEYS.CHAT_HISTORY,
          JSON.stringify(updated),
        );
        return updated;
      });
    },
    [],
  );

  // ── Start new chat ────────────────────────────────────────────────────────
  const startNewChat = useCallback(async () => {
    await saveCurrentSession(messages, sessionId);
    setMessages([]);
    setSessionId(Date.now().toString());
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS);
    setSidebarSearch("");
    setSidebarOpen(false);
  }, [messages, sessionId, saveCurrentSession]);

  // ── Load a previous session ───────────────────────────────────────────────
  const loadSession = useCallback(
    async (session: ChatSession) => {
      await saveCurrentSession(messages, sessionId);
      setMessages(session.messages);
      setSessionId(session.id);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSIONS,
        JSON.stringify(session.messages),
      );
      setSidebarSearch("");
      setSidebarOpen(false);
    },
    [messages, sessionId, saveCurrentSession],
  );

  // ── Delete a session from history ─────────────────────────────────────────
  const deleteSession = useCallback((id: string) => {
    setChatHistory((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Send question ─────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text?: string) => {
      const q = (text ?? input).trim();
      if (!q || loading) return;
      setInput("");
      setLoading(true);

      const qMsg: Message = { id: Date.now(), type: "question", content: q };
      setMessages((prev) => [...prev, qMsg]);
      scrollToBottom();

      try {
        const data = await askQuestion(q, userId, userProfile);
        if (data.success || data.answer) {
          const followUps: string[] = data.follow_ups ?? generateFollowUps(q);
          const aMsg: Message = {
            id: Date.now() + 1,
            type: "answer",
            content: data.answer ?? "No answer returned.",
            citations: data.citations ?? [],
            validation: data.validation ?? null,
            personalized: data.personalized ?? false,
            userInfo: data.user_info ?? null,
            detectedLanguage: data.detected_language,
            detectedDosha: data.detected_dosha,
            personalizedTips: data.personalized_tips,
            followUps,
            bookmarked: false,
          };
          setMessages((prev) => [...prev, aMsg]);
        } else {
          throw new Error(data.message ?? "API error");
        }
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: "answer",
            content: `⚠️ Could not reach the server. Please check your connection.\n\n${err?.message ?? ""}`,
          },
        ]);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    },
    [input, loading, userId],
  );

  // ── Delete a single message ───────────────────────────────────────────────
  const doDeleteMessage = useCallback((id: number) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const msg = prev[idx];
      const idsToRemove = new Set([id]);
      if (msg.type === "question" && prev[idx + 1]?.type === "answer")
        idsToRemove.add(prev[idx + 1].id);
      if (msg.type === "answer" && prev[idx - 1]?.type === "question")
        idsToRemove.add(prev[idx - 1].id);
      return prev.filter((m) => !idsToRemove.has(m.id));
    });
  }, []);

  const deleteMessage = useCallback(
    (id: number) => {
      if (Platform.OS === "web") {
        // Alert.alert buttons don't work on web — confirm directly
        if (window.confirm("Remove this Q&A exchange?")) doDeleteMessage(id);
      } else {
        Alert.alert("Delete", "Remove this Q&A exchange?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => doDeleteMessage(id),
          },
        ]);
      }
    },
    [doDeleteMessage],
  );

  // ── Copy message text ─────────────────────────────────────────────────────
  const copyMessage = useCallback(async (content: string) => {
    await Clipboard.setStringAsync(content);
    Alert.alert("Copied", "Message copied to clipboard.");
  }, []);

  // ── Share full chat ───────────────────────────────────────────────────────
  const shareChat = useCallback(async () => {
    if (messages.length === 0) return;
    const text = messages
      .map((m) =>
        m.type === "question" ? `Q: ${m.content}` : `A: ${m.content}`,
      )
      .join("\n\n");
    try {
      await Share.share({
        message: `Ayurveda Q&A Session\n\n${text}`,
        title: "Ayurveda Q&A",
      });
    } catch (_) {}
  }, [messages]);

  // ── Export chat to PDF ──────────────────────────────────────────────────
  const exportToPDF = useCallback(async () => {
    if (messages.length === 0) return;

    const date = new Date().toLocaleDateString("en-GB");
    const profileLine = userProfile
      ? `<p style="color:#558b2f;font-size:13px;margin:0 0 16px">Profile: <strong>${userProfile.dominant_dosha}</strong> &bull; ${userProfile.current_season}</p>`
      : "";

    const rows = messages
      .map((m) => {
        if (m.type === "question") {
          return `
            <div style="margin-bottom:16px;text-align:right">
              <div style="display:inline-block;background:#2d5016;color:#fff;padding:10px 16px;border-radius:16px 16px 4px 16px;max-width:80%;font-size:14px;line-height:1.5">
                ${m.content.replace(/</g, "&lt;")}
              </div>
            </div>`;
        }
        const confidence = m.validation
          ? `<span style="background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;padding:2px 8px;border-radius:20px;font-size:11px;margin-right:6px">
               ${m.validation.confidence_level} (${m.validation.confidence > 1 ? m.validation.confidence.toFixed(1) : (m.validation.confidence * 100).toFixed(1)}%)
             </span>`
          : "";
        const lang =
          m.detectedLanguage && m.detectedLanguage !== "en"
            ? `<span style="background:#fff9c4;color:#f57f17;border:1px solid #f9a825;padding:2px 8px;border-radius:20px;font-size:11px;margin-right:6px">${m.detectedLanguage.toUpperCase()}</span>`
            : "";
        const tip = m.personalizedTips
          ? `<div style="background:#f1f8e9;border-left:4px solid #558b2f;padding:10px 12px;margin-top:10px;border-radius:0 8px 8px 0;font-size:12px;color:#1b5e20">
               <strong>&#128161; Personalised Tip</strong><br/>${m.personalizedTips.replace(/</g, "&lt;")}
             </div>`
          : "";
        const sources = m.citations?.length
          ? `<div style="margin-top:8px;font-size:11px;color:#558b2f">&#128218; ${m.citations.length} source${m.citations.length > 1 ? "s" : ""}: ${m.citations.map((c) => c.source).join(", ")}</div>`
          : "";
        return `
          <div style="margin-bottom:20px;display:flex;gap:10px">
            <div style="width:28px;height:28px;background:#e8f5e9;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:14px">&#127807;</div>
            <div style="flex:1">
              <div style="margin-bottom:6px">${confidence}${lang}</div>
              <div style="background:#fff;border:1px solid #e0e0e0;border-radius:4px 16px 16px 16px;padding:12px 16px;font-size:14px;line-height:1.6;color:#333">
                ${m.content.replace(/</g, "&lt;").replace(/\n/g, "<br/>")}
                ${tip}
              </div>
              ${sources}
            </div>
          </div>`;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; margin: 0; padding: 32px; background: #f9fbe7; }
          .header { border-bottom: 2px solid #2d5016; padding-bottom: 16px; margin-bottom: 24px; }
          h1 { color: #2d5016; font-size: 22px; margin: 0 0 4px; }
          .meta { color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>&#127807; Ayurveda Q&amp;A Export</h1>
          <div class="meta">Exported on ${date} &bull; ${messages.filter((m) => m.type === "question").length} questions</div>
          ${profileLine}
        </div>
        ${rows}
      </body>
      </html>`;

    try {
      if (Platform.OS === "web") {
        // On web: open a print dialog
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          win.document.close();
          win.print();
        }
        return;
      }
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Export Q&A as PDF",
        });
      } else {
        await Print.printAsync({ uri });
      }
    } catch (e: any) {
      Alert.alert("Export failed", e?.message ?? "Could not generate PDF.");
    }
  }, [messages, userProfile]);

  // ── Add bookmark (Q+A pair) ───────────────────────────────────────────────
  const addBookmark = useCallback(
    (aMsg: Message) => {
      const idx = messages.findIndex((m) => m.id === aMsg.id);
      const qMsg = messages
        .slice(0, idx)
        .reverse()
        .find((m) => m.type === "question");
      if (!qMsg) return;
      const item: BookmarkItem = {
        id: Date.now().toString(),
        question: qMsg.content,
        answer: aMsg.content,
        date: new Date().toLocaleDateString("en-GB"),
        detectedLanguage: aMsg.detectedLanguage,
      };
      setBookmarks((prev) => {
        const updated = [item, ...prev];
        AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
        return updated;
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === aMsg.id ? { ...m, bookmarked: true } : m)),
      );
      Alert.alert("Bookmarked", "Q&A pair saved to bookmarks.");
    },
    [messages],
  );

  // ── Remove a bookmark ─────────────────────────────────────────────────────
  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ── Toggle bookmark (save / unsave) ──────────────────────────────────────
  const toggleBookmark = useCallback(
    (aMsg: Message) => {
      if (aMsg.bookmarked) {
        setBookmarks((prev) => {
          const updated = prev.filter((b) => b.answer !== aMsg.content);
          AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
          return updated;
        });
        setMessages((prev) =>
          prev.map((m) => (m.id === aMsg.id ? { ...m, bookmarked: false } : m)),
        );
      } else {
        addBookmark(aMsg);
      }
    },
    [addBookmark],
  );

  // ── Voice recording ──────────────────────────────────────────────────────
  const handleMicPress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please grant microphone access to use voice input.",
        );
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (_) {
      Alert.alert("Error", "Could not start voice recording.");
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    setIsRecording(false);
    setIsTranscribing(true);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) return;

      const formData = new FormData();
      formData.append("audio", {
        uri,
        type: "audio/m4a",
        name: "voice.m4a",
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: "POST",
        headers: { "ngrok-skip-browser-warning": "true" },
        body: formData,
      });
      const data = await response.json();
      if (data.text) {
        setInput((prev) => (prev ? `${prev} ${data.text}` : data.text));
      } else {
        Alert.alert("Transcription failed", "Could not convert voice to text.");
      }
    } catch (_) {
      Alert.alert(
        "Unavailable",
        "Voice transcription needs a /api/transcribe endpoint on the backend.",
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  // ── Clear session ─────────────────────────────────────────────────────────
  const clearChat = () => {
    Alert.alert("Clear Chat", "Delete all messages in this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setMessages([]);
          await AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS);
        },
      },
    ]);
  };

  // ─── Render a single message ──────────────────────────────────────────────
  const renderMessage = (msg: Message) => {
    if (msg.type === "question") {
      return (
        <View key={msg.id} className="items-end mb-3 px-3">
          <View className="bg-[#2d5016] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
            <Text className="text-white text-[14px] leading-5">
              {msg.content}
            </Text>
          </View>
          {/* Question actions */}
          <View className="flex-row gap-3 mt-1 mr-1">
            <TouchableOpacity
              className="flex-row items-center gap-0.5"
              onPress={() => copyMessage(msg.content)}
            >
              <Ionicons name="copy-outline" size={13} color="#9e9e9e" />
              <Text className="text-[11px] text-gray-400">Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center gap-0.5"
              onPress={() => deleteMessage(msg.id)}
            >
              <Ionicons name="trash-outline" size={13} color="#ef9a9a" />
              <Text className="text-[11px] text-red-300">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ── Answer bubble ─────────────────────────────────────────────────────
    const citesOpen = expandedCitations === msg.id;
    const doshaKey = msg.detectedDosha?.toLowerCase() ?? "";

    return (
      <View key={msg.id} className="items-start mb-5 px-3">
        <View className="flex-row items-start gap-2">
          {/* Avatar */}
          <View className="w-8 h-8 rounded-full bg-[#e8f5e9] items-center justify-center mt-1 shrink-0">
            <Ionicons name="leaf" size={16} color="#2d5016" />
          </View>

          <View className="flex-1">
            {/* Badge row */}
            <View className="flex-row flex-wrap gap-1.5 mb-1.5">
              {msg.validation && (
                <ConfidenceBadge
                  confidence={msg.validation.confidence}
                  level={msg.validation.confidence_level}
                />
              )}
              {msg.personalized && (
                <View className="bg-[#e8f5e9] border border-[#a5d6a7] px-2 py-0.5 rounded-full flex-row items-center gap-1">
                  <Ionicons name="person" size={10} color="#2d5016" />
                  <Text className="text-[10px] text-[#2d5016] font-semibold">
                    Personalised
                  </Text>
                </View>
              )}
              {!!msg.detectedLanguage && msg.detectedLanguage !== "en" && (
                <View className="bg-[#fff9c4] border border-[#f9a825] px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] text-[#f57f17] font-semibold">
                    🌐 {msg.detectedLanguage.toUpperCase()}
                  </Text>
                </View>
              )}
              {!!msg.detectedDosha && (
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: (DOSHA_COLORS[doshaKey] ?? "#888") + "22",
                    borderColor: DOSHA_COLORS[doshaKey] ?? "#888",
                    borderWidth: 1,
                  }}
                >
                  <Text
                    className="text-[10px] font-semibold capitalize"
                    style={{ color: DOSHA_COLORS[doshaKey] ?? "#888" }}
                  >
                    {msg.detectedDosha}
                  </Text>
                </View>
              )}
            </View>

            {/* Bubble */}
            <View className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <Text className="text-[14px] text-gray-800 leading-[22px]">
                {msg.content}
              </Text>
              {!!msg.personalizedTips && (
                <View className="mt-3 bg-[#f1f8e9] border-l-4 border-[#558b2f] rounded-r-lg p-2.5">
                  <Text className="text-[11px] font-bold text-[#33691e] mb-0.5">
                    💡 Personalised Tip
                  </Text>
                  <Text className="text-[12px] text-[#1b5e20] leading-5">
                    {msg.personalizedTips}
                  </Text>
                </View>
              )}
            </View>

            {/* Action row */}
            <View className="flex-row flex-wrap gap-3 mt-1.5 ml-1">
              {(msg.citations?.length ?? 0) > 0 && (
                <TouchableOpacity
                  className="flex-row items-center gap-1"
                  onPress={() =>
                    setExpandedCitations(citesOpen ? null : msg.id)
                  }
                >
                  <Ionicons name="book-outline" size={14} color="#558b2f" />
                  <Text className="text-[12px] text-[#558b2f]">
                    {msg.citations!.length} source
                    {msg.citations!.length > 1 ? "s" : ""}
                  </Text>
                  <Ionicons
                    name={citesOpen ? "chevron-up" : "chevron-down"}
                    size={12}
                    color="#558b2f"
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="flex-row items-center gap-1"
                onPress={() => toggleBookmark(msg)}
              >
                <Ionicons
                  name={msg.bookmarked ? "bookmark" : "bookmark-outline"}
                  size={14}
                  color={msg.bookmarked ? "#f57f17" : "#9e9e9e"}
                />
                <Text
                  className="text-[12px]"
                  style={{ color: msg.bookmarked ? "#f57f17" : "#9e9e9e" }}
                >
                  {msg.bookmarked ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center gap-1"
                onPress={() => copyMessage(msg.content)}
              >
                <Ionicons name="copy-outline" size={14} color="#9e9e9e" />
                <Text className="text-[12px] text-gray-400">Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center gap-1"
                onPress={() => deleteMessage(msg.id)}
              >
                <Ionicons name="trash-outline" size={14} color="#ef9a9a" />
                <Text className="text-[12px] text-red-300">Delete</Text>
              </TouchableOpacity>
            </View>

            {/* Expanded citations */}
            {citesOpen && (
              <View className="mt-2">
                {msg.citations!.map((c, i) => (
                  <CitationItem key={i} citation={c} />
                ))}
              </View>
            )}

            {/* Follow-up chips */}
            {(msg.followUps?.length ?? 0) > 0 && (
              <View className="mt-2.5">
                <Text className="text-[11px] text-gray-400 mb-1.5">
                  Suggested:
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {msg.followUps!.map((fu, i) => (
                    <TouchableOpacity
                      key={i}
                      className="bg-[#e8f5e9] border border-[#a5d6a7] px-3 py-1.5 rounded-full"
                      onPress={() => handleSend(fu)}
                    >
                      <Text className="text-[12px] text-[#2d5016]">{fu}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─── Chat History Sidebar ─────────────────────────────────────────────────
  const renderSidebar = () => (
    <Modal
      visible={sidebarOpen}
      animationType="slide"
      transparent
      onRequestClose={() => {
        setSidebarOpen(false);
        setSidebarSearch("");
      }}
    >
      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Panel */}
        <View style={{ width: "80%", backgroundColor: "#fff", height: "100%" }}>
          {/* Header */}
          <View
            style={{
              backgroundColor: "#2d5016",
              paddingTop: 52,
              paddingBottom: 16,
              paddingHorizontal: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                Chat History
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSidebarOpen(false);
                  setSidebarSearch("");
                }}
              >
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderColor: "rgba(255,255,255,0.4)",
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
              onPress={startNewChat}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
                New Chat
              </Text>
            </TouchableOpacity>
            {/* Search box */}
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 10,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 10,
                marginTop: 10,
                height: 36,
              }}
            >
              <Ionicons
                name="search-outline"
                size={15}
                color="rgba(255,255,255,0.7)"
              />
              <TextInput
                style={{
                  flex: 1,
                  color: "#fff",
                  fontSize: 13,
                  marginLeft: 8,
                }}
                placeholder="Search chats…"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={sidebarSearch}
                onChangeText={setSidebarSearch}
              />
              {sidebarSearch.length > 0 && (
                <TouchableOpacity onPress={() => setSidebarSearch("")}>
                  <Ionicons
                    name="close-circle"
                    size={15}
                    color="rgba(255,255,255,0.7)"
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Session list */}
          <ScrollView style={{ flex: 1, padding: 12 }}>
            {(() => {
              const filtered = chatHistory.filter((s) =>
                s.title.toLowerCase().includes(sidebarSearch.toLowerCase()),
              );
              if (chatHistory.length === 0) {
                return (
                  <View style={{ alignItems: "center", marginTop: 48 }}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={40}
                      color="#c5e1a5"
                    />
                    <Text
                      style={{
                        color: "#9e9e9e",
                        fontSize: 13,
                        marginTop: 12,
                        textAlign: "center",
                      }}
                    >
                      No previous chats yet.{"\n"}Start a conversation!
                    </Text>
                  </View>
                );
              }
              if (filtered.length === 0) {
                return (
                  <View style={{ alignItems: "center", marginTop: 48 }}>
                    <Ionicons name="search-outline" size={40} color="#c5e1a5" />
                    <Text
                      style={{
                        color: "#9e9e9e",
                        fontSize: 13,
                        marginTop: 12,
                        textAlign: "center",
                      }}
                    >
                      No chats match{"\n"}"{sidebarSearch}"
                    </Text>
                  </View>
                );
              }
              return filtered.map((session) => (
                <View
                  key={session.id}
                  style={{
                    backgroundColor: "#f9fbe7",
                    borderColor: "#c5e1a5",
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <TouchableOpacity onPress={() => loadSession(session)}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#1b5e20",
                        marginBottom: 4,
                      }}
                      numberOfLines={2}
                    >
                      {session.title}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: "#9e9e9e" }}>
                        {session.date}
                      </Text>
                      <View
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: 2,
                          backgroundColor: "#ccc",
                        }}
                      />
                      <Text style={{ fontSize: 11, color: "#9e9e9e" }}>
                        {session.messageCount} Q
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ position: "absolute", top: 12, right: 12 }}
                    onPress={() =>
                      Alert.alert(
                        "Delete Session",
                        "Remove this chat from history?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Delete",
                            style: "destructive",
                            onPress: () => deleteSession(session.id),
                          },
                        ],
                      )
                    }
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef9a9a" />
                  </TouchableOpacity>
                </View>
              ));
            })()}
          </ScrollView>
        </View>

        {/* Tap-outside overlay */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => {
            setSidebarOpen(false);
            setSidebarSearch("");
          }}
        />
      </View>
    </Modal>
  );

  // ─── Bookmarks Panel ──────────────────────────────────────────────────────
  const renderBookmarks = () => (
    <Modal
      visible={bookmarksOpen}
      animationType="slide"
      transparent
      onRequestClose={() => setBookmarksOpen(false)}
    >
      <View style={{ flex: 1, flexDirection: "row-reverse" }}>
        {/* Panel */}
        <View style={{ width: "92%", backgroundColor: "#fff", height: "100%" }}>
          {/* Header */}
          <View
            style={{
              backgroundColor: "#2d5016",
              paddingTop: 52,
              paddingBottom: 16,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
              Bookmarks
            </Text>
            <TouchableOpacity onPress={() => setBookmarksOpen(false)}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bookmark list */}
          <ScrollView style={{ flex: 1, padding: 12 }}>
            {bookmarks.length === 0 ? (
              <View style={{ alignItems: "center", marginTop: 48 }}>
                <Ionicons name="bookmark-outline" size={40} color="#c5e1a5" />
                <Text
                  style={{
                    color: "#9e9e9e",
                    fontSize: 13,
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  No bookmarks yet.{"\n"}Tap "Save" on any answer!
                </Text>
              </View>
            ) : (
              bookmarks.map((b) => (
                <View
                  key={b.id}
                  style={{
                    backgroundColor: "#fff",
                    borderColor: "#c5e1a5",
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  {/* Question */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#f57f17",
                        marginTop: 2,
                      }}
                    >
                      Q:
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#424242",
                        flex: 1,
                      }}
                      numberOfLines={3}
                    >
                      {b.question}
                    </Text>
                  </View>
                  {/* Answer preview */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: "#2d5016",
                        marginTop: 2,
                      }}
                    >
                      A:
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#616161",
                        flex: 1,
                        lineHeight: 18,
                      }}
                      numberOfLines={4}
                    >
                      {b.answer}
                    </Text>
                  </View>
                  {/* Meta + actions */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: "#bdbdbd" }}>
                        {b.date}
                      </Text>
                      {!!b.detectedLanguage && b.detectedLanguage !== "en" && (
                        <View
                          style={{
                            backgroundColor: "#fff9c4",
                            borderColor: "#f9a825",
                            borderWidth: 1,
                            borderRadius: 10,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 9,
                              color: "#f57f17",
                              fontWeight: "600",
                            }}
                          >
                            {b.detectedLanguage.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "#e8f5e9",
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 20,
                        }}
                        onPress={() =>
                          copyMessage(`Q: ${b.question}\n\nA: ${b.answer}`)
                        }
                      >
                        <Ionicons
                          name="copy-outline"
                          size={12}
                          color="#2d5016"
                        />
                        <Text style={{ fontSize: 11, color: "#2d5016" }}>
                          Copy
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: "#ffebee",
                          borderColor: "#ef9a9a",
                          borderWidth: 1,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 20,
                        }}
                        onPress={() => removeBookmark(b.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={12}
                          color="#c62828"
                        />
                        <Text style={{ fontSize: 11, color: "#c62828" }}>
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Tap-outside overlay */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setBookmarksOpen(false)}
        />
      </View>
    </Modal>
  );

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#f1f8e9]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {renderSidebar()}
      {renderBookmarks()}

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <View className="bg-white px-3 py-2 border-b border-gray-200">
        <View className="flex-row items-center gap-2">
          {/* History / sidebar toggle */}
          <IconButton
            label="Chat history"
            onPress={() => setSidebarOpen(true)}
            btnClass="w-9 h-9 rounded-xl bg-[#e8f5e9] items-center justify-center"
          >
            <Ionicons name="menu" size={20} color="#2d5016" />
          </IconButton>

          {/* Profile / stats pills */}
          <View className="flex-1 flex-row items-center gap-1.5 flex-wrap">
            {stats?.total_documents != null && (
              <View className="bg-[#e8f5e9] px-2.5 py-1 rounded-full">
                <Text className="text-[11px] text-[#33691e] font-semibold">
                  {stats.total_documents.toLocaleString()} docs
                </Text>
              </View>
            )}
            {!!userProfile && (
              <View className="bg-[#e8f5e9] border border-[#a5d6a7] px-2.5 py-1 rounded-full flex-row items-center gap-1">
                <Ionicons name="person" size={11} color="#2d5016" />
                <Text className="text-[11px] text-[#2d5016] font-semibold capitalize">
                  {userProfile.dominant_dosha} · {userProfile.current_season}
                </Text>
              </View>
            )}
          </View>

          {/* Right-side actions */}
          <View className="flex-row items-center gap-1.5">
            <IconButton
              label="Bookmarks"
              onPress={() => setBookmarksOpen(true)}
              btnClass="w-9 h-9 rounded-xl bg-[#fff9c4] items-center justify-center"
            >
              <Ionicons name="bookmark" size={18} color="#f57f17" />
            </IconButton>
            {messages.length > 0 && (
              <IconButton
                label="Export to PDF"
                onPress={exportToPDF}
                btnClass="w-9 h-9 rounded-xl bg-[#e8eaf6] items-center justify-center"
              >
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color="#3949ab"
                />
              </IconButton>
            )}
            {messages.length > 0 && (
              <IconButton
                label="Share"
                onPress={shareChat}
                btnClass="w-9 h-9 rounded-xl bg-[#e3f2fd] items-center justify-center"
              >
                <Ionicons name="share-outline" size={18} color="#1565c0" />
              </IconButton>
            )}
            {messages.length > 0 && (
              <IconButton
                label="Clear chat"
                onPress={clearChat}
                btnClass="w-9 h-9 rounded-xl bg-red-50 items-center justify-center"
              >
                <Ionicons name="trash-outline" size={18} color="#c62828" />
              </IconButton>
            )}
          </View>
        </View>
      </View>

      {/* ── Message list ─────────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && (
          <View className="items-center px-8 mt-10">
            <View className="w-20 h-20 rounded-full bg-[#e8f5e9] items-center justify-center mb-4">
              <Ionicons name="leaf" size={44} color="#2d5016" />
            </View>
            <Text className="text-[18px] font-bold text-[#1b5e20] text-center mb-2">
              Ayurveda Q&amp;A
            </Text>
            <Text className="text-[13px] text-gray-500 text-center leading-5 mb-6">
              Ask anything about Ayurvedic herbs, doshas, treatments and
              classical texts.
            </Text>
            {[
              "What are the benefits of Turmeric?",
              "What foods balance Vata dosha?",
              "How does Ashwagandha help with stress?",
            ].map((q, i) => (
              <TouchableOpacity
                key={i}
                className="w-full bg-white border border-[#c5e1a5] rounded-xl px-4 py-3 mb-2.5 flex-row items-center justify-between"
                onPress={() => handleSend(q)}
              >
                <Text className="text-[13px] text-[#2d5016] flex-1 mr-2">
                  {q}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#558b2f" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {messages.map(renderMessage)}

        {loading && (
          <View className="items-start px-3 mb-4">
            <View className="flex-row items-start gap-2">
              <View className="w-8 h-8 rounded-full bg-[#e8f5e9] items-center justify-center">
                <Ionicons name="leaf" size={16} color="#2d5016" />
              </View>
              <View className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#558b2f" />
                <Text className="text-[13px] text-gray-400">
                  Searching texts…
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <View className="bg-white border-t border-gray-200 px-3 py-2 flex-row items-end gap-2">
        <TextInput
          className="flex-1 bg-[#f5f5f5] rounded-2xl px-4 py-2.5 text-[14px] text-gray-800 max-h-24"
          placeholder={
            isRecording ? "Recording… tap ■ to stop" : "Ask about Ayurveda…"
          }
          placeholderTextColor={isRecording ? "#ef5350" : "#aaa"}
          value={input}
          onChangeText={setInput}
          multiline
          returnKeyType="send"
          onSubmitEditing={() => handleSend()}
          editable={!loading && !isRecording}
        />

        {/* Mic button */}
        <TouchableOpacity
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isRecording ? "bg-red-500" : "bg-[#e8f5e9]"
          }`}
          onPress={handleMicPress}
          disabled={isTranscribing || loading}
        >
          {isTranscribing ? (
            <ActivityIndicator size="small" color="#2d5016" />
          ) : (
            <Ionicons
              name={isRecording ? "stop" : "mic-outline"}
              size={18}
              color={isRecording ? "#fff" : "#2d5016"}
            />
          )}
        </TouchableOpacity>

        {/* Send button */}
        <TouchableOpacity
          className={`w-10 h-10 rounded-full items-center justify-center ${
            input.trim() && !loading ? "bg-[#2d5016]" : "bg-gray-300"
          }`}
          onPress={() => handleSend()}
          disabled={!input.trim() || loading || isRecording}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}