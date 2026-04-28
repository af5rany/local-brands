import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColors } from "@/hooks/useThemeColor";
import type { ThemeColors } from "@/constants/Colors";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Review {
  id: number;
  rating: number;
  comment: string;
  images: string[];
  user: {
    name: string;
  };
  createdAt: string;
  isVerifiedPurchase: boolean;
}

interface ProductReviewsProps {
  productId: number;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { token, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState("");

  const { pickAndUpload, isUploading } = useCloudinaryUpload();

  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    fetchReviews();
    if (token) checkCanReview();
  }, [productId, token]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `${getApiUrl()}/reviews/product/${productId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setReviews(data.data || data);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const response = await fetch(
        `${getApiUrl()}/reviews/can-review/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setCanReview(data.canReview);
      }
    } catch (error) {
      console.error("Error checking review status:", error);
    }
  };

  const handlePickImage = async () => {
    if (selectedImages.length >= 5) {
      Alert.alert("Limit reached", "You can add up to 5 images.");
      return;
    }
    try {
      const results = await pickAndUpload({
        allowsEditing: false,
        quality: 0.8,
      });
      if (results) {
        const urls = results.filter((url): url is string => url !== null);
        setSelectedImages((prev) => [...prev, ...urls].slice(0, 5));
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to upload image.");
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating.");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Error", "Please provide a comment.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${getApiUrl()}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          rating,
          comment,
          images: selectedImages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }

      Alert.alert(
        "Success",
        "Your review has been submitted and is pending approval.",
      );
      setRating(0);
      setComment("");
      setSelectedImages([]);
      setCanReview(false);
      fetchReviews();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openViewer = (imageUrl: string) => {
    setViewerImage(imageUrl);
    setViewerVisible(true);
  };

  const renderStars = (count: number, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => interactive && setRating(i)}
          disabled={!interactive}
        >
          <Ionicons
            name={i <= (interactive ? rating : count) ? "star" : "star-outline"}
            size={interactive ? 32 : 14}
            color={colors.text}
          />
        </TouchableOpacity>,
      );
    }
    return stars;
  };

  const renderReviewImages = (images: string[]) => {
    if (!images || images.length === 0) return null;
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.reviewImagesRow}
      >
        {images.map((img, index) => (
          <TouchableOpacity key={index} onPress={() => openViewer(img)}>
            <Image source={{ uri: img }} style={styles.reviewThumbnail} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View
      style={[
        styles.reviewItem,
        { borderBottomColor: colors.borderLight },
      ]}
    >
      <View style={styles.reviewHeader}>
        <Text style={[styles.userName, { color: colors.text }]}>
          {item.user.name}
        </Text>
        <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.starsRow}>
        {renderStars(item.rating)}
        {item.isVerifiedPurchase && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={colors.text} />
            <Text style={styles.verifiedText}>Verified Purchase</Text>
          </View>
        )}
      </View>
      <Text style={[styles.comment, { color: colors.text }]}>{item.comment}</Text>
      {renderReviewImages(item.images)}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        CUSTOMER REVIEWS ({reviews.length})
      </Text>

      {canReview && (
        <View style={[styles.box, { backgroundColor: colors.surface }]}>
          <Text style={[styles.boxTitle, { color: colors.text }]}>
            WRITE A REVIEW
          </Text>
          <View style={styles.ratingRow}>{renderStars(0, true)}</View>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border },
            ]}
            placeholder="Share your thoughts on this acquisition..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />

          {/* Image upload section */}
          <View style={styles.imageSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagePickerRow}
            >
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.selectedImageWrapper}>
                  <Image source={{ uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close" size={14} color={colors.textInverse} />
                  </TouchableOpacity>
                </View>
              ))}
              {selectedImages.length < 5 && (
                <TouchableOpacity
                  style={[
                    styles.addImageBtn,
                    { borderColor: colors.border },
                  ]}
                  onPress={handlePickImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <>
                      <Ionicons
                        name="camera-outline"
                        size={22}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[styles.addImageText, { color: colors.textSecondary }]}
                      >
                        ADD PHOTO
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>
            <Text style={[styles.imageHint, { color: colors.textSecondary }]}>
              {selectedImages.length}/5 photos
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmitReview}
            disabled={submitting || isUploading}
          >
            {submitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.submitBtnText, { color: colors.primaryForeground }]}>
                SUBMIT REVIEW
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : reviews.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No reviews yet for this product.
        </Text>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      )}

      {/* Fullscreen Image Viewer */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.viewerOverlay}>
          <TouchableOpacity
            style={styles.viewerCloseBtn}
            onPress={() => setViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color={colors.textInverse} />
          </TouchableOpacity>
          <Image
            source={{ uri: viewerImage }}
            style={styles.viewerImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 12,
    fontWeight: "800",
    // letterSpacing: 2,
    marginBottom: 20,
  },
  reviewItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
  },
  reviewDate: {
    fontSize: 12,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 12,
    backgroundColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 0,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.text,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
  },
  reviewImagesRow: {
    marginTop: 12,
  },
  reviewThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 0,
    marginRight: 8,
    backgroundColor: colors.surfaceRaised,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
  box: {
    padding: 20,
    borderRadius: 0,
    marginBottom: 32,
  },
  boxTitle: {
    fontSize: 11,
    fontWeight: "700",
    // letterSpacing: 1,
    marginBottom: 16,
    textAlign: "center",
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 0,
    fontSize: 14,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  imageSection: {
    marginBottom: 20,
  },
  imagePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedImageWrapper: {
    position: "relative",
  },
  selectedImage: {
    width: 72,
    height: 72,
    borderRadius: 0,
    backgroundColor: colors.surfaceRaised,
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 0,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addImageBtn: {
    width: 72,
    height: 72,
    borderRadius: 0,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  addImageText: {
    fontSize: 8,
    fontWeight: "700",
    // letterSpacing: 0.5,
  },
  imageHint: {
    fontSize: 10,
    marginTop: 8,
    // letterSpacing: 0.5,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 0,
    alignItems: "center",
  },
  submitBtnText: {
    fontSize: 11,
    fontWeight: "800",
    // letterSpacing: 1.5,
  },
  viewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerCloseBtn: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
});

export default ProductReviews;
