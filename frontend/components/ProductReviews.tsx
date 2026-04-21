import React, { useState, useEffect } from "react";
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
import { useThemeColor } from "@/hooks/useThemeColor";
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

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const secondaryTextColor = useThemeColor(
    { light: "#737373", dark: "#A3A3A3" },
    "text",
  );
  const cardBackground = useThemeColor(
    { light: "#FAFAFA", dark: "#1C1C1E" },
    "background",
  );

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
            color="#000000"
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
        { borderBottomColor: secondaryTextColor + "20" },
      ]}
    >
      <View style={styles.reviewHeader}>
        <Text style={[styles.userName, { color: textColor }]}>
          {item.user.name}
        </Text>
        <Text style={[styles.reviewDate, { color: secondaryTextColor }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.starsRow}>
        {renderStars(item.rating)}
        {item.isVerifiedPurchase && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#000000" />
            <Text style={styles.verifiedText}>Verified Purchase</Text>
          </View>
        )}
      </View>
      <Text style={[styles.comment, { color: textColor }]}>{item.comment}</Text>
      {renderReviewImages(item.images)}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>
        CUSTOMER REVIEWS ({reviews.length})
      </Text>

      {canReview && (
        <View style={[styles.box, { backgroundColor: cardBackground }]}>
          <Text style={[styles.boxTitle, { color: textColor }]}>
            WRITE A REVIEW
          </Text>
          <View style={styles.ratingRow}>{renderStars(0, true)}</View>
          <TextInput
            style={[
              styles.input,
              { color: textColor, borderColor: secondaryTextColor + "40" },
            ]}
            placeholder="Share your thoughts on this acquisition..."
            placeholderTextColor={secondaryTextColor}
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
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              {selectedImages.length < 5 && (
                <TouchableOpacity
                  style={[
                    styles.addImageBtn,
                    { borderColor: secondaryTextColor + "40" },
                  ]}
                  onPress={handlePickImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={textColor} />
                  ) : (
                    <>
                      <Ionicons
                        name="camera-outline"
                        size={22}
                        color={secondaryTextColor}
                      />
                      <Text
                        style={[styles.addImageText, { color: secondaryTextColor }]}
                      >
                        ADD PHOTO
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </ScrollView>
            <Text style={[styles.imageHint, { color: secondaryTextColor }]}>
              {selectedImages.length}/5 photos
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: textColor }]}
            onPress={handleSubmitReview}
            disabled={submitting || isUploading}
          >
            {submitting ? (
              <ActivityIndicator color={backgroundColor} />
            ) : (
              <Text style={[styles.submitBtnText, { color: backgroundColor }]}>
                SUBMIT REVIEW
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : reviews.length === 0 ? (
        <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
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
            <Ionicons name="close" size={28} color="#FFFFFF" />
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

const styles = StyleSheet.create({
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
    backgroundColor: "#E5E5E5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 0,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000000",
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
    backgroundColor: "#F5F5F5",
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
    backgroundColor: "#F5F5F5",
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 0,
    backgroundColor: "#000000",
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
