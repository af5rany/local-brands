import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
  const scrollRef = useRef<ScrollView>(null);
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

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width === 0) return;
      const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
      if (newIndex !== activeIndexRef.current) {
        activeIndexRef.current = newIndex;
        setActiveIndex(newIndex);
      }
    },
    [width],
  );

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const interval = setInterval(() => {
      const currentIndex = activeIndexRef.current;
      const nextIndex =
        currentIndex >= images.length - 1 ? 0 : currentIndex + 1;

      scrollRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [images, width]);

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

  if (images.length === 1) {
    return (
      <Image
        source={{ uri: images[0] }}
        style={{ width, height, borderRadius }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={{ width, height, borderRadius, overflow: "hidden" }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {images.map((uri, index) => (
          <Image
            key={index}
            source={{ uri }}
            style={{ width, height, borderRadius }}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
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
    borderRadius: 0,
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 8,
    height: 8,
    borderRadius: 0,
  },
  dotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
});

export default AutoSwipeImages;
