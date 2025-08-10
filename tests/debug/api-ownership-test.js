#!/usr/bin/env node

/**
 * API Ownership Debug Test
 * Tests if the PATCH/DELETE endpoints are working correctly
 * Run with: node tests/debug/api-ownership-test.js
 */

const fetch = require('isomorphic-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testApiEndpoints() {
  console.log('🧪 Testing Prayer API Endpoints');
  console.log('================================');
  
  // Test GET prayers endpoint
  console.log('\n1. Testing GET /api/prayers...');
  try {
    const response = await fetch(`${BASE_URL}/api/prayers?week_start=2025-08-10`);
    const prayers = await response.json();
    
    console.log(`✅ GET Status: ${response.status}`);
    console.log(`📊 Found ${prayers.length} prayers`);
    
    if (prayers.length > 0) {
      console.log('\n📋 Prayer Structure Analysis:');
      prayers.forEach((prayer, index) => {
        console.log(`Prayer ${index + 1}:`, {
          id: prayer.id,
          user_id: prayer.user_id,
          user_id_type: typeof prayer.user_id,
          user_id_is_null: prayer.user_id === null,
          author_name: prayer.author_name,
          content: prayer.content?.substring(0, 50) + '...'
        });
      });
      
      // Test PATCH endpoint (should fail without auth)
      console.log('\n2. Testing PATCH /api/prayers (without auth)...');
      const prayerId = prayers[0].id;
      const patchResponse = await fetch(`${BASE_URL}/api/prayers?id=${prayerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated content' })
      });
      
      const patchResult = await patchResponse.json();
      console.log(`📝 PATCH Status: ${patchResponse.status}`);
      console.log(`📝 PATCH Response:`, patchResult);
      
      // Test DELETE endpoint (should fail without auth)
      console.log('\n3. Testing DELETE /api/prayers (without auth)...');
      const deleteResponse = await fetch(`${BASE_URL}/api/prayers?id=${prayerId}`, {
        method: 'DELETE'
      });
      
      const deleteResult = await deleteResponse.json();
      console.log(`🗑️ DELETE Status: ${deleteResponse.status}`);
      console.log(`🗑️ DELETE Response:`, deleteResult);
      
    } else {
      console.log('⚠️ No prayers found to test with');
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
  }
}

async function testOwnershipLogic() {
  console.log('\n🔍 Testing Ownership Logic');
  console.log('===========================');
  
  // Test the ownership detection logic
  const testCases = [
    {
      sessionUserId: 'user-123',
      prayerUserId: 'user-123',
      expected: true,
      description: 'Same user IDs'
    },
    {
      sessionUserId: 'user-123', 
      prayerUserId: 'user-456',
      expected: false,
      description: 'Different user IDs'
    },
    {
      sessionUserId: 'user-123',
      prayerUserId: null,
      expected: false,
      description: 'Prayer user ID is null'
    },
    {
      sessionUserId: null,
      prayerUserId: 'user-123',
      expected: false,
      description: 'Session user ID is null'
    },
    {
      sessionUserId: null,
      prayerUserId: null, 
      expected: false,
      description: 'Both user IDs are null'
    }
  ];
  
  testCases.forEach((testCase, index) => {
    // Simulate the isOwner logic from PrayerCard
    const isOwner = testCase.sessionUserId && testCase.prayerUserId && testCase.sessionUserId === testCase.prayerUserId;
    const passed = isOwner === testCase.expected;
    
    console.log(`Test ${index + 1}: ${testCase.description}`);
    console.log(`  Session User ID: ${testCase.sessionUserId}`);
    console.log(`  Prayer User ID: ${testCase.prayerUserId}`);
    console.log(`  Expected: ${testCase.expected}, Got: ${isOwner}`);
    console.log(`  ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
  });
}

// Run tests
(async () => {
  await testApiEndpoints();
  await testOwnershipLogic();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Login as a user');
  console.log('3. Post a prayer');
  console.log('4. Check browser console for debug logs');
  console.log('5. Verify edit/delete buttons appear on your own prayers');
})();