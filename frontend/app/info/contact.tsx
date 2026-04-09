import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";

const CHANNELS = [
  {
    icon: "mail-outline" as const,
    title: "Email Support",
    detail: "support@localsooq.com",
    note: "We reply within 24 hours",
  },
  {
    icon: "logo-whatsapp" as const,
    title: "WhatsApp",
    detail: "+1 (800) 555-0192",
    note: "Mon–Fri, 9 AM – 6 PM",
  },
  {
    icon: "chatbubble-ellipses-outline" as const,
    title: "Live Chat",
    detail: "Available in-app",
    note: "Fastest response time",
  },
  {
    icon: "location-outline" as const,
    title: "Head Office",
    detail: "Dubai Design District, UAE",
    note: "By appointment only",
  },
];

const SUBJECTS = [
  "Order Issue",
  "Return / Refund",
  "Product Question",
  "Brand Partnership",
  "Other",
];

const ContactScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();

  const [selectedSubject, setSelectedSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = () => {
    if (!selectedSubject) {
      Alert.alert("Select a subject", "Please choose a subject before sending.");
      return;
    }
    if (message.trim().length < 10) {
      Alert.alert("Message too short", "Please write at least a few words so we can help you.");
      return;
    }
    setSending(true);
    // Simulate send
    setTimeout(() => {
      setSending(false);
      setMessage("");
      setSelectedSubject("");
      Alert.alert(
        "Message Sent",
        "Thanks for reaching out! Our team will get back to you within 24 hours.",
      );
    }, 1200);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Contact Us
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: colors.surfaceRaised }]}>
          <Ionicons name="headset-outline" size={36} color={colors.text} />
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            We're here to help.
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Have a question or need support? Reach us through any of the
            channels below, or send us a message directly.
          </Text>
        </View>

        {/* Channels */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Get In Touch
        </Text>
        {CHANNELS.map((ch) => (
          <View
            key={ch.title}
            style={[
              styles.channelCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.surfaceRaised },
              ]}
            >
              <Ionicons name={ch.icon} size={20} color={colors.text} />
            </View>
            <View style={styles.channelBody}>
              <Text style={[styles.channelTitle, { color: colors.text }]}>
                {ch.title}
              </Text>
              <Text style={[styles.channelDetail, { color: colors.textSecondary }]}>
                {ch.detail}
              </Text>
              <Text style={[styles.channelNote, { color: colors.textTertiary }]}>
                {ch.note}
              </Text>
            </View>
          </View>
        ))}

        {/* Send a message */}
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          Send a Message
        </Text>

        {/* Subject picker */}
        <View style={styles.subjectRow}>
          {SUBJECTS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.subjectPill,
                {
                  backgroundColor:
                    selectedSubject === s
                      ? colors.primary
                      : colors.surfaceRaised,
                  borderColor:
                    selectedSubject === s ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedSubject(s)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.subjectPillText,
                  {
                    color:
                      selectedSubject === s
                        ? colors.primaryForeground
                        : colors.textSecondary,
                    fontWeight: selectedSubject === s ? "700" : "500",
                  },
                ]}
              >
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Message input */}
        <View
          style={[
            styles.inputWrap,
            { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Describe your issue or question..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {message.length} / 500
          </Text>
        </View>

        {/* Send button */}
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: colors.primary, opacity: sending ? 0.7 : 1 },
          ]}
          onPress={handleSend}
          activeOpacity={0.8}
          disabled={sending}
        >
          <Ionicons
            name={sending ? "hourglass-outline" : "send-outline"}
            size={18}
            color={colors.primaryForeground}
          />
          <Text style={[styles.sendBtnText, { color: colors.primaryForeground }]}>
            {sending ? "Sending..." : "Send Message"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  hero: {
    borderRadius: 0,
    padding: 24,
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
    marginTop: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 4,
  },
  channelCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
    borderRadius: 0,
    borderWidth: 0.5,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  channelBody: {
    flex: 1,
    gap: 2,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  channelDetail: {
    fontSize: 13,
  },
  channelNote: {
    fontSize: 12,
  },
  subjectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  subjectPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 0.5,
  },
  subjectPillText: {
    fontSize: 13,
  },
  inputWrap: {
    borderRadius: 0,
    borderWidth: 0.5,
    padding: 14,
    gap: 8,
  },
  input: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 100,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 0,
    marginTop: 4,
  },
  sendBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});

export default ContactScreen;
