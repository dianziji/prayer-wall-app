# Database Migration for Prayer Categories Feature

## Overview
This document outlines the database changes needed to support the new prayer categories feature with dual-field structure (thanksgiving and intercession).

## Required Changes

### 1. Add New Columns to `prayers` Table

```sql
-- Add thanksgiving_content column
ALTER TABLE prayers 
ADD COLUMN thanksgiving_content TEXT;

-- Add intercession_content column  
ALTER TABLE prayers 
ADD COLUMN intercession_content TEXT;

-- Add indexes for performance
CREATE INDEX idx_prayers_thanksgiving_content ON prayers (thanksgiving_content) WHERE thanksgiving_content IS NOT NULL;
CREATE INDEX idx_prayers_intercession_content ON prayers (intercession_content) WHERE intercession_content IS NOT NULL;
```

### 2. Update Views

```sql
-- Update v_prayers_likes view to include new columns
CREATE OR REPLACE VIEW v_prayers_likes AS
SELECT 
  p.*,
  p.thanksgiving_content,
  p.intercession_content,
  COALESCE(l.like_count, 0) AS like_count,
  CASE 
    WHEN ul.user_id IS NOT NULL THEN true 
    ELSE false 
  END AS liked_by_me
FROM prayers p
LEFT JOIN (
  SELECT 
    prayer_id, 
    COUNT(*) as like_count
  FROM likes 
  GROUP BY prayer_id
) l ON p.id = l.prayer_id
LEFT JOIN likes ul ON p.id = ul.prayer_id 
  AND ul.user_id = auth.uid();
```

### 3. Update archive_weeks View (if needed)

```sql
-- Ensure archive_weeks view counts prayers with new structure
-- This may need updating depending on current implementation
```

## Data Migration Strategy

### Option 1: Gradual Migration (Recommended)
- Keep existing `content` field intact
- New prayers use the dual-field structure
- Legacy prayers continue to work with `content` field
- UI handles both formats seamlessly

### Option 2: Full Migration
- Migrate existing prayers to appropriate categories
- This would require manual categorization or AI assistance
- More complex but creates consistency

## Backward Compatibility

The application is designed to handle:
- Legacy prayers with only `content` field
- New prayers with `thanksgiving_content` and/or `intercession_content`
- Mixed data scenarios

## UI Changes Required

1. **Prayer Form**: Now supports dual-field input
2. **Prayer Cards**: Dynamic backgrounds based on content type
3. **API**: Accepts both old and new formats

## Testing Checklist

- [ ] New prayers can be created with dual fields
- [ ] Legacy prayers still display correctly
- [ ] API handles both formats properly
- [ ] Background colors work correctly
- [ ] Mobile responsiveness maintained
- [ ] Character limits enforced properly

## Rollback Plan

If issues arise:
1. Revert API changes to only use `content` field
2. Hide new form fields via feature flag
3. Use legacy display format for all prayers

## Notes

- Total character limit remains 500 across both fields
- At least one field must have content
- Author name limit remains 24 characters
- All existing functionality preserved