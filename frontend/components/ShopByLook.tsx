import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";

const FIGURE_HER = require("@/assets/images/figure-her.png");
const FIGURE_HIM = require("@/assets/images/figure-his.png");

interface FigureProps {
  source: any;
  label: string;
  gender: string;
  breathScale: Animated.Value;
  entryDirection: "left" | "right";
  entryDelay?: number;
  ringDelay?: number;
  triggered: boolean;
}

const Figure: React.FC<FigureProps> = ({
  source,
  label,
  gender,
  breathScale,
  entryDirection,
  entryDelay = 0,
  ringDelay = 0,
  triggered,
}) => {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const slideX = useRef(new Animated.Value(entryDirection === "left" ? -60 : 60)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.3)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Glow pulse loop — always running
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.4,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!triggered || hasAnimated.current) return;
    hasAnimated.current = true;

    // Entry slide
    const entryTimer = setTimeout(() => {
      Animated.timing(slideX, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, entryDelay);

    // One-shot tap ring after slide
    const ringTimer = setTimeout(() => {
      ringScale.setValue(0.3);
      ringOpacity.setValue(0.9);
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.8,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]).start();
    }, ringDelay);

    return () => {
      clearTimeout(entryTimer);
      clearTimeout(ringTimer);
    };
  }, [triggered]);

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(pressScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      style={styles.figureWrap}
      onPress={() => router.push(`/(tabs)/shop?gender=${gender}` as any)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <Text style={styles.figureLabel}>{label}</Text>

        <Animated.View style={{ transform: [{ translateX: slideX }] }}>
          <View style={styles.figureImageWrap}>
            <Animated.Image
              source={source}
              style={[styles.figureImage, { transform: [{ scale: breathScale }] }]}
              resizeMode="contain"
            />

            {/* Ground shadow */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                bottom: -36,
                left: "10%",
                right: "10%",
                height: 14,
                borderRadius: 7,
                backgroundColor: "rgba(0,0,0,0.1)",
                opacity: glowOpacity.interpolate({
                  inputRange: [0, 0.4],
                  outputRange: [0.5, 0.9],
                }),
              }}
            />

            {/* Tap indicator ring */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 24,
                alignItems: "center",
              }}
            >
              <Animated.View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1.5,
                  borderColor: colors.text,
                  opacity: ringOpacity,
                  transform: [{ scale: ringScale }],
                }}
              />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

interface ShopByLookProps {
  scrollY?: Animated.Value;
}

const ShopByLook: React.FC<ShopByLookProps> = ({ scrollY }) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const breathHer = useRef(new Animated.Value(1)).current;
  const breathHim = useRef(new Animated.Value(1)).current;
  const [triggered, setTriggered] = useState(false);
  const containerY = useRef<number | null>(null);
  const wrapRef = useRef<View>(null);

  useEffect(() => {
    const makeBreath = (val: Animated.Value) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1.012,
            duration: 1700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 1,
            duration: 1700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    makeBreath(breathHer).start();
    const t = setTimeout(() => makeBreath(breathHim).start(), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!scrollY) {
      setTriggered(true);
      return;
    }
    const id = scrollY.addListener(({ value }) => {
      if (triggered) return;
      if (containerY.current === null) return;
      const windowHeight = 700;
      if (value + windowHeight > containerY.current) {
        setTriggered(true);
        scrollY.removeListener(id);
      }
    });
    return () => scrollY.removeListener(id);
  }, [triggered]);

  const onLayout = () => {
    wrapRef.current?.measureInWindow((_x, y) => {
      containerY.current = y;
    });
  };

  return (
    <View
      ref={wrapRef}
      onLayout={onLayout}
      style={styles.shopByLook}
    >
      <Figure
        source={FIGURE_HER}
        label={"SHOP HER\nLOOK"}
        gender="Women"
        breathScale={breathHer}
        entryDirection="left"
        entryDelay={0}
        ringDelay={600}
        triggered={triggered}
      />
      <Figure
        source={FIGURE_HIM}
        label={"SHOP HIS\nLOOK"}
        gender="Men"
        breathScale={breathHim}
        entryDirection="right"
        entryDelay={200}
        ringDelay={1000}
        triggered={triggered}
      />
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  shopByLook: {
    // keep these styles - dont change them
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 70,
    paddingHorizontal: 16,
    flexDirection: "row",
    // borderBottomWidth: 1,
    // borderBottomColor: colors.borderLight,
  },
  figureWrap: {
    flex: 1,
    alignItems: "center",
  },
  figureLabel: {
    fontFamily: undefined,
    fontSize: 11,
    fontWeight: "500",
    color: "#333",
    letterSpacing: 3,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 14,
  },
  figureImageWrap: {
    position: "relative",
  },
  figureImage: {
    width: 124,
    height: 300,
  },
});

export default ShopByLook;
