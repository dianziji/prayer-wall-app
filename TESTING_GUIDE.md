# Prayer Edit/Delete Feature Testing Guide

## 🚀 Quick Setup

### 1. Database Setup
First, run the RLS migration script:

```sql
-- Execute in Supabase SQL Editor
-- File: supabase-migrations-prayers-rls-edit-delete.sql

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
```

### 2. Run Tests
```bash
# Run all tests
npm test

# Run specific test files
npm test tests/basic.test.ts
npm test tests/utils/time-utils.test.ts

# Run tests in watch mode during development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📋 Manual Testing Checklist

### Prerequisites
- [ ] Database RLS policies installed
- [ ] Application running (`npm run dev`)
- [ ] At least 2 user accounts for testing

### 🔐 Authentication Tests

#### Unauthenticated Users
- [ ] **No Edit/Delete Buttons**: Prayer cards show no action menus
- [ ] **API Protection**: Direct PATCH/DELETE calls return 401
  ```bash
  curl -X PATCH "http://localhost:3000/api/prayers?id=prayer-1" -H "Content-Type: application/json" -d '{"content":"hacked"}'
  # Should return: {"error":"请先登录"} with status 401
  ```

#### Authenticated Users  
- [ ] **Login Successful**: User can log in via auth flow
- [ ] **Session Valid**: User profile shows correctly in prayer forms

### 🎯 Prayer Ownership Tests

#### Own Prayers
- [ ] **Action Menu Visible**: Three-dot menu appears on user's own prayers
- [ ] **Edit Button Present**: "Edit" option in dropdown menu
- [ ] **Delete Button Present**: "Delete" option in dropdown menu
- [ ] **Edit Modal Opens**: Clicking Edit opens modal with existing content pre-filled
- [ ] **Form Pre-population**: Author name and content fields show current values

#### Others' Prayers
- [ ] **No Action Menu**: Three-dot menu does NOT appear on others' prayers
- [ ] **No Edit Access**: Cannot access edit functionality for others' prayers
- [ ] **API Protection**: Direct PATCH/DELETE on others' prayers returns 403
  ```bash
  # As user-1, try to edit user-2's prayer
  curl -X PATCH "http://localhost:3000/api/prayers?id=other-user-prayer" -H "Content-Type: application/json" -d '{"content":"hacked"}' -H "Authorization: Bearer YOUR_TOKEN"
  # Should return: {"error":"Not authorized"} with status 403
  ```

### ⏰ Week Restriction Tests  

#### Current Week Prayers
- [ ] **Edit Allowed**: Can edit prayers from current week
- [ ] **Delete Allowed**: Can delete prayers from current week
- [ ] **Success Response**: Operations return `{"success": true}`

#### Historical Week Prayers
- [ ] **Edit Buttons Hidden**: No edit/delete buttons on past weeks' pages
- [ ] **Read-Only Indicator**: Page shows "Viewing a past week (read-only)"
- [ ] **No Submit Button**: "Submit a Prayer" button hidden on past weeks
- [ ] **API Protection**: Direct PATCH/DELETE on old prayers returns 400
  ```bash
  # Try to edit prayer from past week
  curl -X PATCH "http://localhost:3000/api/prayers?id=old-prayer" -H "Content-Type: application/json" -d '{"content":"updated"}' -H "Authorization: Bearer YOUR_TOKEN"
  # Should return: {"error":"Can only edit current week prayers"} with status 400
  ```

### ✏️ Edit Functionality Tests

#### Edit Modal Behavior
- [ ] **Modal Opens**: Edit button opens modal with "Edit Prayer" title
- [ ] **Pre-filled Content**: Existing content appears in textarea
- [ ] **Pre-filled Author**: Author name field shows current value
- [ ] **Character Counters**: Show current/max characters (500 for content, 24 for name)
- [ ] **Button Text**: Shows "Update Prayer" instead of "Post Prayer"

#### Edit Validation
- [ ] **Empty Content Error**: Clearing content shows "内容不能为空"
- [ ] **Content Too Long**: >500 chars shows "内容不能超过 500 字符"  
- [ ] **Author Too Long**: >24 chars gets truncated to 24
- [ ] **Valid Updates**: Proper content updates successfully
- [ ] **Loading State**: Shows "Updating..." during API call

#### Edit Success Flow
- [ ] **API Call**: PATCH request to `/api/prayers?id=XXX`
- [ ] **Modal Closes**: Modal disappears after successful update
- [ ] **Data Refresh**: Page refreshes to show updated content
- [ ] **Toast/Feedback**: Success feedback shown (if implemented)

#### Edit Error Handling
- [ ] **Network Error**: Shows error message for network failures
- [ ] **Server Error**: Shows specific error message from API
- [ ] **Modal Stays Open**: Modal remains open on errors
- [ ] **Retry Possible**: User can fix and retry after error

### 🗑️ Delete Functionality Tests

#### Delete Confirmation
- [ ] **Confirmation Dialog**: Delete button shows confirm dialog with "确定要删除这个祷告吗？"
- [ ] **Cancel Works**: Clicking Cancel/No aborts deletion
- [ ] **Confirm Works**: Clicking OK/Yes proceeds with deletion

#### Delete Success Flow
- [ ] **API Call**: DELETE request to `/api/prayers?id=XXX`
- [ ] **Immediate Feedback**: Button shows "Deleting..." during API call
- [ ] **Data Refresh**: Prayer disappears from list immediately
- [ ] **No Modal**: No modal needed - direct operation

#### Delete Error Handling
- [ ] **Network Error**: Shows alert with error message
- [ ] **Server Error**: Shows specific error from API response
- [ ] **Prayer Remains**: Failed deletion leaves prayer in list
- [ ] **Button Reset**: Delete button returns to normal state

### 🔄 Data Consistency Tests

#### UI State Management
- [ ] **Refresh Key**: WeeklyWallClient refreshKey increments after operations
- [ ] **Modal State**: Edit modal properly resets between create/edit modes
- [ ] **Form Reset**: Create form clears after switching from edit mode
- [ ] **Action Menu**: Menu closes after action selection

#### Database Integrity
- [ ] **RLS Enforcement**: Database policies prevent unauthorized access
- [ ] **Cascading Deletes**: Related data (likes, comments) handled properly
- [ ] **Audit Trails**: created_at timestamps preserved correctly
- [ ] **Foreign Keys**: user_id relationships maintained

### 🌐 Cross-Browser & Device Tests

#### Browser Compatibility
- [ ] **Chrome**: All features work in latest Chrome
- [ ] **Firefox**: All features work in latest Firefox  
- [ ] **Safari**: All features work in latest Safari
- [ ] **Mobile Safari**: Touch interactions work properly
- [ ] **Mobile Chrome**: Mobile-specific behaviors correct

#### Responsive Design
- [ ] **Mobile Edit**: Edit modal fits properly on mobile screens
- [ ] **Touch Targets**: Action buttons large enough for touch
- [ ] **Menu Positioning**: Dropdown menus don't go off-screen
- [ ] **Form Usability**: Text inputs work well on mobile keyboards

### 🔍 Regression Tests

#### Existing Features Unaffected
- [ ] **Prayer Creation**: New prayers can still be posted
- [ ] **Prayer Reading**: Existing prayers display correctly
- [ ] **Like Functionality**: Like/unlike still works
- [ ] **Comment System**: Comments can be added and viewed
- [ ] **Week Navigation**: /week/[date] routing still works
- [ ] **Archive Page**: Historical weeks accessible
- [ ] **Authentication**: Login/logout flows unmodified

#### Performance Impact
- [ ] **Page Load Speed**: No significant performance degradation
- [ ] **Bundle Size**: JavaScript bundle size impact minimal
- [ ] **API Response Time**: Edit/delete operations respond quickly
- [ ] **Memory Usage**: No memory leaks from modal/state management

## 🐛 Common Issues & Troubleshooting

### Issue: Edit/Delete buttons not showing
**Cause**: User not logged in or not owner of prayer  
**Fix**: Verify session state and prayer ownership

### Issue: "Not authorized" error
**Cause**: RLS policies not installed or user trying to edit others' prayers  
**Fix**: Run RLS migration script and verify ownership

### Issue: "Can only edit current week prayers"
**Cause**: Trying to edit prayer from past week  
**Expected**: This is correct behavior, feature working as designed

### Issue: Modal not closing after successful edit
**Cause**: JavaScript error in onPost callback  
**Fix**: Check browser console for errors, verify state management

### Issue: Page not refreshing after delete
**Cause**: onDelete callback not triggering refresh  
**Fix**: Verify refreshKey increment in WeeklyWallClient

## 🎬 End-to-End Test Scenarios

### Scenario 1: Complete Edit Flow
1. Login as User A
2. Navigate to current week  
3. Post a new prayer
4. Find your prayer in the list
5. Click three-dot menu → Edit
6. Modify content and author name
7. Click "Update Prayer"
8. Verify modal closes and content updates

### Scenario 2: Cross-User Security
1. Login as User A, post a prayer
2. Note the prayer ID from network tab
3. Logout and login as User B  
4. Try to access edit via direct API call
5. Verify 403 Forbidden response

### Scenario 3: Week Boundary Testing
1. Create prayer on Sunday (current week)
2. Wait until Monday (still current week)
3. Verify edit/delete still available
4. Navigate to previous week's page
5. Verify read-only mode active

### Scenario 4: Error Recovery  
1. Start editing a prayer
2. Disconnect internet mid-update
3. Try to submit changes
4. Verify error message shows
5. Reconnect internet and retry
6. Verify successful update

## ✅ Sign-off Checklist

Before marking this feature as complete:

- [ ] All manual tests pass  
- [ ] Automated tests run successfully (`npm test`)
- [ ] Code review completed
- [ ] RLS policies deployed to production database
- [ ] Feature deployed to staging environment
- [ ] End-to-end scenarios validated
- [ ] Performance impact assessed
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Rollback plan verified

---

**Last Updated**: August 10, 2025  
**Feature**: Prayer Edit/Delete Functionality  
**Version**: 1.0.0