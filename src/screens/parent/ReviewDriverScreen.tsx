// ScholarTrack ReviewDriverScreen — Dark SA Transport Design
// Glassmorphism, dark theme, cyan/amber accents, animated star rating

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  UIManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { ratingService } from '../../lib/services';
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';
import { getTheme } from '../../lib/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPRING = { damping: 15, stiffness: 150 };

// Theme token aliases for this screen
const C = getTheme('dark').colors;
// Custom accent colors not in theme - keep original values to preserve design
const CYAN = '#00e5ff';
const AMBER = '#ffb700';

const SpringTouchable = ({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
}) => {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * 0.04, SPRING) }],
  }));
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={animStyle}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const glassCard = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

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

const ReviewDriverScreen = ({ navigation }: Props) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [currentMonth] = useState(MONTHS[new Date().getMonth()]);
  const [currentYear] = useState(new Date().getFullYear());
  const [canReview, setCanReview] = useState(true);

  const loadData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const { data: childData } = await supabase
        .from('children')
        .select('*, driver:drivers(*)')
        .eq('parent_id', userId)
        .limit(1)
        .single();
      if (childData?.driver) setDriver(childData.driver);
      const reviewsData = await ratingService.getParentReviews(userId);
      setReviews(reviewsData || []);
      const thisMonthReview = reviewsData.find(
        (r) => r.month === `${currentMonth} ${currentYear}`
      );
      setCanReview(!thisMonthReview);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const submitReview = async () => {
    if (rating === 0 || !driver) return;
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('Not logged in');
      await ratingService.submitReview(
        userId,
        driver.id,
        rating,
        comment,
        `${currentMonth} ${currentYear}`
      );
      setRating(0);
      setComment('');
      setCanReview(false);
      loadData();
    } catch (error) {
      console.error('Error submitting review:', error);
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

  const getRatingColor = (r: number) => {
    if (r >= 4) return C.success;
    if (r >= 3) return AMBER;
    if (r > 0) return C.danger;
    return C.textMuted;
  };

  const sectionLabelStyle = { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.25)', marginBottom: spacing.sm };

  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      backgroundColor: C.surface,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomWidth: 4,
      borderBottomColor: AMBER,
    },
    headerTitle: { ...typography.h2, color: C.text },
    headerSubtext: { ...typography.bodySmall, color: C.textMuted, marginTop: spacing.xs },
    driverCard: {
      margin: spacing.lg,
      padding: spacing.xl,
      borderRadius: 20,
      alignItems: 'center',
      ...glassCard,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      borderColor: 'rgba(255,183,0,.12)',
      borderTopWidth: 0,
    },
    driverAvatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: CYAN + '20',
      borderWidth: 1.5,
      borderColor: CYAN,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    driverName: { ...typography.h3, color: C.text },
    driverSchool: { ...typography.bodySmall, color: C.textMuted, marginTop: spacing.xs },
    driverRate: { ...typography.h4, color: AMBER, marginTop: spacing.xs },
    ratingSection: {
      margin: spacing.lg,
      padding: spacing.xl,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      ...glassCard,
    },
    ratingTitle: { ...typography.h4, color: C.text, marginBottom: spacing.lg },
    stars: { flexDirection: 'row', marginBottom: spacing.sm },
    ratingText: { ...typography.label, marginTop: spacing.sm },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: C.danger + '40',
      backgroundColor: C.danger + '10',
      marginTop: spacing.md,
    },
    warningText: {
      flex: 1,
      marginLeft: spacing.sm,
      ...typography.caption,
      color: C.danger,
    },
    feedbackSection: {
      margin: spacing.lg,
      marginTop: 0,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      ...glassCard,
    },
    feedbackTitle: { ...typography.h4, color: C.text, marginBottom: spacing.md },
    feedbackInput: {
      borderRadius: borderRadius.md,
      padding: spacing.md,
      minHeight: 100,
      textAlignVertical: 'top',
      ...typography.body,
      color: C.text,
      backgroundColor: 'rgba(255,255,255,.06)',
      borderWidth: 1,
      borderColor: C.border,
    },
    submitBtn: {
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: CYAN,
      alignItems: 'center',
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { ...typography.button, color: C.background, fontWeight: '700' },
    completedSection: {
      margin: spacing.lg,
      padding: spacing.xl,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      ...glassCard,
    },
    completedTitle: { ...typography.h3, color: C.text, marginTop: spacing.md },
    completedText: { ...typography.body, color: C.textMuted, textAlign: 'center', marginTop: spacing.sm },
    historySection: {
      margin: spacing.lg,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      ...glassCard,
    },
    historyTitle: { ...typography.h4, color: C.text, marginBottom: spacing.md },
    emptyHistory: { alignItems: 'center', paddingVertical: spacing.xl },
    emptyText: { ...typography.body, color: C.textMuted, textAlign: 'center', marginTop: spacing.md },
    reviewCard: {
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      backgroundColor: 'rgba(255,255,255,.04)',
    },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewMonth: { ...typography.label, color: C.text },
    reviewRating: { flexDirection: 'row' },
    reviewComment: { ...typography.bodySmall, color: C.textMuted, marginTop: spacing.xs, fontStyle: 'italic' },
    flaggedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.sm,
      marginTop: spacing.xs,
      backgroundColor: C.danger + '15',
      alignSelf: 'flex-start',
    },
    flaggedText: { ...typography.caption, color: C.danger, marginLeft: 4 },
    infoSection: {
      margin: spacing.lg,
      marginTop: 0,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      flexDirection: 'row',
      alignItems: 'flex-start',
      ...glassCard,
    },
    infoText: {
      flex: 1,
      marginLeft: spacing.sm,
      ...typography.caption,
      color: C.textMuted,
      lineHeight: 18,
    },
    bottomPadding: { height: spacing.xl },
  });

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[CYAN]} tintColor={CYAN} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: AMBER, opacity: 0.06 }} />
          <Text style={styles.headerTitle}>Monthly Review</Text>
          <Text style={styles.headerSubtext}>
            Rate your driver for {currentMonth} {currentYear}
          </Text>
        </View>

        {/* Driver Card */}
        <Animated.View entering={ZoomIn.duration(300)}>
          <View style={[styles.driverCard, { overflow: 'hidden' }]}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
            <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, backgroundColor: AMBER, borderRadius: 2 }} />
            {driver ? (
              <>
                <View style={styles.driverAvatar}>
                  <Ionicons name="person" size={36} color={CYAN} />
                </View>
                <Text style={styles.driverName}>{driver.full_name}</Text>
                <Text style={styles.driverSchool}>Vehicle: {driver.vehicle_plate}</Text>
                {driver.monthly_rate && (
                  <Text style={styles.driverRate}>Monthly Rate: R{driver.monthly_rate}</Text>
                )}
              </>
            ) : (
              <>
                <Ionicons name="car-sport-outline" size={50} color={C.textMuted} />
                <Text style={[styles.driverName, { marginTop: spacing.md }]}>No Driver Assigned</Text>
                <Text style={styles.driverSchool}>
                  Hire a driver to start using ScholarTrack
                </Text>
              </>
            )}
          </View>
        </Animated.View>

        {/* Review Form */}
        {canReview && driver ? (
          <>
            <Animated.View entering={ZoomIn.duration(300).delay(100)}>
              <View style={[styles.ratingSection, { overflow: 'hidden' }]}>
                <Text style={styles.ratingTitle}>How was the service this month?</Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      disabled={loading}
                      style={{ padding: spacing.xs }}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={44}
                        color={star <= rating ? AMBER : C.textMuted}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.ratingText, { color: getRatingColor(rating) }]}>
                  {getRatingLabel(rating)}
                </Text>
                {rating > 0 && rating < 4 && (
                  <View style={styles.warningBox}>
                    <Ionicons name="warning" size={18} color={C.danger} />
                    <Text style={styles.warningText}>
                      Ratings below 4 stars will flag the payment for admin review
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackTitle}>Additional Comments</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Tell us more about your experience (optional)"
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
                editable={!loading}
              />
            </View>

            <SpringTouchable
              onPress={submitReview}
              style={[styles.submitBtn, (loading || rating === 0) && styles.submitBtnDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={C.background} />
              ) : (
                <Text style={styles.submitBtnText}>Submit Review</Text>
              )}
            </SpringTouchable>
          </>
        ) : !driver ? null : (
          <Animated.View entering={ZoomIn.duration(300)}>
            <View style={[styles.completedSection, { overflow: 'hidden' }]}>
              <Ionicons name="checkmark-done-circle" size={60} color={C.success} />
              <Text style={styles.completedTitle}>Review Submitted!</Text>
              <Text style={styles.completedText}>
                You've already reviewed for {currentMonth} {currentYear}. See your history below.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Review History */}
        <View style={styles.historySection}>
          <Text style={sectionLabelStyle}>Review History</Text>
          {reviews.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="document-text-outline" size={40} color={C.textMuted} />
              <Text style={styles.emptyText}>
                Your review history will appear here after you submit reviews.
              </Text>
            </View>
          ) : (
            reviews.map((review, index) => (
              <Animated.View key={review.id} entering={ZoomIn.duration(300).delay(index * 60)}>
                <View style={[styles.reviewCard, { overflow: 'hidden' }]}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewMonth}>{review.month}</Text>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? 'star' : 'star-outline'}
                          size={14}
                          color={star <= review.rating ? AMBER : C.textMuted}
                        />
                      ))}
                    </View>
                  </View>
                  {review.comment && (
                    <Text style={styles.reviewComment}>"{review.comment}"</Text>
                  )}
                  {review.status === 'flagged' && (
                    <View style={styles.flaggedBadge}>
                      <Ionicons name="flag" size={12} color={C.danger} />
                      <Text style={styles.flaggedText}>Flagged for review</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            ))
          )}
        </View>

        {/* Payment Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={22} color={CYAN} />
          <Text style={styles.infoText}>
            Payments are held in escrow until you submit your monthly review. Ratings of 4+ stars release the payment to your driver.
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </Animated.View>
  );
};

export default ReviewDriverScreen;