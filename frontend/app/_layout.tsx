// app/_layout.tsx
import React from "react";

import { createStackNavigator } from "@react-navigation/stack";

import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import BrandsListScreen from "../screens/brands/BrandsListScreen";
import BrandDetailScreen from "../screens/brands/BrandDetailScreen";
import ProductDetailScreen from "../screens/products/ProductDetailScreen";
import RegisterScreen from "@/screens/auth/RegisterScreen";
import CreateBrandScreen from "@/screens/brands/CreateBrandScreen";
import HomeScreen from "./(tabs)";
import { AuthProvider } from "@/context/AuthContext";
import CreateProductScreen from "@/screens/brands/CreateProductScreen";

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  BrandsList: undefined;
  CreateBrand: undefined;
  CreateProduct: undefined;
  Home: undefined;
  ForgotPassword: undefined;
  BrandDetail: { brandId: string };
  ProductDetail: { productId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppLayout() {
  return (
    <AuthProvider>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Login" }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: "Register" }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Home" }}
        />
        <Stack.Screen
          name="BrandsList"
          component={BrandsListScreen}
          options={{ title: "Local Brands" }}
        />
        <Stack.Screen
          name="CreateBrand"
          component={CreateBrandScreen}
          options={{ title: "Local Brands" }}
        />
        <Stack.Screen
          name="BrandDetail"
          component={BrandDetailScreen}
          options={{ title: "Brand Details" }}
        />
        <Stack.Screen
          name="CreateProduct"
          component={CreateProductScreen}
          options={{ title: "Create Product" }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ title: "Product Details" }}
        />
      </Stack.Navigator>
    </AuthProvider>
  );
}
