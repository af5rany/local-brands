import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";

interface PublicProfile {
  id: number;
  name: string;
  avatar: string | null;
  role: string;
  brandId: number | null;
}

const PublicUserProfile = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`${getApiUrl()}/users/${id}/public-profile`)
      .then((r) => r.json())
      .then((data) => {
        if (data.brandId) {
          router.replace(`/brands/${data.brandId}` as any);
        } else {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>PROFILE</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.text} />
      ) : profile ? (
        <View style={styles.content}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.surfaceRaised }]}>
              <Ionicons name="person" size={40} color={colors.textTertiary} />
            </View>
          )}
          <Text style={[styles.name, { color: colors.text }]}>{profile.name}</Text>
          <Text style={[styles.role, { color: colors.textTertiary }]}>{profile.role.toUpperCase()}</Text>
        </View>
      ) : (
        <Text style={[styles.error, { color: colors.textTertiary }]}>Profile not found.</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  content: { alignItems: "center", paddingTop: 48, gap: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, justifyContent: "center", alignItems: "center" },
  name: { fontSize: 20, fontWeight: "700" },
  role: { fontSize: 11, letterSpacing: 1.5, fontWeight: "600" },
  error: { textAlign: "center", marginTop: 60, fontSize: 14 },
});

export default PublicUserProfile;
