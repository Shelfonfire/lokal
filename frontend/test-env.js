/**
 * Test script to verify environment variable reading
 * Usage: node test-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('ENVIRONMENT VARIABLE TEST');
console.log('='.repeat(60));
console.log();

// Check multiple possible env file locations
const possibleEnvFiles = [
  '.env.local',
  '.env',
  '.env.development',
  '.env.production'
];

console.log('Checking for environment files:');
console.log('Current directory:', __dirname);
console.log();

let envFileFound = false;
let envFileContent = '';

for (const envFile of possibleEnvFiles) {
  const envPath = path.join(__dirname, envFile);
  console.log(`Checking: ${envPath}`);
  
  if (fs.existsSync(envPath)) {
    console.log(`  ✓ Found: ${envFile}`);
    envFileFound = true;
    envFileContent = fs.readFileSync(envPath, 'utf8');
    console.log(`  Content preview:`);
    console.log(`  ${envFileContent.split('\n').slice(0, 5).join('\n  ')}`);
    console.log();
    break;
  } else {
    console.log(`  ✗ Not found`);
  }
}

if (!envFileFound) {
  console.log('⚠ No .env file found in frontend directory');
  console.log();
}

// Parse environment variables
console.log('Parsing environment variables:');
console.log('-'.repeat(60));

const envVars = {};

if (envFileContent) {
  envFileContent.split('\n').forEach((line, index) => {
    // Skip comments and empty lines
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }
    
    // Match KEY=VALUE pattern
    const match = trimmedLine.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      value = value.replace(/^["']|["']$/g, '');
      
      envVars[key] = value;
      console.log(`Line ${index + 1}: ${key} = ${value}`);
    } else if (trimmedLine) {
      console.log(`Line ${index + 1}: ⚠ Could not parse: ${trimmedLine}`);
    }
  });
}

console.log('-'.repeat(60));
console.log();

// Check for NEXT_PUBLIC_API_URL
console.log('Environment Variable Check:');
console.log('-'.repeat(60));

// Check from parsed file
if (envVars.NEXT_PUBLIC_API_URL) {
  console.log(`✓ Found in env file: NEXT_PUBLIC_API_URL = ${envVars.NEXT_PUBLIC_API_URL}`);
} else {
  console.log(`✗ NOT FOUND in env file: NEXT_PUBLIC_API_URL`);
}

// Check from process.env (might be set externally)
if (process.env.NEXT_PUBLIC_API_URL) {
  console.log(`✓ Found in process.env: NEXT_PUBLIC_API_URL = ${process.env.NEXT_PUBLIC_API_URL}`);
} else {
  console.log(`✗ NOT FOUND in process.env: NEXT_PUBLIC_API_URL`);
}

console.log('-'.repeat(60));
console.log();

// Final value
const API_URL = envVars.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('Final API_URL value:');
console.log(`  ${API_URL}`);
console.log();

// Expected value check
const expectedUrl = 'lokal-production.up.railway.app';
if (API_URL.includes(expectedUrl)) {
  console.log(`✓ SUCCESS: API_URL contains expected domain "${expectedUrl}"`);
} else {
  console.log(`✗ WARNING: API_URL does not contain expected domain "${expectedUrl}"`);
  console.log(`  Expected something like: https://${expectedUrl}`);
  console.log(`  Got: ${API_URL}`);
}

console.log();
console.log('='.repeat(60));


