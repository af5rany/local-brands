import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColor";
import getApiUrl from "@/helpers/getApiUrl";

interface Notification {
  id: string;
  type: "order_update" | "discount" | "referral" | "stock_alert" | "general";
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

const NOTIFICATION_ICONS: Record<
  Notification["type"],
  { name: string; colorKey: "primary" | "danger" | "success" | "warning" | "info" }
> = {
  order_update: { name: "receipt-outline", colorKey: "primary" },
  discount: { name: "pricetag-outline", colorKey: "danger" },
  referral: { name: "gift-outline", colorKey: "success" },
  stock_alert: { name: "notifications-outline", colorKey: "warning" },
  general: { name: "information-circle-outline", colorKey: "info" },
};

function timeAgo(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

const NotificationsScreen = () => {
  const router = useRouter();
  const colors = useThemeColors();
  const { token } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${getApiUrl()}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notification: Notification) => {
    if (!token) return;

    // Optimistically update UI
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await fetch(`${getApiUrl()}/notifications/${notification.id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        // Revert on failure
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: false } : n
          )
        );
        setUnreadCount((prev) => prev + 1);
      }
    }

    // Navigate based on notification data
    if (notification.data) {
      if (notification.data.orderId) {
        router.push(`/orders/${notification.data.orderId}` as any);
      } else if (notification.data.productId) {
        router.push(`/products/${notification.data.productId}` as any);
      } else if (notification.data.brandId) {
        router.push(`/brands/${notification.data.brandId}` as any);
      } else if (notification.type === "referral") {
        router.push("/referral" as any);
      }
    }
  };

  const markAllAsRead = async () => {
    if (!token || unreadCount === 0) return;

    // Optimistically update UI
    const prevNotifications = [...notifications];
    const prevUnreadCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch(`${getApiUrl()}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      // Revert on failure
      setNotifications(prevNotifications);
      setUnreadCount(prevUnreadCount);
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const iconConfig =
      NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.general;
    const iconColor = colors[iconConfig.colorKey];
    const iconBg =
      colors[`${iconConfig.colorKey}Soft` as keyof typeof colors];

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.read
              ? colors.surface
              : colors.primarySoft,
            borderColor: colors.borderLight,
          },
        ]}
        onPress={() => markAsRead(item)}
        activeOpacity={0.7}
      >
        {/* Unread Dot */}
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}

        {/* Icon */}
        <View style={[styles.notificationIcon, { backgroundColor: iconBg }]}>
          <Ionicons
            name={iconConfig.name as any}
            size={20}
            color={iconColor}
          />
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          <Text
            style={[
              styles.notificationTitle,
              { color: colors.text },
              !item.read && styles.notificationTitleUnread,
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.notificationMessage,
              { color: colors.textSecondary },
            ]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text
            style={[styles.notificationTime, { color: colors.textTertiary }]}
          >
            {timeAgo(item.createdAt)}
          </Text>
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[
          styles.emptyIconCircle,
          { backgroundColor: colors.surfaceRaised },
        ]}
      >
        <Ionicons
          name="notifications-off-outline"
          size={48}
          color={colors.textTertiary}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Notifications
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
        You're all caught up! We'll notify you when there's something new.
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
          Notifications
        </Text>
        <TouchableOpacity
          onPress={markAllAsRead}
          activeOpacity={0.7}
          disabled={unreadCount === 0}
          style={styles.markAllBtn}
        >
          <Text
            style={[
              styles.markAllText,
              {
                color: unreadCount > 0 ? colors.primary : colors.textTertiary,
              },
            ]}
          >
            Mark All Read
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={[
            styles.listContent,
            notifications.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <View style={{ height: 1 }} />}
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
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // List
  listContent: {
    paddingVertical: 8,
  },
  emptyListContent: {
    flex: 1,
  },

  // Notification item
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  notificationTitleUnread: {
    fontWeight: "700",
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 11,
    fontWeight: "500",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default NotificationsScreen;
