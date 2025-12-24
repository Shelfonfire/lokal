/**
 * Quick script to test connection to the backend API
 * Usage: node test-api.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from multiple possible env files
const possibleEnvFiles = ['.env.local', '.env', '.env.development', '.env.production'];

for (const envFile of possibleEnvFiles) {
  const envPath = path.join(__dirname, envFile);
  if (fs.existsSync(envPath)) {
    const envFileContent = fs.readFileSync(envPath, 'utf8');
    envFileContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }
      
      const match = trimmedLine.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    break; // Use first file found
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('='.repeat(60));
console.log('BACKEND API CONNECTION TEST');
console.log('='.repeat(60));
console.log();
console.log(`Server URL: ${API_URL}`);
console.log();

async function testConnection() {
  try {
    console.log('Testing /health endpoint...');
    const healthResponse = await fetch(`${API_URL}/health`);
    
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.statusText}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✓ Health check passed:', healthData);
    console.log();

    console.log('Testing / endpoint...');
    const rootResponse = await fetch(`${API_URL}/`);
    
    if (!rootResponse.ok) {
      throw new Error(`Root endpoint failed: ${rootResponse.status} ${rootResponse.statusText}`);
    }
    
    const rootData = await rootResponse.json();
    console.log('✓ Root endpoint response:', rootData);
    console.log();

    console.log('Testing /businesses endpoint...');
    const businessesResponse = await fetch(`${API_URL}/businesses`);
    
    if (!businessesResponse.ok) {
      throw new Error(`Businesses endpoint failed: ${businessesResponse.status} ${businessesResponse.statusText}`);
    }
    
    const businessesData = await businessesResponse.json();
    console.log(`✓ Businesses endpoint successful - Found ${businessesData.length} businesses`);
    
    if (businessesData.length > 0) {
      console.log('Sample business:', JSON.stringify(businessesData[0], null, 2));
    }
    
    console.log();
    console.log('='.repeat(60));
    console.log('✓ ALL TESTS PASSED - Backend API is working!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error();
    console.error('='.repeat(60));
    console.error('✗ CONNECTION FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error();
    console.error('Troubleshooting:');
    console.error('1. Check that NEXT_PUBLIC_API_URL is set in .env.local');
    console.error('2. Verify the backend server is running');
    console.error('3. Check CORS settings on the backend');
    console.error('4. Verify the URL is correct:', API_URL);
    process.exit(1);
  }
}

testConnection();

