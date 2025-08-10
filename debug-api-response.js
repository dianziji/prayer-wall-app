// Quick API response debugging script
// Run with: node debug-api-response.js

const fetch = require('node-fetch');

async function debugApiResponse() {
  try {
    const response = await fetch('http://localhost:3000/api/prayers?week_start=2025-08-10');
    const data = await response.json();
    
    console.log('🔍 API Response Status:', response.status);
    console.log('🔍 API Response Data Length:', Array.isArray(data) ? data.length : 'Not an array');
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('🔍 First Prayer Object Structure:');
      console.log(JSON.stringify(data[0], null, 2));
      
      console.log('🔍 User ID Analysis:');
      data.forEach((prayer, index) => {
        console.log(`Prayer ${index + 1}:`, {
          id: prayer.id,
          user_id: prayer.user_id,
          user_id_type: typeof prayer.user_id,
          user_id_truthy: !!prayer.user_id,
          author_name: prayer.author_name
        });
      });
    } else {
      console.log('🔍 No prayers found or invalid response format');
    }
  } catch (error) {
    console.error('🔍 API Error:', error.message);
  }
}

debugApiResponse();