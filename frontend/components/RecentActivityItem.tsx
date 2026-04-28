import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";

type RecentActivityItemProps = {
  title: string;
  subtitle: string;
  time: string;
  icon: string;
  color: string;
};

const RecentActivityItem: React.FC<RecentActivityItemProps> = ({
  title,
  subtitle,
  time,
  icon,
  color,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
  <View style={styles.activityItem}>
    <View style={[styles.activityIcon, { backgroundColor: color + "20" }]}>
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={20}
        color={color}
      />
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activitySubtitle}>{subtitle}</Text>
    </View>
    <Text style={styles.activityTime}>{time}</Text>
  </View>
  );
};

type Activity = {
  title: string;
  subtitle: string;
  time: string;
  icon: string;
  color: string;
};

type RecentActivityProps = {
  activities: Activity[];
  showComingSoon: () => void;
};

const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  showComingSoon,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <Pressable onPress={showComingSoon}>
        <Text style={styles.seeAllText}>See All</Text>
      </Pressable>
    </View>
    <View style={styles.activityContainer}>
      {activities.map((activity, index) => (
        <RecentActivityItem
          key={index}
          title={activity.title}
          subtitle={activity.subtitle}
          time={activity.time}
          icon={activity.icon}
          color={activity.color}
        />
      ))}
    </View>
  </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 16,
    color: colors.link,
    fontWeight: "600",
  },
  activityContainer: {
    backgroundColor: colors.surface,
    borderRadius: 0,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activityTime: {
    fontSize: 12,
    color: colors.textTertiary,
  },
});

export default RecentActivity;
