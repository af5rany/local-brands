import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import getApiUrl from "@/helpers/getApiUrl";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dg4l2eelg/image/upload";
const UPLOAD_PRESET = "UnsignedPreset";

interface TryOnModalProps {
  visible: boolean;
  garmentImageUrl: string;
  onClose: () => void;
}

type Stage = "pick" | "uploading" | "processing" | "result";

export default function TryOnModal({
  visible,
  garmentImageUrl,
  onClose,
}: TryOnModalProps) {
  const [stage, setStage] = useState<Stage>("pick");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [personUri, setPersonUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadToCloudinary = async (uri: string): Promise<string> => {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1000 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
    const filename = compressed.uri.split("/").pop() || "person.jpg";
    const formData = new FormData();
    formData.append("file", { uri: compressed.uri, name: filename, type: "image/jpeg" } as any);
    formData.append("upload_preset", UPLOAD_PRESET);
    const res = await axios.post(CLOUDINARY_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.secure_url;
  };

  const runTryOn = async (uri: string) => {
    setPersonUri(uri);
    setError(null);
    setStage("uploading");

    let personImageUrl: string;
    try {
      personImageUrl = await uploadToCloudinary(uri);
    } catch (e: any) {
      setError("Failed to upload photo. Try again.");
      setStage("pick");
      return;
    }

    setStage("processing");
    try {
      const res = await fetch(`${getApiUrl()}/try-on`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImageUrl,
          garmentImageUrl,
          clothType: "upper",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Try-on failed");
      }
      const data = await res.json();
      setResultUrl(data.resultUrl);
      setStage("result");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setStage("pick");
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { setError("Camera permission denied"); return; }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      await runTryOn(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { setError("Gallery permission denied"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      await runTryOn(result.assets[0].uri);
    }
  };

  const handleRetry = () => {
    setResultUrl(null);
    setPersonUri(null);
    setError(null);
    setStage("pick");
  };

  const handleClose = () => {
    handleRetry();
    onClose();
  };

  const isLoading = stage === "uploading" || stage === "processing";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} hitSlop={12} disabled={isLoading}>
            <Ionicons name="close" size={24} color={isLoading ? "#555" : "#fff"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>TRY ON</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Pick stage */}
        {stage === "pick" && (
          <View style={styles.center}>
            <Image
              source={{ uri: garmentImageUrl }}
              style={styles.garmentPreview}
              resizeMode="cover"
            />
            <Text style={styles.garmentLabel}>GARMENT</Text>
            <View style={styles.divider} />
            <Text style={styles.instructionText}>
              Add a photo of yourself to see how this looks on you
            </Text>

            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCamera}>
              <Ionicons name="camera-outline" size={18} color="#000" />
              <Text style={styles.primaryBtnText}>TAKE A PHOTO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleGallery}>
              <Ionicons name="image-outline" size={18} color="#fff" />
              <Text style={styles.secondaryBtnText}>CHOOSE FROM GALLERY</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Uploading / Processing stage */}
        {isLoading && (
          <View style={styles.center}>
            {personUri && (
              <Image source={{ uri: personUri }} style={styles.personPreview} resizeMode="cover" />
            )}
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 24 }} />
            <Text style={styles.processingText}>
              {stage === "uploading" ? "UPLOADING" : "GENERATING"}
            </Text>
            <Text style={styles.processingSubtext}>
              {stage === "uploading" ? "Preparing your photo…" : "AI is styling you · ~5 seconds"}
            </Text>
          </View>
        )}

        {/* Result stage */}
        {stage === "result" && resultUrl && (
          <>
            <Image source={{ uri: resultUrl }} style={styles.resultImage} resizeMode="contain" />
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                <Ionicons name="refresh" size={16} color="#000" />
                <Text style={styles.retryBtnText}>TRY AGAIN</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  garmentPreview: { width: 120, height: 150, backgroundColor: "#111" },
  garmentLabel: { color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 2 },
  divider: { width: 40, height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 4 },
  instructionText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  errorBanner: { backgroundColor: "rgba(196,30,58,0.9)", paddingHorizontal: 16, paddingVertical: 10, width: "100%" },
  errorText: { color: "#fff", fontSize: 12, textAlign: "center" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 28,
    paddingVertical: 14,
    width: "100%",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#000", fontSize: 12, fontWeight: "700", letterSpacing: 2 },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    paddingHorizontal: 28,
    paddingVertical: 14,
    width: "100%",
    justifyContent: "center",
  },
  secondaryBtnText: { color: "#fff", fontSize: 12, fontWeight: "600", letterSpacing: 2 },
  personPreview: { width: 120, height: 150, backgroundColor: "#111" },
  processingText: { color: "#fff", fontSize: 14, letterSpacing: 3, fontWeight: "700" },
  processingSubtext: { color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: 0.5 },
  resultImage: { flex: 1, width: "100%" },
  resultActions: { padding: 24, alignItems: "center" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryBtnText: { color: "#000", fontSize: 12, fontWeight: "700", letterSpacing: 2 },
});
