import { describe, test, expect, beforeEach } from 'vitest';
import { auth, testData, parseResponse } from '../test/utils';
import app from '../app';

describe('User Profile API', () => {
  let user1: any;
  let user2: any;
  let adminUser: any;

  beforeEach(async () => {
    // Create test users
    user1 = await auth.register({
      ...testData.validUser,
      email: `user1_${Date.now()}@example.com`,
      name: 'User One'
    });

    user2 = await auth.register({
      ...testData.validUser,
      email: `user2_${Date.now()}@example.com`,
      name: 'User Two'
    });

    adminUser = await auth.register({
      ...testData.validUser,
      email: `admin_${Date.now()}@example.com`,
      name: 'Admin User'
    });

    // Note: In D1 tests, we'll assume role updates are handled through API
    // For testing purposes, we'll modify the user object directly
    adminUser.data.user.role = 'admin';
  });

  describe('GET /api/users', () => {
    test('regular user can get their own profile', async () => {
      const result = await app.request('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user1.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(result.status).toBe(200);
      const data = await parseResponse(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe(user1.data.user.id);
      expect(data[0].email).toBe(user1.data.user.email);
      expect(data[0].name).toBe(user1.data.user.name);
      expect(data[0].role).toBe('user');
      expect(data[0]).not.toHaveProperty('password_hash');
    });

    test('admin can get all users', async () => {
      const result = await app.request('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminUser.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(result.status).toBe(200);
      const data = await parseResponse(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(3); // At least our 3 test users

      // Check that all users are included
      const userIds = data.map((u: any) => u.id);
      expect(userIds).toContain(user1.data.user.id);
      expect(userIds).toContain(user2.data.user.id);
      expect(userIds).toContain(adminUser.data.user.id);
    });

    test('superadmin can get all users', async () => {
      // Create superadmin user
      const superAdminUser = await auth.register({
        ...testData.validUser,
        email: `superadmin_${Date.now()}@example.com`,
        name: 'Super Admin'
      });

      // For D1 tests, we'll modify the user object role directly
      superAdminUser.data.user.role = 'superadmin';

      const result = await app.request('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${superAdminUser.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(result.status).toBe(200);
      const data = await parseResponse(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(4); // At least our 4 test users
    });

    test('unauthenticated user cannot access users endpoint', async () => {
      const result = await app.request('/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(result.status).toBe(401);
      const data = await parseResponse(result);
      expect(data.error).toBe('Unauthorized - missing token');
    });
  });

  describe('PUT /api/users/:id', () => {
    test('user can update their own name', async () => {
      const updateData = { name: 'Updated Name' };

      const result = await app.request(`/api/users/${user1.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user1.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(200);
      const data = await parseResponse(result);
      expect(data.name).toBe('Updated Name');
      expect(data.email).toBe(user1.data.user.email);
      expect(data.role).toBe('user');
    });

    test('user can update their own email', async () => {
      const updateData = { email: `updated_${Date.now()}@example.com` };

      const result = await app.request(`/api/users/${user1.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user1.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(200);
      const data = await parseResponse(result);
      expect(data.email).toBe(updateData.email);
    });

    test('user cannot update another user profile', async () => {
      const updateData = { name: 'Hacked Name' };

      const result = await app.request(`/api/users/${user2.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user1.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(403);
      const data = await parseResponse(result);
      expect(data.error).toBe('Unauthorized');
    });

    test('user cannot update their role', async () => {
      const updateData = { role: 'admin' };

      const result = await app.request(`/api/users/${user1.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user1.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(403);
      const data = await parseResponse(result);
      expect(data.error).toBe('Cannot update role through this endpoint');
    });

    test('admin can update their own profile', async () => {
      const updateData = { name: 'Admin Updated Name' };

      const result = await app.request(`/api/users/${adminUser.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminUser.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(200);
      const data = await parseResponse(result);
      expect(data.name).toBe('Admin Updated Name');
      expect(data.role).toBe('admin');
    });

    test('fails with invalid user ID', async () => {
      const updateData = { name: 'Test Name' };

      const result = await app.request('/api/users/invalid', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user1.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(403); // User trying to update invalid user ID
    });

    test('fails when user does not exist', async () => {
      const updateData = { name: 'Test Name' };

      const result = await app.request('/api/users/99999', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user1.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(403); // User trying to update non-existent user ID
    });

    test('unauthenticated user cannot update profile', async () => {
      const updateData = { name: 'Hacked Name' };

      const result = await app.request(`/api/users/${user1.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(401);
      const data = await parseResponse(result);
      expect(data.error).toBe('Unauthorized - missing token');
    });
  });
});