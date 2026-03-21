import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  ViewToken,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";

interface AutoSwipeImagesProps {
  images: string[];
  width: number;
  height: number;
  borderRadius?: number;
}

const AutoSwipeImages: React.FC<AutoSwipeImagesProps> = ({
  images,
  width,
  height,
  borderRadius = 0,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const secondaryTextColor = useThemeColor(
    { light: "#666666", dark: "#999999" },
    "textTertiary",
  );
  const imageBackgroundColor = useThemeColor(
    { light: "#f8f8f8", dark: "#2c2c2e" },
    "background",
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        const newIndex = viewableItems[0].index;
        activeIndexRef.current = newIndex;
        setActiveIndex(newIndex);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      const currentIndex = activeIndexRef.current;
      const nextIndex =
        currentIndex >= images.length - 1 ? 0 : currentIndex + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <View
        style={[
          styles.placeholder,
          {
            width,
            height,
            borderRadius,
            backgroundColor: imageBackgroundColor,
          },
        ]}
      >
        <Ionicons name="image-outline" size={40} color={secondaryTextColor} />
      </View>
    );
  }

  return (
    <View style={{ width, height, borderRadius, overflow: "hidden" }}>
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item }}
            style={{ width, height, borderRadius }}
            resizeMode="cover"
          />
        )}
      />
      {images.length > 1 && (
        <View style={styles.dotContainer}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  dotContainer: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  dotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
});

export default AutoSwipeImages;
