import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColor";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = "100%", height = 16, style }) => {
  const colors = useThemeColors();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width: width as any, height, backgroundColor: colors.surfaceRaised },
        { opacity },
        style,
      ]}
    />
  );
};

// Pre-built skeletons for common list patterns

export const ProductCardSkeleton: React.FC = () => {
  const colors = useThemeColors();
  return (
    <View style={[skeletonStyles.productCard, { backgroundColor: colors.background }]}>
      <Skeleton width="100%" height={200} />
      <Skeleton width="70%" height={12} style={{ marginTop: 8 }} />
      <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
    </View>
  );
};

export const OrderCardSkeleton: React.FC = () => (
  <View style={skeletonStyles.orderCard}>
    <View style={skeletonStyles.orderCardTop}>
      <Skeleton width="40%" height={14} />
      <Skeleton width="20%" height={20} />
    </View>
    <Skeleton width="60%" height={11} style={{ marginTop: 8 }} />
    <Skeleton width="80%" height={11} style={{ marginTop: 6 }} />
    <View style={skeletonStyles.orderCardBottom}>
      <Skeleton width="30%" height={11} />
      <Skeleton width="20%" height={16} />
    </View>
  </View>
);

export const BrandCardSkeleton: React.FC = () => (
  <View style={skeletonStyles.brandCard}>
    <Skeleton width={80} height={80} />
    <Skeleton width={60} height={11} style={{ marginTop: 8, alignSelf: "center" }} />
  </View>
);

export const FeedPostSkeleton: React.FC = () => {
  const colors = useThemeColors();
  return (
    <View style={[skeletonStyles.feedPost, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <View style={skeletonStyles.feedPostHeader}>
        <Skeleton width={36} height={36} style={{ borderRadius: 18 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <Skeleton width="40%" height={12} />
          <Skeleton width="25%" height={10} />
        </View>
      </View>
      <Skeleton width="100%" height={240} />
    </View>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <View style={skeletonStyles.productGrid}>
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </View>
);

export const OrderListSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <View style={{ gap: 12, padding: 16 }}>
    {Array.from({ length: count }).map((_, i) => (
      <OrderCardSkeleton key={i} />
    ))}
  </View>
);

const skeletonStyles = StyleSheet.create({
  productCard: {
    width: "50%",
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
  },
  orderCard: {
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  orderCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 8,
  },
  brandCard: {
    width: 100,
    alignItems: "center",
    marginRight: 16,
  },
  feedPost: {
    borderBottomWidth: 1,
    overflow: "hidden",
  },
  feedPostHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
  },
});
