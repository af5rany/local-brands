import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Alert,
  StatusBar,
  useColorScheme,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import getApiUrl from "@/helpers/getApiUrl";
import { useAuth } from "@/context/AuthContext";
import { User } from "@/types/user";
import { UserRole, UserStatus } from "@/types/enums";

type SortOption = "newest" | "oldest" | "name_asc" | "name_desc";

const getRelativeTime = (dateStr?: string | null): string => {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

const UsersListScreen = () => {
  const { token, user: currentUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [error, setError] = useState("");

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [processing, setProcessing] = useState(false);

  // B&W theme
  const bg = isDark ? "#000000" : "#FFFFFF";
  const text = isDark ? "#FFFFFF" : "#000000";
  const secondary = isDark ? "#8E8E93" : "#6B6B6B";
  const border = isDark ? "#2C2C2E" : "#E5E5E5";
  const inputBg = isDark ? "#1C1C1E" : "#F5F5F5";
  const cardBg = isDark ? "#1C1C1E" : "#FAFAFA";

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/users?excludeGuests=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
      setError("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const updateUserStatus = async (userId: number, status: UserStatus) => {
    try {
      setProcessing(true);
      const response = await fetch(`${getApiUrl()}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update user status");
      Alert.alert("Success", `User ${status} successfully`);
      fetchUsers();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setProcessing(false);
    }
  };

  const updateUserRole = async (userId: number, role: UserRole) => {
    const doUpdate = async () => {
      try {
        setProcessing(true);
        const response = await fetch(`${getApiUrl()}/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role }),
        });
        if (!response.ok) throw new Error("Failed to update user role");
        Alert.alert("Success", "User role updated successfully");
        fetchUsers();
        setShowRoleModal(false);
      } catch (err: any) {
        Alert.alert("Error", err.message);
      } finally {
        setProcessing(false);
      }
    };

    // P5: Confirm admin escalation
    if (role === UserRole.ADMIN) {
      Alert.alert(
        "Grant Admin Access",
        `This gives ${selectedUser?.name} full platform control. Continue?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Grant Admin", style: "destructive", onPress: doUpdate },
        ],
      );
    } else {
      doUpdate();
    }
  };

  const filteredUsers = useMemo(() => {
    const filtered = users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });

    // P4: Sort
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name_desc":
          return (b.name || "").localeCompare(a.name || "");
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [users, searchQuery, roleFilter, statusFilter, sortOption]);

  const roleLabels: Record<string, string> = {
    all: "All",
    [UserRole.ADMIN]: "Admin",
    [UserRole.BRAND_OWNER]: "Brand Owner",
    [UserRole.CUSTOMER]: "Customer",
  };

  const statusLabels: Record<string, string> = {
    all: "All",
    [UserStatus.APPROVED]: "Approved",
    [UserStatus.BLOCKED]: "Blocked",
  };

  const sortLabels: Record<SortOption, string> = {
    newest: "Newest",
    oldest: "Oldest",
    name_asc: "A-Z",
    name_desc: "Z-A",
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "ADMIN";
      case UserRole.BRAND_OWNER:
        return "BRAND OWNER";
      case UserRole.CUSTOMER:
        return "CUSTOMER";
      case UserRole.GUEST:
        return "GUEST";
      default:
        return (role as string).toUpperCase();
    }
  };

  const renderFilterRow = (
    label: string,
    options: string[],
    active: string,
    onSelect: (v: string) => void,
    labels: Record<string, string>,
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      <Text style={[styles.filterLabel, { color: secondary }]}>{label}</Text>
      {options.map((option) => {
        const isActive = active === option;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            style={[
              styles.filterChip,
              {
                backgroundColor: isActive ? text : "transparent",
                borderColor: isActive ? text : border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: isActive ? bg : secondary },
              ]}
            >
              {labels[option] || option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderUser = ({ item }: { item: User }) => {
    const isCurrentUser = item.id === currentUser?.id;
    const isBlocked = item.status === UserStatus.BLOCKED;

    return (
      <View style={[styles.userCard, { backgroundColor: cardBg, borderColor: border }]}>
        {/* Top row: avatar + name + role */}
        <View style={styles.userTopRow}>

          {/* P1: Show actual avatar or initials fallback */}
          <View style={styles.avatarContainer}>
            {item.avatar ? (
              <Image
                source={{ uri: item.avatar }}
                style={[styles.avatar, styles.avatarImage]}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: text }]}>
                <Text style={[styles.avatarText, { color: bg }]}>
                  {(item.name || item.email)?.[0]?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.userName, { color: text }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {isCurrentUser && (
                <View style={[styles.youBadge, { borderColor: border }]}>
                  <Text style={[styles.youText, { color: secondary }]}>
                    YOU
                  </Text>
                </View>
              )}
            </View>

            {/* Email + P2: Unverified indicator */}
            <View style={styles.emailRow}>
              <Text
                style={[styles.userEmail, { color: secondary }]}
                numberOfLines={1}
              >
                {item.email}
              </Text>
              {item.isEmailVerified === false && (
                <View style={styles.unverifiedBadge}>
                  <Ionicons name="mail-unread-outline" size={11} color={secondary} />
                  <Text style={[styles.unverifiedText, { color: secondary }]}>
                    Unverified
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.roleBadge, { borderColor: border }]}>
            <Text style={[styles.roleText, { color: text }]}>
              {getRoleLabel(item.role)}
            </Text>
          </View>
        </View>

        {/* Meta row: blocked status + P3: last seen */}
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            {isBlocked && (
              <>
                <Ionicons name="ban" size={14} color="#FF3B30" />
                <Text style={[styles.metaText, { color: "#FF3B30" }]}>
                  Blocked
                </Text>
              </>
            )}
          </View>
          <Text style={[styles.metaText, { color: secondary }]}>
            Last seen {getRelativeTime(item.lastLoginAt)}
          </Text>
        </View>

        {/* Assigned brands (read-only) */}
        {item.brandUsers && item.brandUsers.length > 0 && (
          <View style={[styles.brandsSection, { borderTopColor: border }]}>
            <Text style={[styles.brandsLabel, { color: secondary }]}>
              BRANDS
            </Text>
            <View style={styles.brandsRow}>
              {item.brandUsers.map((bu) => (
                <View
                  key={bu.id}
                  style={[styles.brandChip, { borderColor: border }]}
                >
                  <Text style={[styles.brandChipText, { color: text }]}>
                    {bu.brand?.name || `Brand #${bu.brandId}`}
                  </Text>
                  <Text style={[styles.brandRoleText, { color: secondary }]}>
                    {bu.role}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={[styles.actionsRow, { borderTopColor: border }]}>
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: border }]}
            onPress={() => {
              setSelectedUser(item);
              setShowRoleModal(true);
            }}
            disabled={isCurrentUser}
          >
            <Ionicons
              name="shield-outline"
              size={16}
              color={isCurrentUser ? border : text}
            />
            <Text
              style={[
                styles.actionText,
                { color: isCurrentUser ? border : text },
              ]}
            >
              Change Role
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                borderColor: isCurrentUser
                  ? border
                  : isBlocked
                    ? text
                    : "#FF3B30",
              },
            ]}
            onPress={() => {
              const newStatus = isBlocked
                ? UserStatus.APPROVED
                : UserStatus.BLOCKED;
              const action = isBlocked ? "unblock" : "block";
              Alert.alert(
                `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
                `Are you sure you want to ${action} ${item.name}?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: action.charAt(0).toUpperCase() + action.slice(1),
                    style: isBlocked ? "default" : "destructive",
                    onPress: () => updateUserStatus(item.id, newStatus),
                  },
                ],
              );
            }}
            disabled={processing || isCurrentUser}
          >
            <Ionicons
              name={isBlocked ? "checkmark-circle-outline" : "ban-outline"}
              size={16}
              color={isCurrentUser ? border : isBlocked ? text : "#FF3B30"}
            />
            <Text
              style={[
                styles.actionText,
                {
                  color: isCurrentUser
                    ? border
                    : isBlocked
                      ? text
                      : "#FF3B30",
                },
              ]}
            >
              {isBlocked ? "Unblock" : "Block"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="small" color={text} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: text }]}>USERS</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* User count */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: secondary }]}>
          {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
          {roleFilter !== "all" || statusFilter !== "all" ? " (filtered)" : ""}
        </Text>
      </View>

      {/* Search + Filters */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: inputBg }]}>
          <Ionicons name="search" size={18} color={secondary} />
          <TextInput
            style={[styles.searchInput, { color: text }]}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={secondary}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={secondary} />
            </TouchableOpacity>
          )}
        </View>

        {renderFilterRow(
          "Role",
          ["all", UserRole.ADMIN, UserRole.BRAND_OWNER, UserRole.CUSTOMER],
          roleFilter,
          setRoleFilter,
          roleLabels,
        )}
        <View style={{ height: 8 }} />
        {renderFilterRow(
          "Status",
          ["all", ...Object.values(UserStatus)],
          statusFilter,
          setStatusFilter,
          statusLabels,
        )}
        <View style={{ height: 8 }} />
        {renderFilterRow(
          "Sort",
          ["newest", "oldest", "name_asc", "name_desc"] as SortOption[],
          sortOption,
          (v) => setSortOption(v as SortOption),
          sortLabels,
        )}
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: "#FF3B30" }]}>{error}</Text>
          <TouchableOpacity onPress={fetchUsers}>
            <Text style={[styles.retryText, { color: text }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* User list */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={text}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={border} />
            <Text style={[styles.emptyTitle, { color: text }]}>
              No users found
            </Text>
            <Text style={[styles.emptySubtitle, { color: secondary }]}>
              {searchQuery
                ? "Try adjusting your search or filters"
                : "No users match the current filters"}
            </Text>
          </View>
        }
      />

      {/* Role change modal */}
      <Modal visible={showRoleModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoleModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContent, { backgroundColor: bg }]}
          >
            <Text style={[styles.modalTitle, { color: text }]}>
              CHANGE ROLE
            </Text>
            <Text style={[styles.modalSubtitle, { color: secondary }]}>
              {selectedUser?.name}
            </Text>

            <View style={[styles.modalDivider, { backgroundColor: border }]} />

            {[UserRole.ADMIN, UserRole.BRAND_OWNER, UserRole.CUSTOMER].map(
              (role) => {
                const isSelected = selectedUser?.role === role;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      { borderBottomColor: border },
                      isSelected && { backgroundColor: inputBg },
                    ]}
                    onPress={() => updateUserRole(selectedUser!.id, role)}
                    disabled={processing || isSelected}
                  >
                    <View>
                      <Text style={[styles.roleOptionText, { color: text }]}>
                        {getRoleLabel(role)}
                      </Text>
                      <Text
                        style={[
                          styles.roleOptionDescription,
                          { color: secondary },
                        ]}
                      >
                        {role === UserRole.ADMIN
                          ? "Full platform access"
                          : role === UserRole.BRAND_OWNER
                            ? "Manage assigned brands"
                            : "Browse and purchase"}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={text} />
                    )}
                  </TouchableOpacity>
                );
              },
            )}

            <TouchableOpacity
              style={[styles.modalCancel, { borderTopColor: border }]}
              onPress={() => setShowRoleModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: secondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 16, fontWeight: "700", letterSpacing: 1.5 },

  countRow: { paddingHorizontal: 20, marginBottom: 4 },
  countText: { fontSize: 13 },

  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 0,
    marginBottom: 14,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },

  filterRow: { flexDirection: "row", alignItems: "center" },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginRight: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 0,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: { fontSize: 12, fontWeight: "500" },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 12,
  },
  errorText: { fontSize: 13 },
  retryText: {
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  list: { paddingHorizontal: 20 },

  userCard: {
    borderRadius: 0,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  userTopRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  avatarContainer: { marginRight: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 0,
  },
  avatarText: { fontSize: 16, fontWeight: "700" },
  userDetails: { flex: 1, marginRight: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  userName: { fontSize: 15, fontWeight: "600" },
  youBadge: {
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 0,
  },
  youText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
    flexWrap: "wrap",
  },
  userEmail: { fontSize: 13 },
  unverifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  unverifiedText: { fontSize: 11 },
  roleBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
  },
  roleText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  metaLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12 },

  brandsSection: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brandsLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  brandsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  brandChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 0,
    gap: 6,
  },
  brandChipText: { fontSize: 12, fontWeight: "500" },
  brandRoleText: { fontSize: 10 },

  actionsRow: { flexDirection: "row", borderTopWidth: 1 },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  actionText: { fontSize: 12, fontWeight: "600" },

  emptyState: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  emptySubtitle: { fontSize: 13 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: { borderRadius: 0, overflow: "hidden" },
  modalTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  modalSubtitle: {
    fontSize: 14,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  modalDivider: { height: 1, marginTop: 16 },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  roleOptionText: { fontSize: 14, fontWeight: "600" },
  roleOptionDescription: { fontSize: 12, marginTop: 2 },
  modalCancel: {
    borderTopWidth: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 14, fontWeight: "500" },
});

export default UsersListScreen;
