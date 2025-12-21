import dotenv from 'dotenv';

dotenv.config();

// Set environment variables globally BEFORE any test code runs
process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMITING = 'true';

// Dummy Firebase env vars for tests
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';

export default async function globalSetup() {
  console.log('🔧 Global setup: Preparing test environment for D1...');
  
  // For D1 tests, we'll use Miniflare or local D1 database
  // The actual D1 database setup is handled by Vitest and Wrangler
  console.log('✅ Test environment ready');
}

// Cleanup function for after tests complete
export async function globalTeardown() {
  console.log('🧹 Global teardown: Cleaning up test environment...');
  console.log('✅ Test environment cleaned up');
}
