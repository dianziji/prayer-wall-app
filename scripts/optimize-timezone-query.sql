-- Optimization for pg_timezone_names query
-- This addresses the slow "SELECT name FROM pg_timezone_names" queries

-- 1. Create a materialized view for commonly used timezones
CREATE MATERIALIZED VIEW IF NOT EXISTS common_timezones AS
SELECT name 
FROM pg_timezone_names 
WHERE name IN (
  'UTC',
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
)
ORDER BY name;

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_common_timezones_name ON common_timezones(name);

-- 3. Set up refresh function (optional - run periodically if needed)
CREATE OR REPLACE FUNCTION refresh_common_timezones()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW common_timezones;
END;
$$ LANGUAGE plpgsql;

-- 4. Grant access to authenticated users
GRANT SELECT ON common_timezones TO authenticated;
GRANT SELECT ON common_timezones TO anon;

-- Usage example:
-- Instead of: SELECT name FROM pg_timezone_names;
-- Use: SELECT name FROM common_timezones;
-- Or for specific lookup: SELECT name FROM common_timezones WHERE name = 'UTC';

-- Note: If you need all timezones, consider adding a where clause to limit results:
-- SELECT name FROM pg_timezone_names WHERE name LIKE 'America/%' LIMIT 50;