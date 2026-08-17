import React, { useRef, useState } from "react";
import { Animated, Image, StyleSheet, View, ImageResizeMode } from "react-native";

function lqipUrl(uri: string): string {
  if (!uri?.includes("cloudinary")) return uri;
  return uri.replace("/upload/", "/upload/w_30,e_blur:1000,q_5/");
}

interface Props {
  uri: string;
  style?: any;
  resizeMode?: ImageResizeMode;
  blurRadius?: number;
}

const ProgressiveImage: React.FC<Props> = ({
  uri,
  style,
  resizeMode = "cover",
  blurRadius = 3,
}) => {
  const fullOpacity = useRef(new Animated.Value(0)).current;
  const [thumbError, setThumbError] = useState(false);

  const onFullLoad = () => {
    Animated.timing(fullOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.container, style]}>
      {!thumbError && (
        <Image
          source={{ uri: lqipUrl(uri) }}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          blurRadius={blurRadius}
          onError={() => setThumbError(true)}
        />
      )}
      <Animated.Image
        source={{ uri }}
        style={[StyleSheet.absoluteFill, { opacity: fullOpacity }]}
        resizeMode={resizeMode}
        onLoad={onFullLoad}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#111",
  },
});

export default ProgressiveImage;
