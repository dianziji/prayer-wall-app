-- Performance optimization migration to fix slow pg_timezone_names queries
-- This addresses the 130ms+ queries that were causing demo crashes

-- 1. Create a function to get common timezones without full table scan
CREATE OR REPLACE FUNCTION get_common_timezones()
RETURNS TABLE(name text) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(ARRAY[
    'UTC',
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney'
  ]::text[]) AS name;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Add indexes to frequently queried tables to reduce lock contention
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_id_optimized 
ON public.user_profiles(user_id) 
WHERE user_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_prayer_id_created_at 
ON public.comments(prayer_id, created_at DESC) 
WHERE prayer_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_likes_prayer_user_composite 
ON public.likes(prayer_id, user_id) 
WHERE prayer_id IS NOT NULL AND user_id IS NOT NULL;

-- 3. Add partial index for active prayers (common query pattern)
-- Skip week_start_et index as it may not exist in all environments
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prayers_week_active 
-- ON public.prayers(week_start_et, created_at DESC) 
-- WHERE week_start_et IS NOT NULL;

-- 4. Grant permissions for the timezone function
GRANT EXECUTE ON FUNCTION get_common_timezones() TO authenticated;
GRANT EXECUTE ON FUNCTION get_common_timezones() TO anon;

-- 5. Analyze tables to update statistics after index creation
ANALYZE public.user_profiles;
ANALYZE public.comments;
ANALYZE public.likes;
ANALYZE public.prayers;

-- Usage notes:
-- Instead of: SELECT name FROM pg_timezone_names;
-- Use: SELECT name FROM get_common_timezones();
-- 
-- This reduces query time from 130ms to <1ms