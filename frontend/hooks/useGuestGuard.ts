import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export const useGuestGuard = () => {
  const { isGuest } = useAuth();
  const router = useRouter();

  const requireAuth = (): boolean => {
    if (!isGuest) return false;
    Alert.alert(
      "Guest Account",
      "Create an account to like posts, save items, and leave comments.",
      [
        { text: "Sign In", onPress: () => router.push("/auth/login" as any) },
        {
          text: "Create Account",
          style: "default",
          onPress: () => router.push("/auth/register" as any),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
    return true;
  };

  return { requireAuth };
};
