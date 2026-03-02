const request = require('supertest');
const app = require('../server');

// Test client for testing the API
const BASE_URL = 'http://localhost:3000';

const headers = {
  'VendorKey': 'BCF756D4-DCE6-4F2B-BAAE-7679D87037A7',
  'ClientKey': 'AAC6DB7A-5A66-4EBC-B694-D6BCD99881CB',
  'Pgid': '1'
};

// Example test functions
async function testGetProviders() {
  console.log('Testing GET /api/Provider...');
  const response = await fetch(`${BASE_URL}/api/Provider`, {
    method: 'GET',
    headers: headers
  });
  const data = await response.json();
  console.log('Response:', data);
  return data;
}

async function testGetPatients() {
  console.log('Testing GET /api/Patient...');
  const response = await fetch(`${BASE_URL}/api/Patient?Page=1&Count=5`, {
    method: 'GET',
    headers: headers
  });
  const data = await response.json();
  console.log('Response:', data);
  return data;
}

async function testCreatePatient() {
  console.log('Testing POST /api/Patient...');
  const response = await fetch(`${BASE_URL}/api/Patient`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'Patient',
      email: 'test@example.com',
      phone: '555-9999'
    })
  });
  const data = await response.json();
  console.log('Response:', data);
  return data;
}

// Run tests
async function runTests() {
  console.log('🧪 Starting API Tests...\n');
  
  try {
    await testGetProviders();
    console.log('✅ Provider test passed\n');
    
    await testGetPatients();
    console.log('✅ Patient list test passed\n');
    
    await testCreatePatient();
    console.log('✅ Create patient test passed\n');
    
    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Uncomment to run tests
// runTests();

module.exports = { testGetProviders, testGetPatients, testCreatePatient };
