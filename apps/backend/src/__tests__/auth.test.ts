import { describe, test, expect } from 'vitest';
import { auth, parseResponse } from '../test/utils';
import app from '../app';

describe('Authentication API (Firebase)', () => {
  describe('GET /auth/me', () => {
    test('Returns user profile with valid Firebase ID token', async () => {
      const result = await auth.register();

      expect(result.status).toBe(200);
      expect(result.data.user).toBeDefined();
      expect(result.data.user.email).toBeDefined();
      expect(result.data.user).not.toHaveProperty('password_hash');
      expect(result.accessToken).toBeDefined();
    });

    test('Auto-provisions new user on first sign-in', async () => {
      const email = `new-firebase-user-${Date.now()}@example.com`;
      const result = await auth.register({ email, name: 'New Firebase User' });

      expect(result.status).toBe(200);
      expect(result.data.user.email).toBe(email);
      expect(result.data.user.id).toBeDefined();
    });

    test('Returns same user on subsequent requests with the same token', async () => {
      const first = await auth.register();
      const second = await auth.getMe(first.accessToken);

      expect(second.status).toBe(200);
      expect(second.data.user.id).toBe(first.data.user.id);
      expect(second.data.user.email).toBe(first.data.user.email);
    });

    test('Returns 401 without Authorization header', async () => {
      const result = await auth.getMe();

      expect(result.status).toBe(401);
      expect(result.data.error).toBe('Unauthorized');
    });

    test('Returns 401 with invalid token', async () => {
      const result = await auth.getMe('invalid.token.value');

      expect(result.status).toBe(401);
      expect(result.data.error).toContain('Invalid token');
    });

    test('Returns 401 with empty Bearer token', async () => {
      const res = await app.request('/auth/me', {
        method: 'GET',
        headers: { Authorization: 'Bearer ' },
      });
      const data = await parseResponse(res);

      expect(res.status).toBe(401);
    });

    test('Different users have different IDs', async () => {
      const user1 = await auth.register();
      const user2 = await auth.register();

      expect(user1.data.user.id).not.toBe(user2.data.user.id);
      expect(user1.accessToken).not.toBe(user2.accessToken);
    });

    test('User without password_hash can authenticate', async () => {
      const result = await auth.register({ name: 'No Password User' });

      expect(result.status).toBe(200);
      expect(result.data.user).not.toHaveProperty('password_hash');
    });
  });

  describe('Authorization header enforcement', () => {
    test('Protected API endpoints reject requests without Authorization header', async () => {
      const res = await app.request('/api/boards', {
        method: 'GET',
      });
      expect(res.status).toBe(401);
    });

    test('Protected API endpoints reject requests with invalid token', async () => {
      const res = await app.request('/api/boards', {
        method: 'GET',
        headers: { Authorization: 'Bearer bad-token' },
      });
      expect(res.status).toBe(401);
    });

    test('Protected API endpoints accept valid Firebase ID token', async () => {
      const user = await auth.register();
      const res = await app.request('/api/boards', {
        method: 'GET',
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      expect(res.status).toBe(200);
    });
  });
});

