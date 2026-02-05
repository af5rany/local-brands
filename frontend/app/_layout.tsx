import { Stack, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BrandProvider } from "@/context/BrandContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ToastProvider } from "@/context/ToastContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

// This component will handle the conditional routing
function RootLayoutNav() {
  const { token, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // if (!token) {
  // return <Redirect href="/auth/login" />;
  // router.push("/auth/login");
  // }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/register" options={{ headerShown: false }} />
      <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
      <Stack.Screen
        name="brands/index"
        options={{ title: "Local Brands" }}
      />
      <Stack.Screen
        name="brands/create"
        options={{ title: "Create Brand" }}
      />
      <Stack.Screen
        name="brands/[brandId]/index"
        options={{ title: "Brand Details" }}
      />
      <Stack.Screen
        name="products/create/[brandId]"
        options={{ title: "Create Product" }}
      />
      <Stack.Screen
        name="products/[productId]"
        options={{ title: "Product Details" }}
      />
      <Stack.Screen name="profile" options={{ title: "My Profile" }} />
      <Stack.Screen
        name="users/index"
        options={{ title: "User Management" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlobalErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <BrandProvider>
              <RootLayoutNav />
            </BrandProvider>
          </AuthProvider>
        </ToastProvider>
      </GlobalErrorBoundary>
    </GestureHandlerRootView>
  );
}
