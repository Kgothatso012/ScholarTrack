-- =====================================================
-- Driver Ratings Reviews Table
-- =====================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  month TEXT NOT NULL,
  status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'flagged')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying reviews by parent and driver
CREATE INDEX idx_reviews_parent ON reviews(parent_id);
CREATE INDEX idx_reviews_driver ON reviews(driver_id);
CREATE INDEX idx_reviews_month ON reviews(month);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
DROP POLICY IF EXISTS "Parents can read own reviews" ON reviews;
CREATE POLICY "Parents can read own reviews" ON reviews FOR SELECT USING (
  parent_id = auth.uid()
);

DROP POLICY IF EXISTS "Drivers can read reviews about themselves" ON reviews;
CREATE POLICY "Drivers can read reviews about themselves" ON reviews FOR SELECT USING (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Parents can insert reviews" ON reviews;
CREATE POLICY "Parents can insert reviews" ON reviews FOR INSERT WITH CHECK (
  parent_id = auth.uid()
);

-- =====================================================
-- Driver Ratings Aggregate View
-- =====================================================

CREATE OR REPLACE VIEW driver_ratings_summary AS
SELECT
  driver_id,
  COUNT(*) as total_reviews,
  AVG(rating)::DECIMAL(3,2) as average_rating,
  COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_reviews,
  COUNT(CASE WHEN rating < 4 THEN 1 END) as negative_reviews
FROM reviews
GROUP BY driver_id;

-- =====================================================
-- Add rating fields to drivers table for caching
-- =====================================================

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_reviews_count INTEGER DEFAULT 0;

-- =====================================================
-- Function to update driver rating cache
-- =====================================================

CREATE OR REPLACE FUNCTION update_driver_rating_cache()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE drivers
  SET
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM reviews
      WHERE driver_id = NEW.driver_id
    ),
    total_reviews_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE driver_id = NEW.driver_id
    )
  WHERE id = NEW.driver_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update driver rating cache on insert/update/delete
DROP TRIGGER IF EXISTS update_driver_rating_on_review ON reviews;
CREATE TRIGGER update_driver_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_driver_rating_cache();

SELECT 'Reviews table and driver rating cache created successfully!' as result;
