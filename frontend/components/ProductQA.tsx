import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";

interface QAItem {
  id: number;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  user?: { name?: string; email?: string };
  answeredBy?: { name?: string };
}

interface ProductQAProps {
  productId: number;
  brandId?: number;
}

const ProductQA = ({ productId, brandId }: ProductQAProps) => {
  const colors = useThemeColors();
  const { token, user } = useAuth();

  const [qas, setQas] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [askText, setAskText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [expandedAsk, setExpandedAsk] = useState(false);
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerSubmitting, setAnswerSubmitting] = useState(false);

  const userRole = user?.role || user?.userRole;
  const isBrandOwner = userRole === "BRAND_OWNER" || userRole === "ADMIN";

  const fetchQAs = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/products/${productId}/questions`);
      if (res.ok) setQas(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [productId]);

  useEffect(() => {
    fetchQAs();
  }, [fetchQAs]);

  const handleAsk = async () => {
    const q = askText.trim();
    if (!q) return;
    if (!token) {
      Alert.alert("Sign in required", "Please log in to ask a question.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiUrl()}/products/${productId}/questions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to submit question");
      }
      const newQ = await res.json();
      setQas((prev) => [newQ, ...prev]);
      setAskText("");
      setExpandedAsk(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (questionId: number) => {
    const a = answerText.trim();
    if (!a) return;
    setAnswerSubmitting(true);
    try {
      const res = await fetch(`${getApiUrl()}/products/questions/${questionId}/answer`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ answer: a }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      const updated = await res.json();
      setQas((prev) => prev.map((q) => (q.id === questionId ? { ...q, answer: updated.answer, answeredAt: updated.answeredAt } : q)));
      setAnsweringId(null);
      setAnswerText("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setAnswerSubmitting(false);
    }
  };

  const answeredQAs = qas.filter((q) => q.answer);
  const pendingQAs = qas.filter((q) => !q.answer);

  return (
    <View style={[styles.container, { borderTopColor: colors.borderLight }]}>
      <Text style={[styles.sectionLabel, { color: colors.text }]}>
        Q&A ({qas.length})
      </Text>

      {/* Ask a question */}
      {token && !isBrandOwner && (
        <View style={styles.askBlock}>
          {!expandedAsk ? (
            <TouchableOpacity
              style={[styles.askPrompt, { borderColor: colors.border }]}
              onPress={() => setExpandedAsk(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.askPromptText, { color: colors.textTertiary }]}>
                Ask a question about this product...
              </Text>
            </TouchableOpacity>
          ) : (
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
              <TextInput
                style={[styles.askInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                placeholder="Your question..."
                placeholderTextColor={colors.textTertiary}
                value={askText}
                onChangeText={setAskText}
                multiline
                autoFocus
              />
              <View style={styles.askActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => { setExpandedAsk(false); setAskText(""); }}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: colors.text }, (submitting || !askText.trim()) && { opacity: 0.4 }]}
                  onPress={handleAsk}
                  disabled={submitting || !askText.trim()}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={[styles.submitBtnText, { color: colors.background }]}>SUBMIT</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      )}

      {loading && (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
      )}

      {/* Pending (unanswered) — shown to brand owners */}
      {isBrandOwner && pendingQAs.length > 0 && (
        <View style={[styles.pendingBlock, { borderColor: colors.border }]}>
          <Text style={[styles.pendingLabel, { color: colors.textSecondary }]}>
            AWAITING YOUR ANSWER ({pendingQAs.length})
          </Text>
          {pendingQAs.map((qa) => (
            <View key={qa.id} style={[styles.qaRow, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.qText, { color: colors.text }]}>{qa.question}</Text>
              <Text style={[styles.qMeta, { color: colors.textTertiary }]}>
                {qa.user?.name || qa.user?.email || "Customer"} · {new Date(qa.createdAt).toLocaleDateString()}
              </Text>
              {answeringId === qa.id ? (
                <View style={styles.answerEditBlock}>
                  <TextInput
                    style={[styles.answerInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                    placeholder="Your answer..."
                    placeholderTextColor={colors.textTertiary}
                    value={answerText}
                    onChangeText={setAnswerText}
                    multiline
                    autoFocus
                  />
                  <View style={styles.askActions}>
                    <TouchableOpacity
                      style={[styles.cancelBtn, { borderColor: colors.border }]}
                      onPress={() => { setAnsweringId(null); setAnswerText(""); }}
                    >
                      <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>CANCEL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.submitBtn, { backgroundColor: colors.text }, (answerSubmitting || !answerText.trim()) && { opacity: 0.4 }]}
                      onPress={() => handleAnswer(qa.id)}
                      disabled={answerSubmitting || !answerText.trim()}
                    >
                      {answerSubmitting ? (
                        <ActivityIndicator size="small" color={colors.background} />
                      ) : (
                        <Text style={[styles.submitBtnText, { color: colors.background }]}>ANSWER</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.answerBtn, { borderColor: colors.text }]}
                  onPress={() => { setAnsweringId(qa.id); setAnswerText(""); }}
                >
                  <Text style={[styles.answerBtnText, { color: colors.text }]}>ANSWER</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Answered Q&As — visible to all */}
      {!loading && answeredQAs.length === 0 && qas.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
          No questions yet. Be the first to ask.
        </Text>
      )}

      {answeredQAs.map((qa) => (
        <View key={qa.id} style={[styles.qaRow, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.qaQRow}>
            <Ionicons name="help-circle-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.qText, { color: colors.text, flex: 1 }]}>{qa.question}</Text>
          </View>
          <View style={[styles.answerBlock, { backgroundColor: colors.surface }]}>
            <View style={styles.qaQRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.aText, { color: colors.text, flex: 1 }]}>{qa.answer}</Text>
            </View>
            <Text style={[styles.qMeta, { color: colors.textTertiary, marginTop: 4 }]}>
              {qa.answeredAt ? new Date(qa.answeredAt).toLocaleDateString() : ""}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  askBlock: {
    marginBottom: 16,
  },
  askPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  askPromptText: {
    fontSize: 13,
    flex: 1,
  },
  askInput: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  answerInput: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: "top",
    marginTop: 8,
  },
  answerEditBlock: {
    marginTop: 8,
  },
  askActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 10,
    alignItems: "center",
    minHeight: 38,
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  pendingBlock: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  pendingLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  qaRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 6,
  },
  qaQRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
  },
  qText: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },
  qMeta: {
    fontSize: 10,
    marginLeft: 20,
  },
  answerBlock: {
    marginLeft: 20,
    padding: 10,
    marginTop: 4,
  },
  aText: {
    fontSize: 13,
    lineHeight: 20,
  },
  answerBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  answerBtnText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  emptyText: {
    fontSize: 12,
    paddingVertical: 12,
  },
});

export default ProductQA;
