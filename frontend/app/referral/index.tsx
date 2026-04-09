import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Share,
  Clipboard,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";

interface Referral {
  id: string;
  referredEmail?: string;
  referredName?: string;
  status: "pending" | "signed_up" | "order_placed" | "completed";
  createdAt: string;
}

const STATUS_CONFIG: Record<
  Referral["status"],
  { label: string; colorKey: "warning" | "info" | "primary" | "success" }
> = {
  pending: { label: "Pending", colorKey: "warning" },
  signed_up: { label: "Signed Up", colorKey: "info" },
  order_placed: { label: "Order Placed", colorKey: "primary" },
  completed: { label: "Completed", colorKey: "success" },
};

const ReferralScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { token } = useAuth();

  const [referralCode, setReferralCode] = useState<string>("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchReferralData = useCallback(async () => {
    if (!token) return;
    try {
      const [codeRes, referralsRes] = await Promise.all([
        fetch(`${getApiUrl()}/referrals/my-code`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${getApiUrl()}/referrals/my-referrals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (codeRes.ok) {
        const codeData = await codeRes.json();
        setReferralCode(codeData.referralCode || "");
        if (codeData.referrals) {
          setReferrals(codeData.referrals);
        }
      }

      if (referralsRes.ok) {
        const referralsData = await referralsRes.json();
        if (Array.isArray(referralsData)) {
          setReferrals(referralsData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReferralData();
    setRefreshing(false);
  };

  const handleCopy = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Local Brands using my referral code: ${referralCode}\n\nSign up, place an order, and we both get a discount!`,
      });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const renderReferralItem = ({ item }: { item: Referral }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const badgeColor = colors[config.colorKey];
    const badgeBg = colors[`${config.colorKey}Soft` as keyof typeof colors];

    return (
      <View
        style={[
          styles.referralItem,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <View style={styles.referralInfo}>
          <View
            style={[styles.referralAvatar, { backgroundColor: colors.primarySoft }]}
          >
            <Ionicons name="person-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.referralText}>
            <Text style={[styles.referralName, { color: colors.text }]}>
              {item.referredName || item.referredEmail || "Invited Friend"}
            </Text>
            <Text style={[styles.referralDate, { color: colors.textTertiary }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.statusText, { color: badgeColor }]}>
            {config.label}
          </Text>
        </View>
      </View>
    );
  };

  const ListHeader = () => (
    <View style={styles.content}>
      {/* Illustration Section */}
      <View
        style={[
          styles.illustrationContainer,
          { backgroundColor: colors.primarySoft },
        ]}
      >
        <View
          style={[styles.giftCircle, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="gift" size={40} color="#FFFFFF" />
        </View>
      </View>

      {/* Explanation */}
      <Text style={[styles.heading, { color: colors.text }]}>
        Earn Rewards by Sharing
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        Share your referral code with friends. When they sign up, place an
        order, and receive it, you get a discount!
      </Text>

      {/* Referral Code Box */}
      <View
        style={[
          styles.codeContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          },
        ]}
      >
        <Text style={[styles.codeLabel, { color: colors.textTertiary }]}>
          YOUR REFERRAL CODE
        </Text>
        <View style={styles.codeRow}>
          <Text style={[styles.codeText, { color: colors.text }]}>
            {loading ? "..." : referralCode || "N/A"}
          </Text>
          <TouchableOpacity
            style={[
              styles.copyBtn,
              {
                backgroundColor: copied
                  ? colors.successSoft
                  : colors.primarySoft,
              },
            ]}
            onPress={handleCopy}
            activeOpacity={0.7}
            disabled={!referralCode}
          >
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={16}
              color={copied ? colors.success : colors.primary}
            />
            <Text
              style={[
                styles.copyText,
                { color: copied ? colors.success : colors.primary },
              ]}
            >
              {copied ? "Copied!" : "Copy"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Share Button */}
      <TouchableOpacity
        style={[styles.shareBtn, { backgroundColor: colors.primary }]}
        onPress={handleShare}
        activeOpacity={0.7}
        disabled={!referralCode}
      >
        <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
        <Text style={styles.shareBtnText}>Share with Friends</Text>
      </TouchableOpacity>

      {/* Referrals List Header */}
      {referrals.length > 0 && (
        <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
          YOUR REFERRALS
        </Text>
      )}
    </View>
  );

  const EmptyReferrals = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="people-outline"
        size={48}
        color={colors.textTertiary}
      />
      <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
        No referrals yet. Share your code to get started!
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[styles.header, { borderBottomColor: colors.borderLight }]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.backCircle,
              { backgroundColor: colors.surfaceRaised },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </View>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Invite Friends
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={referrals}
          keyExtractor={(item) => item.id}
          renderItem={renderReferralItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyReferrals}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 2,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Content
  listContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 16,
  },

  // Illustration
  illustrationContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    borderRadius: 0,
    marginBottom: 24,
  },
  giftCircle: {
    width: 80,
    height: 80,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  // Text
  heading: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },

  // Code box
  codeContainer: {
    padding: 20,
    borderRadius: 0,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  codeText: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 2,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 0,
    gap: 4,
  },
  copyText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Share button
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 0,
    gap: 8,
    marginBottom: 28,
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  // Referrals section
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  // Referral item
  referralItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 0,
    borderWidth: 1,
    marginBottom: 8,
  },
  referralInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  referralAvatar: {
    width: 36,
    height: 36,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  referralText: {
    flex: 1,
  },
  referralName: {
    fontSize: 14,
    fontWeight: "600",
  },
  referralDate: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
});

export default ReferralScreen;
