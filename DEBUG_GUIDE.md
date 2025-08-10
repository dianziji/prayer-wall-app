# 🐛 Prayer Edit/Delete Debug Guide

## 🚨 Problem Statement
You mentioned: "I used the website to test directly and found that as a logged-in user, I cannot delete or edit my prayers. There are no delete or edit buttons on the prayer cards."

## 🔍 Debug Steps

### Step 1: Check Browser Console
1. **Open Browser Console** (F12 → Console tab)
2. **Navigate to current week** (`/week/2025-08-10` or similar)
3. **Look for debug logs** starting with "🔍"

Expected console output for each prayer card:
```javascript
🔍 Prayer Card Debug: {
  prayerId: "some-uuid",
  sessionUserId: "your-user-id", 
  prayerUserId: "prayer-author-user-id",
  isOwner: true/false,
  hasOnEdit: true/false,
  hasOnDelete: true/false,
  hasSession: true/false
}
```

### Step 2: Verify User Session
**Check if you're properly logged in:**
```javascript
// In browser console, run:
console.log('Session check:', {
  sessionStorage: sessionStorage.getItem('supabase.auth.token'),
  localStorage: localStorage.getItem('supabase.auth.token')  
})
```

### Step 3: Verify Prayer Ownership
**Check prayer data structure:**
1. Open **Network tab** in DevTools
2. Refresh the page
3. Look for request to `/api/prayers?week_start=...`
4. Check the response:

```json
[
  {
    "id": "prayer-uuid",
    "content": "Prayer text",
    "author_name": "Your Name",
    "user_id": "your-user-id", ← THIS MUST MATCH YOUR SESSION
    "created_at": "2025-08-10T...",
    "like_count": 5,
    "liked_by_me": false
  }
]
```

### Step 4: Check Database RLS Policies
**Verify RLS migration was executed:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'prayers';
```

Expected policies:
- `Users can update own prayers` (UPDATE)
- `Users can delete own prayers` (DELETE)

### Step 5: Test API Endpoints Directly

**Test PATCH endpoint:**
```bash
# Get your session token from browser DevTools > Application > Storage
curl -X PATCH "http://localhost:3000/api/prayers?id=PRAYER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content":"Updated content"}'
```

**Expected responses:**
- ✅ 200: `{"success": true}` (if you own the prayer)
- ❌ 401: `{"error":"请先登录"}` (if not logged in)
- ❌ 403: `{"error":"Not authorized"}` (if not your prayer)
- ❌ 400: `{"error":"Can only edit current week prayers"}` (if old prayer)

## 🔧 Common Issues & Fixes

### Issue 1: "No debug logs appear"
**Cause**: Not in development mode
**Fix**: Ensure `NODE_ENV=development` or running `npm run dev`

### Issue 2: "sessionUserId is null"
**Cause**: User not properly authenticated
**Fixes**:
1. Clear browser storage: `localStorage.clear(); sessionStorage.clear()`
2. Re-login through the auth flow
3. Check Supabase auth configuration

### Issue 3: "prayerUserId is null"
**Cause**: API not returning user_id field
**Fixes**:
1. Check API query in `app/api/prayers/route.ts:26`
2. Verify `v_prayers_likes` view includes `user_id`
3. Check if prayers were created before user_id tracking

### Issue 4: "isOwner is false but should be true"
**Causes & Fixes**:
```javascript
// Exact match required - check for type mismatches
sessionUserId === prayerUserId  // Must be exactly equal
"user-123" !== "user-456"      // Different users
"user-123" !== null            // Prayer has no owner
null !== "user-123"           // User not logged in
```

### Issue 5: "hasOnEdit/hasOnDelete is false"
**Cause**: Callbacks not passed down component tree
**Debug**: Check console for "🔍 WeeklyWallClient Debug" logs

### Issue 6: "RLS policies block operations"
**Cause**: Database policies not installed
**Fix**: Run the migration script:
```sql
-- In Supabase SQL Editor
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update own prayers" 
ON prayers FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prayers"
ON prayers FOR DELETE
USING (auth.uid() = user_id);
```

## 🧪 Quick Test Script

Run this in your browser console on a prayers page:

```javascript
// Quick Debug Script
(function debugPrayerButtons() {
  console.log('=== PRAYER DEBUG START ===');
  
  // Check session
  const hasToken = !!(localStorage.getItem('supabase.auth.token') || 
                     sessionStorage.getItem('supabase.auth.token'));
  console.log('1. Has auth token:', hasToken);
  
  // Check prayer cards
  const prayerCards = document.querySelectorAll('[class*="bg-white rounded-xl shadow-md"]');
  console.log('2. Found prayer cards:', prayerCards.length);
  
  // Check action buttons (three dots)
  prayerCards.forEach((card, index) => {
    const actionButton = card.querySelector('svg[viewBox="0 0 20 20"]')?.closest('button');
    const content = card.querySelector('p')?.textContent?.substring(0, 50);
    console.log(`3. Card ${index + 1}:`, {
      content: content + '...',
      hasActionButton: !!actionButton,
      buttonVisible: actionButton ? !actionButton.hidden : false
    });
  });
  
  console.log('=== PRAYER DEBUG END ===');
})();
```

## 🎯 Expected Behavior

**When everything works correctly:**

1. **Console shows:**
   ```
   🔍 WeeklyWallClient Debug: { hasHandleEdit: true, hasHandleDelete: true }
   🔍 Prayer Card Debug: { isOwner: true, hasOnEdit: true, hasOnDelete: true }
   ```

2. **UI shows:**
   - Three-dot menu button (⋮) on your own prayers
   - No three-dot menu on others' prayers  
   - Edit/Delete options in dropdown menu
   - Modal opens when Edit is clicked

3. **API works:**
   - PATCH requests succeed with 200 status
   - DELETE requests succeed with 200 status  
   - Unauthorized requests fail with 403

## 🚀 If All Else Fails

1. **Hard reset:**
   ```bash
   # Clear all data and restart
   npm run build
   rm -rf .next
   npm run dev
   ```

2. **Create a test prayer:**
   - Login as yourself
   - Post a new prayer
   - Refresh the page
   - Check if YOUR new prayer shows edit/delete buttons

3. **Check the network:**
   - Inspect all API calls in Network tab
   - Verify session cookies are sent
   - Check for CORS or auth errors

## 📞 Need More Help?

If buttons still don't appear, please share:
1. Console debug logs (the 🔍 messages)
2. Network tab showing API request/response
3. Your user ID from the session
4. Prayer data showing user_id values

This will help identify exactly where the ownership detection is failing.

---
**Last Updated**: August 10, 2025  
**Status**: Active debugging session