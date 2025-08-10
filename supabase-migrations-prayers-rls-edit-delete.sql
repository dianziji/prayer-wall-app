-- Migration: Add RLS policies for prayer edit/delete
-- This script should be manually reviewed and executed in Supabase dashboard

-- Enable RLS on prayers table (if not already enabled)
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can update their own prayers
CREATE POLICY "Users can update own prayers" 
ON prayers FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own prayers  
CREATE POLICY "Users can delete own prayers"
ON prayers FOR DELETE
USING (auth.uid() = user_id);

-- ROLLBACK SCRIPT (run if need to revert):
-- DROP POLICY IF EXISTS "Users can update own prayers" ON prayers;
-- DROP POLICY IF EXISTS "Users can delete own prayers" ON prayers;