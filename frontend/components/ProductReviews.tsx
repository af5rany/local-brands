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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import getApiUrl from "@/helpers/getApiUrl";
import { useThemeColor } from "@/hooks/useThemeColor";

interface Review {
  id: number;
  rating: number;
  comment: string;
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

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const secondaryTextColor = useThemeColor(
    { light: "#737373", dark: "#A3A3A3" },
    "text",
  );
  const accentColor = useThemeColor(
    { light: "#DC2626", dark: "#EF4444" },
    "tint",
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
      setCanReview(false);
      fetchReviews();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
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
            color="#F59E0B"
          />
        </TouchableOpacity>,
      );
    }
    return stars;
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
            <Ionicons name="checkmark-circle" size={12} color="#10B981" />
            <Text style={styles.verifiedText}>Verified Purchase</Text>
          </View>
        )}
      </View>
      <Text style={[styles.comment, { color: textColor }]}>{item.comment}</Text>
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
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: textColor }]}
            onPress={handleSubmitReview}
            disabled={submitting}
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
    letterSpacing: 2,
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
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
  },
  box: {
    padding: 20,
    borderRadius: 2,
    marginBottom: 32,
  },
  boxTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
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
    borderRadius: 2,
    fontSize: 14,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 2,
    alignItems: "center",
  },
  submitBtnText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
});

export default ProductReviews;
