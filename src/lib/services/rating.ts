// Driver Rating Service
import { supabase } from './supabase';
import { assertCallerOwns } from './ownership';

export interface DriverReview {
  id: string;
  parent_id: string;
  driver_id: string;
  rating: number;
  comment?: string;
  month: string;
  status: 'approved' | 'flagged';
  created_at: string;
}

export interface DriverRatingSummary {
  driver_id: string;
  total_reviews: number;
  average_rating: number;
  positive_reviews: number;
  negative_reviews: number;
}

export const ratingService = {
  async submitReview(
    parentId: string,
    driverId: string,
    rating: number,
    comment: string,
    month: string
  ): Promise<DriverReview> {
    await assertCallerOwns(parentId);
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        parent_id: parentId,
        driver_id: driverId,
        rating,
        comment,
        month,
        status: rating >= 4 ? 'approved' : 'flagged',
      })
      .select()
      .single();

    if (error) throw error;
    return data as DriverReview;
  },

  async getDriverReviews(driverId: string): Promise<DriverReview[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DriverReview[];
  },

  async getParentReviews(parentId: string): Promise<DriverReview[]> {
    await assertCallerOwns(parentId);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DriverReview[];
  },

  async getDriverRatingSummary(driverId: string): Promise<DriverRatingSummary | null> {
    const { data, error } = await supabase
      .from('driver_ratings_summary')
      .select('*')
      .eq('driver_id', driverId)
      .single();

    if (error) {
      // Fallback if view doesn't exist yet
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('driver_id', driverId);

      if (reviewsError) throw reviewsError;

      const total = reviews?.length || 0;
      if (total === 0) return null;

      const sum = reviews?.reduce((acc, r) => acc + r.rating, 0) || 0;
      return {
        driver_id: driverId,
        total_reviews: total,
        average_rating: sum / total,
        positive_reviews: reviews?.filter(r => r.rating >= 4).length || 0,
        negative_reviews: reviews?.filter(r => r.rating < 4).length || 0,
      };
    }

    return data as DriverRatingSummary;
  },

  async hasReviewedThisMonth(
    parentId: string,
    driverId: string,
    month: string
  ): Promise<boolean> {
    await assertCallerOwns(parentId);
    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('parent_id', parentId)
      .eq('driver_id', driverId)
      .eq('month', month)
      .single();

    if (error) return false;
    return !!data;
  },
};
