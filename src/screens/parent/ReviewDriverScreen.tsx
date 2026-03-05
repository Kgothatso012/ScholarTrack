import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';

interface Review {
  id: string;
  rating: number;
  comment: string;
  month: string;
  created_at: string;
}

const ReviewDriverScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  // For now, show empty reviews as this would need a backend table
  useEffect(() => {
    // Reviews would be fetched from API here
    setReviews([]);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh reviews
    setRefreshing(false);
  };

  const submitReview = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }
    Alert.alert('Thank You!', 'Your review has been submitted successfully.');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Monthly Review</Text>
        <Text style={[styles.headerSubtext, { color: colors.accent }]}>Rate your driver for this month</Text>
      </View>

      <View style={[styles.driverCard, { backgroundColor: colors.card }]}>
        <View style={[styles.driverAvatar, { backgroundColor: colors.primary }]}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={[styles.driverName, { color: colors.text }]}>Your Driver</Text>
        <Text style={[styles.driverSchool, { color: colors.textSecondary }]}>
          Rate your driver after each month of service
        </Text>
      </View>

      <View style={[styles.ratingSection, { backgroundColor: colors.card }]}>
        <Text style={[styles.ratingTitle, { color: colors.text }]}>How was the service?</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={40}
                color="#FFB81C"
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
          {rating === 0 ? 'Tap to rate' : rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent!'}
        </Text>
      </View>

      <View style={styles.feedbackSection}>
        <Text style={[styles.feedbackTitle, { color: colors.text }]}>Additional Comments</Text>
        <View style={[styles.feedbackCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.feedbackPlaceholder, { color: colors.textSecondary }]}>
            Share your experience (optional)...
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={submitReview}>
        <Text style={styles.submitBtnText}>Submit Review</Text>
      </TouchableOpacity>

      <View style={styles.historySection}>
        <Text style={[styles.historyTitle, { color: colors.text }]}>Past Reviews</Text>

        {reviews.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="star-outline" size={50} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Reviews Yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Your review history will appear here after you submit reviews.
            </Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={[styles.historyCard, { backgroundColor: colors.card }]}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyMonth}>{review.month}</Text>
                <View style={styles.historyStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={14} color="#FFB81C" />
                  ))}
                </View>
              </View>
              <Text style={[styles.historyComment, { color: colors.text }]}>{review.comment}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  driverCard: { margin: 15, padding: 20, borderRadius: 10, alignItems: 'center', elevation: 2 },
  driverAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  driverName: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  driverSchool: { fontSize: 14, color: '#888888', marginTop: 5 },
  ratingSection: { margin: 15, marginTop: 0, padding: 20, borderRadius: 10, alignItems: 'center', elevation: 2 },
  ratingTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 15 },
  stars: { flexDirection: 'row' },
  ratingText: { marginTop: 10, fontSize: 14, color: '#888888' },
  feedbackSection: { padding: 15 },
  feedbackTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginBottom: 10 },
  feedbackCard: { borderRadius: 10, padding: 15, height: 100, justifyContent: 'center' },
  feedbackPlaceholder: { color: '#999' },
  submitBtn: { backgroundColor: '#007749', margin: 15, padding: 15, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  historySection: { padding: 15 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 15 },
  historyCard: { borderRadius: 10, padding: 15, marginBottom: 10, elevation: 2 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyMonth: { fontSize: 14, fontWeight: 'bold', color: '#FFB81C' },
  historyStars: { flexDirection: 'row' },
  historyComment: { fontSize: 14, color: '#ffffff', marginTop: 8 },
  emptyContainer: { borderRadius: 10, padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff', marginTop: 10, marginBottom: 5 },
  emptyText: { fontSize: 13, color: '#888888', textAlign: 'center' },
});

export default ReviewDriverScreen;
