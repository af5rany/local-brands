import React, { useRef, useState } from "react";
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { getCloudinaryVariant } from "@/hooks/useCloudinaryUpload";

const { width: W } = Dimensions.get("window");

interface Props {
  videoUrl?: string | null;
  images?: string[];
  width?: number;
  height?: number;
  resizeMode?: "cover" | "contain";
}

const PostMedia: React.FC<Props> = ({
  videoUrl,
  images,
  width = W,
  height = W,
  resizeMode = "cover",
}) => {
  const [muted, setMuted] = useState(true);

  const player = useVideoPlayer(videoUrl ?? null, (p) => {
    p.loop = true;
    p.muted = true;
    if (videoUrl) p.play();
  });

  if (videoUrl) {
    return (
      <View style={[styles.container, { width, height }]}>
        <VideoView
          player={player}
          style={{ width, height }}
          contentFit={resizeMode}
          nativeControls={false}
        />
        <TouchableOpacity
          style={styles.muteBtn}
          onPress={() => {
            setMuted((prev) => {
              player.muted = !prev;
              return !prev;
            });
          }}
          hitSlop={12}
        >
          <Ionicons
            name={muted ? "volume-mute" : "volume-medium"}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    );
  }

  const firstImage = images?.[0];
  if (!firstImage) return <View style={[styles.container, { width, height }]} />;

  return (
    <Image
      source={{ uri: getCloudinaryVariant(firstImage, "c_fill,g_auto,w_800,ar_1:1") }}
      style={{ width, height }}
      resizeMode={resizeMode}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#000",
  },
  muteBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    padding: 6,
  },
});

export default PostMedia;
