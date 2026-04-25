// HeroPressable.tsx
import React, { useRef, useEffect } from "react";
import { Animated, TouchableWithoutFeedback, Easing, View } from "react-native";
import { SvgProps } from "react-native-svg";

interface Props {
    SvgComponent: React.FC<SvgProps>;
    style?: any;
    onPress?: () => void;
    entryDirection?: "left" | "right" | "none";
    entryDelay?: number;
    scrollY?: Animated.Value;
    parallaxFactor?: number;
}

export default function HeroPressable({
    SvgComponent,
    style,
    onPress,
    entryDirection = "none",
    entryDelay = 0,
    scrollY,
    parallaxFactor = 0.15,
}: Props) {
    const pressScale = useRef(new Animated.Value(1)).current;
    const breathScale = useRef(new Animated.Value(1)).current;
    const slideX = useRef(
        new Animated.Value(entryDirection === "left" ? -50 : entryDirection === "right" ? 50 : 0)
    ).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const ringScale = useRef(new Animated.Value(0.3)).current;
    const ringOpacity = useRef(new Animated.Value(0)).current;
    const fallbackScroll = useRef(new Animated.Value(0)).current;
    const effectiveScrollY = scrollY ?? fallbackScroll;

    useEffect(() => {
        const startBreathing = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(breathScale, {
                        toValue: 1.02,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(breathScale, {
                        toValue: 1,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        const startGlow = () => {
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
        };

        const fireRing = () => {
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
        };

        const startAll = () => {
            startBreathing();
            startGlow();
            setTimeout(fireRing, 400);
        };

        if (entryDirection !== "none") {
            const timeout = setTimeout(() => {
                Animated.timing(slideX, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }).start(() => startAll());
            }, entryDelay);
            return () => clearTimeout(timeout);
        } else {
            startAll();
        }
    }, []);

    const onPressIn = () => {
        Animated.spring(pressScale, {
            toValue: 1.05,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(pressScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start();
    };

    const combinedScale = Animated.multiply(pressScale, breathScale);

    const parallaxY = effectiveScrollY.interpolate({
        inputRange: [0, 600],
        outputRange: [0, 600 * parallaxFactor],
        extrapolate: "clamp",
    });

    return (
        <TouchableWithoutFeedback
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
        >
            <Animated.View
                style={[
                    style,
                    {
                        transform: [
                            { translateX: slideX },
                            { translateY: parallaxY },
                        ],
                    },
                ]}
            >
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

                {/* Tap indicator ring — one-shot on mount */}
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
                            borderColor: "#000000",
                            opacity: ringOpacity,
                            transform: [{ scale: ringScale }],
                        }}
                    />
                </View>

                {/* Figure SVG — shadow applied directly to figure bounds */}
                <Animated.View
                    style={[
                        { width: "100%", height: "100%" },
                        { transform: [{ scale: combinedScale }] },
                        {
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: 0.32,
                            shadowRadius: 5,
                        },
                    ]}
                >
                    <SvgComponent width="100%" height="100%" />
                </Animated.View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
}
