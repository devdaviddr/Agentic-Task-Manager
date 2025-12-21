import { describe, test, expect, beforeEach } from 'vitest';
import { auth, testData, parseResponse } from '../test/utils';
import app from '../app';

describe('Admin User Management API', () => {
  let adminUser: any;
  let regularUser: any;
  let superAdminUser: any;

  beforeEach(async () => {
    // Create test users with different roles
    adminUser = await auth.register({
      ...testData.validUser,
      email: `admin_${Date.now()}@example.com`,
      name: 'Admin User'
    });

    regularUser = await auth.register({
      ...testData.validUser,
      email: `regular_${Date.now()}@example.com`,
      name: 'Regular User'
    });

    superAdminUser = await auth.register({
      ...testData.validUser,
      email: `superadmin_${Date.now()}@example.com`,
      name: 'Super Admin User'
    });

    // Note: For D1 tests, we'll modify the user object roles directly
    // In a real scenario, roles would be set through an admin API
    adminUser.data.user.role = 'admin';
    superAdminUser.data.user.role = 'superadmin';
  });

  describe('GET /api/admin/users', () => {
    test('admin can get all users', async () => {
      const result = await app.request('/api/admin/users', {
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

      // Check that user data includes required fields
      const user = data.find((u: any) => u.id === adminUser.data.user.id);
      expect(user).toBeDefined();
      expect(user.email).toBe(adminUser.data.user.email);
      expect(user.name).toBe(adminUser.data.user.name);
      expect(user.role).toBe('admin');
      expect(user).not.toHaveProperty('password_hash');
    });

    test('superadmin can get all users', async () => {
      const result = await app.request('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${superAdminUser.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(result.status).toBe(200);
      const data = await parseResponse(result);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(3);
    });

    test('regular user cannot access admin endpoint', async () => {
      const result = await app.request('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${regularUser.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(result.status).toBe(403);
      const data = await parseResponse(result);
      expect(data.error).toContain('Insufficient permissions');
    });

    test('unauthenticated user cannot access admin endpoint', async () => {
      const result = await app.request('/api/admin/users', {
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

  describe('PUT /api/admin/users/:id', () => {
    test('admin can update user name', async () => {
      const updateData = { name: 'Updated by Admin' };

      const result = await app.request(`/api/admin/users/${regularUser.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminUser.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(200);
      const data = await parseResponse(result);
      expect(data.name).toBe('Updated by Admin');
      expect(data.email).toBe(regularUser.data.user.email);
    });

    test('admin can update user email', async () => {
      const updateData = { email: `updated_${Date.now()}@example.com` };

      const result = await app.request(`/api/admin/users/${regularUser.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminUser.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(200);
      const data = await parseResponse(result);
      expect(data.email).toBe(updateData.email);
    });

    test('admin cannot update user role to superadmin', async () => {
      const updateData = { role: 'superadmin' };

      const result = await app.request(`/api/admin/users/${regularUser.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminUser.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(403);
      const data = await parseResponse(result);
      expect(data.error).toContain('Insufficient permissions');
    });

    test('admin cannot update their own role', async () => {
      const updateData = { role: 'superadmin' };

      const result = await app.request(`/api/admin/users/${adminUser.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminUser.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(403);
      const data = await parseResponse(result);
      expect(data.error).toContain('Insufficient permissions');
    });

    test('superadmin can update user role to admin', async () => {
      const updateData = { role: 'admin' };

      const result = await app.request(`/api/admin/users/${regularUser.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${superAdminUser.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(200);
      const data = await parseResponse(result);
      expect(data.role).toBe('admin');
    });

    test('superadmin can update user role to superadmin', async () => {
      const updateData = { role: 'superadmin' };

      const result = await app.request(`/api/admin/users/${regularUser.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${superAdminUser.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(200);
      const data = await parseResponse(result);
      expect(data.role).toBe('superadmin');
    });

    test('fails with invalid user ID', async () => {
      const updateData = { name: 'Test Name' };

      const result = await app.request('/api/admin/users/invalid', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminUser.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(400);
      const data = await parseResponse(result);
      expect(data.error).toBe('Invalid user ID');
    });

    test('fails when no fields provided', async () => {
      const result = await app.request(`/api/admin/users/${regularUser.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminUser.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      expect(result.status).toBe(400);
      const data = await parseResponse(result);
      expect(data.error).toContain('At least one field must be provided');
    });

    test('fails with invalid role', async () => {
      const updateData = { role: 'invalid_role' };

      const result = await app.request(`/api/admin/users/${regularUser.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminUser.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(400);
      const data = await parseResponse(result);
      expect(data.error).toBe('Invalid role');
    });

    test('regular user cannot update users', async () => {
      const updateData = { name: 'Hacked Name' };

      const result = await app.request(`/api/admin/users/${regularUser.data.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${regularUser.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      expect(result.status).toBe(403);
      const data = await parseResponse(result);
      expect(data.error).toContain('Insufficient permissions');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    test('superadmin can delete user', async () => {
      const result = await app.request(`/api/admin/users/${regularUser.data.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${superAdminUser.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(result.status).toBe(200);
      const data = await parseResponse(result);
      expect(data.message).toBe('User deleted successfully');
    });

    test('admin cannot delete users', async () => {
      const result = await app.request(`/api/admin/users/${regularUser.data.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminUser.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(result.status).toBe(403);
      const data = await parseResponse(result);
      expect(data.error).toContain('Insufficient permissions');
    });

    test('superadmin cannot delete themselves', async () => {
      const result = await app.request(`/api/admin/users/${superAdminUser.data.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${superAdminUser.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(result.status).toBe(400);
      const data = await parseResponse(result);
      expect(data.error).toContain('Cannot delete your own account');
    });

    test('fails with invalid user ID', async () => {
      const result = await app.request('/api/admin/users/invalid', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${superAdminUser.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(result.status).toBe(400);
      const data = await parseResponse(result);
      expect(data.error).toBe('Invalid user ID');
    });

    test('regular user cannot delete users', async () => {
      const result = await app.request(`/api/admin/users/${regularUser.data.user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${regularUser.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      expect(result.status).toBe(403);
      const data = await parseResponse(result);
      expect(data.error).toContain('Insufficient permissions');
    });
  });
});