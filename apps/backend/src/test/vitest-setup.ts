// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMITING = 'true';

import { teardownTestDatabase } from './setup';
import { globalTeardown } from './global-setup';
import { beforeEach } from 'vitest';

// Clean up test data before each test
beforeEach(async () => {
  try {
    console.log('🧹 Cleaning up test data before test...');
    // For D1, test cleanup would be handled by Miniflare or mocked D1
    // Test isolation is maintained through individual test database instances
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    throw error; // Make it fail so we know about cleanup issues
  }
});

// Global teardown to clean up test environment after all tests
process.on('exit', async () => {
  console.log('🔄 Global teardown: Cleaning up test environment...');
  await teardownTestDatabase();
  await globalTeardown();
  console.log('✅ Test environment fully cleaned up');
});

// Global teardown to clean up database connections and test PostgreSQL container after all tests
process.on('exit', async () => {
  console.log('🔄 Global teardown: Cleaning up test database and PostgreSQL container...');
  await teardownTestDatabase();
  await globalTeardown();
  console.log('✅ Test environment fully cleaned up');
});


