// Set test database URL BEFORE importing anything else
// Only set if not already set by global-setup.ts
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/taskmanager_test';
}
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMITING = 'true';
process.env.FIREBASE_PROJECT_ID = 'test-project';

import { getTestPool, teardownTestDatabase } from './setup';
import { globalTeardown } from './global-setup';
import { beforeAll, beforeEach } from 'vitest';
import { FirebaseAdminService } from '../services/FirebaseAdminService';
import type { DecodedIdToken } from 'firebase-admin/auth';

// Install Firebase test token override:
// Tokens of the form "test-firebase-token:{uid}:{email}:{name}" bypass real Firebase verification.
beforeAll(() => {
  FirebaseAdminService._setTestVerifyOverride(async (token: string) => {
    if (token.startsWith('test-firebase-token:')) {
      const rest = token.slice('test-firebase-token:'.length);
      const colonIdx = rest.indexOf(':');
      const uid = colonIdx === -1 ? rest : rest.slice(0, colonIdx);
      const afterUid = colonIdx === -1 ? '' : rest.slice(colonIdx + 1);
      const colonIdx2 = afterUid.indexOf(':');
      const email = colonIdx2 === -1 ? afterUid : afterUid.slice(0, colonIdx2);
      const name = colonIdx2 === -1 ? undefined : afterUid.slice(colonIdx2 + 1);
      return {
        uid,
        email: email || `${uid}@test.example.com`,
        name: name || 'Test User',
        aud: 'test-project',
        auth_time: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        iss: 'https://securetoken.google.com/test-project',
        sub: uid,
        firebase: { identities: {}, sign_in_provider: 'google.com' },
      } as unknown as DecodedIdToken;
    }
    return null;
  });
});

// Clean up test data before each test
beforeEach(async () => {
  try {
    console.log('🧹 Cleaning up test data before test...');
    const testPool = getTestPool();
    // Use TRUNCATE with CASCADE to ensure clean slate
    await testPool.query(`
      TRUNCATE TABLE
        item_tags,
        item_users,
        items,
        tasks,
        columns,
        tags,
        board_users,
        boards,
        invalidated_tokens,
        refresh_tokens,
        users
      CASCADE
    `);
    console.log('✅ Test data cleaned up');

    // Verify invalidated_tokens is empty
    const result = await testPool.query('SELECT COUNT(*) as count FROM invalidated_tokens');
    console.log(`🔍 Invalidated tokens count after cleanup: ${result.rows[0].count}`);
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    throw error; // Make it fail so we know about cleanup issues
  }
});

// Global teardown to clean up database connections and test PostgreSQL container after all tests
process.on('exit', async () => {
  console.log('🔄 Global teardown: Cleaning up test database and PostgreSQL container...');
  await teardownTestDatabase();
  await globalTeardown();
  console.log('✅ Test environment fully cleaned up');
});



