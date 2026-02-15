import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReviewDriverScreen = ({ navigation }: any) => {
  const [rating, setRating] = useState(0);
  const [reviews] = useState([
    { id: 1, month: 'January 2026', rating: 5, comment: 'Excellent service! Always on time.', parent: 'Mrs. M' },
    { id: 2, month: 'December 2025', rating: 4, comment: 'Good driver, minor delays sometimes.', parent: 'Mr. K' },
  ]);

  const submitReview = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }
    Alert.alert('Thank You!', 'Your review has been submitted successfully.');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⭐ Monthly Review</Text>
        <Text style={styles.headerSubtext}>Rate your driver for this month</Text>
      </View>

      <View style={styles.driverCard}>
        <View style={styles.driverAvatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.driverName}>Mr. John Molaba</Text>
        <Text style={styles.driverSchool}>Mamelodi High Route</Text>
      </View>

      <View style={styles.ratingSection}>
        <Text style={styles.ratingTitle}>How was the service?</Text>
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
        <Text style={styles.ratingText}>
          {rating === 0 ? 'Tap to rate' : rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent!'}
        </Text>
      </View>

      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackTitle}>Additional Comments</Text>
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackPlaceholder}>Share your experience (optional)...</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={submitReview}>
        <Text style={styles.submitBtnText}>Submit Review</Text>
      </TouchableOpacity>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Past Reviews</Text>
        {reviews.map((review) => (
          <View key={review.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyMonth}>{review.month}</Text>
              <View style={styles.historyStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons key={star} name={star <= review.rating ? 'star' : 'star-outline'} size={14} color="#FFB81C" />
                ))}
              </View>
            </View>
            <Text style={styles.historyComment}>{review.comment}</Text>
            <Text style={styles.historyParent}>- {review.parent}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  driverCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 10, alignItems: 'center', elevation: 2 },
  driverAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#002395', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  driverName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  driverSchool: { fontSize: 14, color: '#666', marginTop: 5 },
  ratingSection: { backgroundColor: '#fff', margin: 15, marginTop: 0, padding: 20, borderRadius: 10, alignItems: 'center', elevation: 2 },
  ratingTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  stars: { flexDirection: 'row' },
  ratingText: { marginTop: 10, fontSize: 14, color: '#666' },
  feedbackSection: { padding: 15 },
  feedbackTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  feedbackCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, height: 100, justifyContent: 'center' },
  feedbackPlaceholder: { color: '#999' },
  submitBtn: { backgroundColor: '#007749', margin: 15, padding: 15, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  historySection: { padding: 15 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  historyCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, elevation: 2 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyMonth: { fontSize: 14, fontWeight: 'bold', color: '#002395' },
  historyStars: { flexDirection: 'row' },
  historyComment: { fontSize: 14, color: '#333', marginTop: 8 },
  historyParent: { fontSize: 12, color: '#666', marginTop: 5, fontStyle: 'italic' },
});

export default ReviewDriverScreen;
