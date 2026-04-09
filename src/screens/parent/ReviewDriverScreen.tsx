import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { ratingService } from '../../lib/services';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  month: string;
  created_at: string;
  driver_id?: string;
  status?: 'approved' | 'flagged';
}

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  vehicle_plate: string;
  monthly_rate: number;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ReviewDriverScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [currentMonth] = useState(MONTHS[new Date().getMonth()]);
  const [currentYear] = useState(new Date().getFullYear());
  const [canReview, setCanReview] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      // Get hired driver for this parent
      const { data: childData } = await supabase
        .from('children')
        .select('*, driver:drivers(*)')
        .eq('parent_id', userId)
        .limit(1)
        .single();

      if (childData?.driver) {
        setDriver(childData.driver);
      }

      // Get reviews using ratingService
      const reviewsData = await ratingService.getParentReviews(userId);
      setReviews(reviewsData || []);

      // Check if already reviewed this month
      const thisMonthReview = reviewsData.find(
        (r) => r.month === `${currentMonth} ${currentYear}`
      );
      setCanReview(!thisMonthReview);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting.');
      return;
    }

    if (!driver) {
      Alert.alert('No Driver', 'You need to hire a driver first before submitting a review.');
      return;
    }

    setLoading(true);

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('Not logged in');

      // Submit review using ratingService
      await ratingService.submitReview(
        userId,
        driver.id,
        rating,
        comment,
        `${currentMonth} ${currentYear}`
      );

      // If rating < 4, flag payment for admin review
      if (rating < 4) {
        await supabase
          .from('payments')
          .update({
            status: 'pending_review',
            notes: `Review rating ${rating}/5 stars - flagged for admin review`
          })
          .eq('driver_id', driver.id)
          .eq('status', 'escrow');

        Alert.alert(
          'Review Submitted',
          `Thank you for your feedback (${rating}/5 stars). Your rating is below 4 stars, so this has been flagged for admin review. The payment will be held until the issue is resolved.`,
          [{ text: 'OK' }]
        );
      } else {
        // Rating >= 4, release payment from escrow
        const { data: escrowPayment } = await supabase
          .from('payments')
          .select('*')
          .eq('driver_id', driver.id)
          .eq('status', 'escrow')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (escrowPayment) {
          await supabase
            .from('payments')
            .update({ status: 'paid', released_at: new Date().toISOString() })
            .eq('id', escrowPayment.id);
        }

        Alert.alert(
          'Thank You!',
          `Your ${rating}/5 star review has been submitted. Payment has been released to your driver.`,
          [{ text: 'OK' }]
        );
      }

      setRating(0);
      setComment('');
      setCanReview(false);
      loadData();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent!';
      default: return 'Tap to rate';
    }
  };

  return (
    <ScrollView
      style={[styles(colors).container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles(colors).header, { backgroundColor: colors.primary }]}>
        <Text style={styles(colors).headerTitle}>Monthly Review</Text>
        <Text style={[styles(colors).headerSubtext, { color: colors.accent }]}>
          Rate your driver for {currentMonth} {currentYear}
        </Text>
      </View>

      {/* Driver Card */}
      {driver ? (
        <View style={[styles(colors).driverCard, { backgroundColor: colors.card }]}>
          <View style={[styles(colors).driverAvatar, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={[styles(colors).driverName, { color: colors.text }]}>{driver.full_name}</Text>
          <Text style={[styles(colors).driverSchool, { color: colors.textSecondary }]}>
            Vehicle: {driver.vehicle_plate}
          </Text>
          {driver.monthly_rate && (
            <Text style={[styles(colors).driverRate, { color: colors.accent }]}>
              Monthly Rate: R{driver.monthly_rate}
            </Text>
          )}
        </View>
      ) : (
        <View style={[styles(colors).driverCard, { backgroundColor: colors.card }]}>
          <Ionicons name="car-sport-outline" size={50} color={colors.textSecondary} />
          <Text style={[styles(colors).driverName, { color: colors.text, marginTop: 10 }]}>No Driver Assigned</Text>
          <Text style={[styles(colors).driverSchool, { color: colors.textSecondary }]}>
            Hire a driver to start using ScholarTrack
          </Text>
        </View>
      )}

      {/* Review Form */}
      {canReview && driver ? (
        <>
          <View style={[styles(colors).ratingSection, { backgroundColor: colors.card }]}>
            <Text style={[styles(colors).ratingTitle, { color: colors.text }]}>How was the service this month?</Text>
            <View style={styles(colors).stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} disabled={loading}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={44}
                    color="#FFB81C"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles(colors).ratingText, { color: rating >= 4 ? colors.secondary : rating >= 3 ? colors.accent : colors.danger }]}>
              {getRatingLabel(rating)}
            </Text>
            {rating < 4 && (
              <View style={[styles(colors).warningBox, { backgroundColor: '#FFF3CD', borderColor: colors.accent }]}>
                <Ionicons name="warning" size={20} color={colors.danger} />
                <Text style={styles(colors).warningText}>
                  Ratings below 4 stars will flag the payment for admin review
                </Text>
              </View>
            )}
          </View>

          <View style={[styles(colors).feedbackSection, { backgroundColor: colors.card }]}>
            <Text style={[styles(colors).feedbackTitle, { color: colors.text }]}>Additional Comments</Text>
            <TextInput
              style={[styles(colors).feedbackInput, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Tell us more about your experience (optional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles(colors).submitBtn, { backgroundColor: colors.primary }, loading && styles(colors).submitBtnDisabled]}
            onPress={submitReview}
            disabled={loading || rating === 0}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles(colors).submitBtnText}>Submit Review</Text>
              </>
            )}
          </TouchableOpacity>
        </>
      ) : !driver ? null : (
        <View style={[styles(colors).completedSection, { backgroundColor: colors.card }]}>
          <Ionicons name="checkmark-done-circle" size={60} color={colors.secondary} />
          <Text style={[styles(colors).completedTitle, { color: colors.text }]}>Review Submitted!</Text>
          <Text style={[styles(colors).completedText, { color: colors.textSecondary }]}>
            You've already reviewed for {currentMonth} {currentYear}. See your history below.
          </Text>
        </View>
      )}

      {/* Review History */}
      <View style={[styles(colors).historySection, { backgroundColor: colors.card }]}>
        <Text style={[styles(colors).historyTitle, { color: colors.text }]}>Review History</Text>

        {reviews.length === 0 ? (
          <View style={styles(colors).emptyHistory}>
            <Ionicons name="document-text-outline" size={40} color="#999" />
            <Text style={[styles(colors).emptyText, { color: colors.textSecondary }]}>
              Your review history will appear here after you submit reviews.
            </Text>
          </View>
        ) : (
          reviews.map((review) => (
            <View key={review.id} style={[styles(colors).reviewCard, { backgroundColor: colors.background }]}>
              <View style={styles(colors).reviewHeader}>
                <Text style={[styles(colors).reviewMonth, { color: colors.text }]}>{review.month}</Text>
                <View style={styles(colors).reviewRating}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= review.rating ? 'star' : 'star-outline'}
                      size={16}
                      color="#FFB81C"
                    />
                  ))}
                </View>
              </View>
              {review.comment && (
                <Text style={[styles(colors).reviewComment, { color: colors.textSecondary }]}>
                  "{review.comment}"
                </Text>
              )}
              {review.status === 'flagged' && (
                <View style={[styles(colors).flaggedBadge, { backgroundColor: '#FFE5E5' }]}>
                  <Ionicons name="flag" size={12} color={colors.danger} />
                  <Text style={[styles(colors).flaggedText, { color: colors.danger }]}>Flagged for review</Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* Payment Info */}
      <View style={[styles(colors).infoSection, { backgroundColor: colors.card }]}>
        <Ionicons name="information-circle" size={24} color={colors.primary} />
        <Text style={[styles(colors).infoText, { color: colors.textSecondary }]}>
          Payments are held in escrow until you submit your monthly review.
          Ratings of 4+ stars release the payment to your driver.
        </Text>
      </View>

      <View style={styles(colors).bottomPadding} />
    </ScrollView>
  );
};

const styles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  driverCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  driverAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  driverName: {
    fontSize: 20,
    fontWeight: '600',
  },
  driverSchool: {
    fontSize: 14,
    marginTop: 4,
  },
  driverRate: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  ratingSection: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  feedbackSection: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  feedbackInput: {
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  completedSection: {
    margin: 16,
    marginTop: 0,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 12,
  },
  completedText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  historySection: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  reviewCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewMonth: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  flaggedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  flaggedText: {
    fontSize: 12,
    marginLeft: 4,
  },
  infoSection: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});

export default ReviewDriverScreen;
