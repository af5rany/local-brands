import { Stack, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

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
    <>
      {!token ? (
        <Stack>
          <Stack.Screen name="auth/login" options={{ title: "Login" }} />
          <Stack.Screen name="auth/register" options={{ title: "Register" }} />
          <Stack.Screen
            name="index"
            options={{ headerShown: false }}
            redirect={!token}
          />
        </Stack>
      ) : (
        // App screens when logged in
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
        </Stack>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
