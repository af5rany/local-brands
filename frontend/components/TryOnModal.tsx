import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Alert,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { File, Paths } from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import getApiUrl from "@/helpers/getApiUrl";
import { useAuth } from "@/context/AuthContext";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dg4l2eelg/image/upload";
const UPLOAD_PRESET = "UnsignedPreset";
const POLL_INTERVAL = 1500;

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
  const { token } = useAuth();
  const [stage, setStage] = useState<Stage>("pick");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [personUri, setPersonUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount or close
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  });

  const uploadToCloudinary = async (uri: string): Promise<string> => {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1000 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
    const filename = compressed.uri.split("/").pop() || "person.jpg";
    const formData = new FormData();
    formData.append("file", {
      uri: compressed.uri,
      name: filename,
      type: "image/jpeg",
    } as any);
    formData.append("upload_preset", UPLOAD_PRESET);
    const res = await axios.post(CLOUDINARY_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.secure_url;
  };

  const pollForResult = (jobId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${getApiUrl()}/try-on/${jobId}/status`, {
          headers: authHeaders(),
        });

        const data = await res.json();

        if (data.status === "completed" && data.resultUrl) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setResultUrl(data.resultUrl);
          setStage("result");
          return;
        }

        if (data.status === "failed") {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          setError(data.error || "Try-on failed");
          setStage("pick");
          return;
        }
      } catch {
        // Poll will retry on next interval
      }
    }, POLL_INTERVAL);
  };

  const runTryOn = async (uri: string) => {
    setPersonUri(uri);
    setError(null);
    setStage("uploading");

    let personImageUrl: string;
    try {
      personImageUrl = await uploadToCloudinary(uri);
    } catch {
      setError("Failed to upload photo. Try again.");
      setStage("pick");
      return;
    }

    setStage("processing");
    try {
      const res = await fetch(`${getApiUrl()}/try-on`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          personImageUrl,
          garmentImageUrl,
          category: "auto",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Try-on failed");
      }

      const data = await res.json();
      // Cache hit — instant result
      if (data.cached && data.resultUrl) {
        setResultUrl(data.resultUrl);
        setStage("result");
        return;
      }

      // Queued — start polling
      pollForResult(data.jobId);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
      setStage("pick");
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setError("Camera permission denied");
      return;
    }
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
    if (status !== "granted") {
      setError("Gallery permission denied");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled && result.assets[0]) {
      await runTryOn(result.assets[0].uri);
    }
  };

  const handleDownload = async () => {
    if (!resultUrl || saving) return;
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Allow access to save photos.");
        setSaving(false);
        return;
      }
      const destination = new File(Paths.cache, `tryon_${Date.now()}.jpg`);
      const downloaded = await File.downloadFileAsync(resultUrl, destination);
      await MediaLibrary.saveToLibraryAsync(downloaded.uri);
      Alert.alert("Saved", "Photo saved to your gallery.");
    } catch {
      Alert.alert("Error", "Failed to save photo.");
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
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
          <TouchableOpacity onPress={handleClose} disabled={isLoading}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>TRY ON</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 👕 ALWAYS SHOW GARMENT */}
        <View style={styles.garmentContainer}>
          <Image
            source={{ uri: garmentImageUrl }}
            style={styles.garmentPreview}
            resizeMode="cover"
          />
          <Text style={styles.garmentLabel}>GARMENT</Text>
        </View>

        {/* MAIN CONTENT */}
        <View style={styles.center}>
          {/* 🟢 PICK STAGE */}
          {stage === "pick" && (
            <>
              <Text style={styles.instructionText}>
                Add a photo of yourself to try it on
              </Text>

              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleCamera}
              >
                <Text style={styles.primaryBtnText}>TAKE A PHOTO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleGallery}
              >
                <Text style={styles.secondaryBtnText}>CHOOSE FROM GALLERY</Text>
              </TouchableOpacity>
            </>
          )}

          {/* 🟡 UPLOADING / PROCESSING */}
          {(stage === "uploading" || stage === "processing") && (
            <>
              {personUri && (
                <Image
                  source={{ uri: personUri }}
                  style={styles.personPreview}
                />
              )}

              <ActivityIndicator size="large" color="#fff" />

              <Text style={styles.processingText}>
                {stage === "uploading" ? "UPLOADING" : "GENERATING"}
              </Text>

              <Text style={styles.processingSubtext}>
                {stage === "uploading"
                  ? "Preparing your photo…"
                  : "AI is styling you · ~10 seconds"}
              </Text>
            </>
          )}

          {/* 🔵 RESULT STAGE */}
          {stage === "result" && resultUrl && (
            <>
              {/* BEFORE / AFTER */}
              <View style={styles.resultContainer}>
                <Image
                  source={{ uri: personUri! }}
                  style={styles.resultImageSmall}
                />
                <Image source={{ uri: resultUrl }} style={styles.resultImage} />
              </View>

              {/* ACTION BUTTONS */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setFullscreen(true)}
                >
                  <Ionicons name="expand-outline" size={20} color="#fff" />
                  <Text style={styles.iconBtnText}>FULL VIEW</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={handleDownload}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color="#fff"
                    />
                  )}
                  <Text style={styles.iconBtnText}>
                    {saving ? "SAVING" : "SAVE"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                <Text style={styles.retryBtnText}>TRY AGAIN</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>

      {/* FULLSCREEN OVERLAY */}
      <Modal
        visible={fullscreen}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreen(false)}
      >
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.fullscreenClose}
            onPress={() => setFullscreen(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {resultUrl && (
            <Image
              source={{ uri: resultUrl }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  headerTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  garmentPreview: { width: 120, height: 150, backgroundColor: "#111" },
  garmentLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    letterSpacing: 2,
  },
  instructionText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  errorBanner: {
    backgroundColor: "rgba(196,30,58,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: "100%",
  },
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
  primaryBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
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
  secondaryBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
  },
  personPreview: { width: 120, height: 150, backgroundColor: "#111" },
  processingText: {
    color: "#fff",
    fontSize: 14,
    letterSpacing: 3,
    fontWeight: "700",
  },
  processingSubtext: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  garmentContainer: {
    alignItems: "center",
    marginTop: 10,
  },

  resultContainer: {
    flexDirection: "row",
    gap: 10,
  },

  resultImageSmall: {
    width: 100,
    height: 140,
    borderRadius: 8,
  },

  resultImage: {
    width: 200,
    height: 280,
    borderRadius: 8,
  },

  actionRow: {
    flexDirection: "row",
    gap: 24,
  },

  iconBtn: {
    alignItems: "center",
    gap: 4,
  },

  iconBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1.5,
  },

  fullscreenOverlay: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  fullscreenClose: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },

  fullscreenImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.85,
  },
});
