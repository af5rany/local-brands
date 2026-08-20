import React, { useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "@/hooks/useThemeColor";
import { getCloudinaryVariant } from "@/hooks/useCloudinaryUpload";

const { width: W, height: H } = Dimensions.get("window");

interface Props {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

const ZoomableImage: React.FC<{ uri: string }> = ({ uri }) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      focalX.value = e.focalX - W / 2;
      focalY.value = e.focalY - H / 2;
    })
    .onUpdate((e) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
      scale.value = next;
      const scaleDelta = next - savedScale.value;
      translateX.value = savedTranslateX.value - focalX.value * scaleDelta;
      translateY.value = savedTranslateY.value - focalY.value * scaleDelta;
    })
    .onEnd(() => {
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = MIN_SCALE;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = scale.value;
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      }
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart((e) => {
      if (scale.value > MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = MIN_SCALE;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        const targetScale = 2.5;
        const fx = e.x - W / 2;
        const fy = e.y - H / 2;
        const tx = -fx * (targetScale - 1);
        const ty = -fy * (targetScale - 1);
        scale.value = withTiming(targetScale);
        translateX.value = withTiming(tx);
        translateY.value = withTiming(ty);
        savedScale.value = targetScale;
        savedTranslateX.value = tx;
        savedTranslateY.value = ty;
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan);
  const all = Gesture.Exclusive(doubleTap, composed);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={all}>
      <Animated.View style={[styles.imageWrapper, animStyle]}>
        <Image
          source={{ uri: getCloudinaryVariant(uri, "c_fit,w_1200") }}
          style={styles.zoomImage}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
};

const ImageZoomModal: React.FC<Props> = ({ visible, images, initialIndex = 0, onClose }) => {
  const colors = useThemeColors();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={[styles.backdrop, { backgroundColor: "#000" }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={16}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <ZoomableImage uri={images[initialIndex] ?? ""} />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  imageWrapper: {
    width: W,
    height: H,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomImage: {
    width: W,
    height: H,
  },
});

export default ImageZoomModal;
