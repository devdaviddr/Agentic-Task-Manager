import { describe, test, expect, beforeEach } from 'vitest';
import { auth, testData } from '../test/utils';
import request from 'supertest';
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

    // Manually update roles in database (since we can't do this through API yet)
    const { getTestPool } = await import('../test/setup');
    const pool = getTestPool();

    await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', adminUser.data.user.id]);
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['superadmin', superAdminUser.data.user.id]);

    // Refresh user data
    adminUser.data.user.role = 'admin';
    superAdminUser.data.user.role = 'superadmin';
  });

  describe('GET /api/admin/users', () => {
    test('admin can get all users', async () => {
      const result = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      expect(result.status).toBe(200);
      expect(Array.isArray(result.body)).toBe(true);
      expect(result.body.length).toBeGreaterThanOrEqual(3); // At least our 3 test users

      // Check that user data includes required fields
      const user = result.body.find((u: any) => u.id === adminUser.data.user.id);
      expect(user).toBeDefined();
      expect(user.email).toBe(adminUser.data.user.email);
      expect(user.name).toBe(adminUser.data.user.name);
      expect(user.role).toBe('admin');
      expect(user).not.toHaveProperty('password_hash');
    });

    test('superadmin can get all users', async () => {
      const result = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${superAdminUser.accessToken}`);

      expect(result.status).toBe(200);
      expect(Array.isArray(result.body)).toBe(true);
      expect(result.body.length).toBeGreaterThanOrEqual(3);
    });

    test('regular user cannot access admin endpoint', async () => {
      const result = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularUser.accessToken}`);

      expect(result.status).toBe(403);
      expect(result.body.error).toContain('Insufficient permissions');
    });

    test('unauthenticated user cannot access admin endpoint', async () => {
      const result = await request(app).get('/api/admin/users');

      expect(result.status).toBe(401);
      expect(result.body.error).toBe('Unauthorized - missing token');
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    test('admin can update user name', async () => {
      const updateData = { name: 'Updated by Admin' };

      const result = await request(app)
        .put(`/api/admin/users/${regularUser.data.user.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.name).toBe('Updated by Admin');
      expect(result.body.email).toBe(regularUser.data.user.email);
    });

    test('admin can update user email', async () => {
      const updateData = { email: `updated_${Date.now()}@example.com` };

      const result = await request(app)
        .put(`/api/admin/users/${regularUser.data.user.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.email).toBe(updateData.email);
    });

    test('admin cannot update user role to superadmin', async () => {
      const updateData = { role: 'superadmin' };

      const result = await request(app)
        .put(`/api/admin/users/${regularUser.data.user.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(403);
      expect(result.body.error).toContain('Insufficient permissions');
    });

    test('admin cannot update their own role', async () => {
      const updateData = { role: 'superadmin' };

      const result = await request(app)
        .put(`/api/admin/users/${adminUser.data.user.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(403);
      expect(result.body.error).toContain('Insufficient permissions');
    });

    test('superadmin can update user role to admin', async () => {
      const updateData = { role: 'admin' };

      const result = await request(app)
        .put(`/api/admin/users/${regularUser.data.user.id}`)
        .set('Authorization', `Bearer ${superAdminUser.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.role).toBe('admin');
    });

    test('superadmin can update user role to superadmin', async () => {
      const updateData = { role: 'superadmin' };

      const result = await request(app)
        .put(`/api/admin/users/${regularUser.data.user.id}`)
        .set('Authorization', `Bearer ${superAdminUser.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.role).toBe('superadmin');
    });

    test('fails with invalid user ID', async () => {
      const updateData = { name: 'Test Name' };

      const result = await request(app)
        .put('/api/admin/users/invalid')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(400);
      expect(result.body.error).toBe('Invalid user ID');
    });

    test('fails when no fields provided', async () => {
      const result = await request(app)
        .put(`/api/admin/users/${regularUser.data.user.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send({});

      expect(result.status).toBe(400);
      expect(result.body.error).toContain('At least one field must be provided');
    });

    test('fails with invalid role', async () => {
      const updateData = { role: 'invalid_role' };

      const result = await request(app)
        .put(`/api/admin/users/${regularUser.data.user.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(400);
      expect(result.body.error).toBe('Invalid role');
    });

    test('regular user cannot update users', async () => {
      const updateData = { name: 'Hacked Name' };

      const result = await request(app)
        .put(`/api/admin/users/${regularUser.data.user.id}`)
        .set('Authorization', `Bearer ${regularUser.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(403);
      expect(result.body.error).toContain('Insufficient permissions');
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    test('superadmin can delete user', async () => {
      const result = await request(app)
        .delete(`/api/admin/users/${regularUser.data.user.id}`)
        .set('Authorization', `Bearer ${superAdminUser.accessToken}`);

      expect(result.status).toBe(200);
      expect(result.body.message).toBe('User deleted successfully');
    });

    test('admin cannot delete users', async () => {
      const result = await request(app)
        .delete(`/api/admin/users/${regularUser.data.user.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      expect(result.status).toBe(403);
      expect(result.body.error).toContain('Insufficient permissions');
    });

    test('superadmin cannot delete themselves', async () => {
      const result = await request(app)
        .delete(`/api/admin/users/${superAdminUser.data.user.id}`)
        .set('Authorization', `Bearer ${superAdminUser.accessToken}`);

      expect(result.status).toBe(400);
      expect(result.body.error).toContain('Cannot delete your own account');
    });

    test('fails with invalid user ID', async () => {
      const result = await request(app)
        .delete('/api/admin/users/invalid')
        .set('Authorization', `Bearer ${superAdminUser.accessToken}`);

      expect(result.status).toBe(400);
      expect(result.body.error).toBe('Invalid user ID');
    });

    test('regular user cannot delete users', async () => {
      const result = await request(app)
        .delete(`/api/admin/users/${regularUser.data.user.id}`)
        .set('Authorization', `Bearer ${regularUser.accessToken}`);

      expect(result.status).toBe(403);
      expect(result.body.error).toContain('Insufficient permissions');
    });
  });
});