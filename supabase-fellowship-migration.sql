-- Fellowship system migration for Prayer Wall
-- This migration adds fellowship support to the existing prayer system

-- Add fellowship column to prayers table
ALTER TABLE prayers ADD COLUMN fellowship VARCHAR(50) DEFAULT 'weekday';

-- Create fellowships configuration table
CREATE TABLE fellowships (
  id VARCHAR(50) PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert predefined fellowships
INSERT INTO fellowships (id, display_name, description, color, sort_order) VALUES 
  ('sunday', '主日祷告', '主日崇拜祷告事项', '#8b5cf6', 1),
  ('ypf', 'YPF团契', '青年专业人士团契', '#3b82f6', 2),
  ('jcf', 'JCF团契', 'JCF团契祷告', '#10b981', 3),
  ('student', '学生团契', '学生团契祷告', '#f59e0b', 4),
  ('lic', 'LIC团契', 'LIC团契祷告', '#ef4444', 5),
  ('weekday', '平日祷告', '个人平日祷告', '#6b7280', 6);

-- Add default fellowship preference to user profiles
ALTER TABLE user_profiles ADD COLUMN default_fellowship VARCHAR(50) DEFAULT 'weekday';

-- Add foreign key constraint (optional, for data integrity)
ALTER TABLE prayers ADD CONSTRAINT fk_prayers_fellowship 
  FOREIGN KEY (fellowship) REFERENCES fellowships(id);

-- Add foreign key constraint for user profiles
ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_fellowship 
  FOREIGN KEY (default_fellowship) REFERENCES fellowships(id);

-- Update existing prayers to have weekday fellowship as default
-- This ensures all existing prayers are visible after migration
UPDATE prayers SET fellowship = 'weekday' WHERE fellowship IS NULL OR fellowship = '';

-- Alternative: Set all existing prayers to 'weekday' fellowship
-- Uncomment the line below if you want to be more explicit
-- UPDATE prayers SET fellowship = 'weekday' WHERE created_at < NOW();

-- Create index for better performance on fellowship filtering
CREATE INDEX idx_prayers_fellowship ON prayers(fellowship);
CREATE INDEX idx_prayers_fellowship_created_at ON prayers(fellowship, created_at);

-- Update the v_prayers_likes view to include fellowship
DROP VIEW IF EXISTS v_prayers_likes;
CREATE VIEW v_prayers_likes AS
SELECT 
  p.*,
  COALESCE(l.like_count, 0) AS like_count,
  CASE 
    WHEN ul.user_id IS NOT NULL THEN true 
    ELSE false 
  END AS liked_by_me
FROM prayers p
LEFT JOIN (
  SELECT prayer_id, COUNT(*) AS like_count
  FROM likes
  GROUP BY prayer_id
) l ON p.id = l.prayer_id
LEFT JOIN likes ul ON p.id = ul.prayer_id 
  AND ul.user_id = auth.uid();

-- Grant necessary permissions
GRANT SELECT ON fellowships TO anon, authenticated;
GRANT SELECT ON fellowships TO service_role;