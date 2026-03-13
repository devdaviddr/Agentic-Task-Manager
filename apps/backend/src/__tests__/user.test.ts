import { describe, test, expect, beforeEach } from 'vitest';
import { auth, testData } from '../test/utils';
import request from 'supertest';
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

    // Manually update admin role in database
    const { getTestPool } = await import('../test/setup');
    const pool = getTestPool();
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', adminUser.data.user.id]);
    adminUser.data.user.role = 'admin';
  });

  describe('GET /api/users', () => {
    test('regular user can get their own profile', async () => {
      const result = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${user1.accessToken}`);

      expect(result.status).toBe(200);
      expect(Array.isArray(result.body)).toBe(true);
      expect(result.body).toHaveLength(1);
      expect(result.body[0].id).toBe(user1.data.user.id);
      expect(result.body[0].email).toBe(user1.data.user.email);
      expect(result.body[0].name).toBe(user1.data.user.name);
      expect(result.body[0].role).toBe('user');
      expect(result.body[0]).not.toHaveProperty('password_hash');
    });

    test('admin can get all users', async () => {
      const result = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      expect(result.status).toBe(200);
      expect(Array.isArray(result.body)).toBe(true);
      expect(result.body.length).toBeGreaterThanOrEqual(3); // At least our 3 test users

      // Check that all users are included
      const userIds = result.body.map((u: any) => u.id);
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

      const { getTestPool } = await import('../test/setup');
      const pool = getTestPool();
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['superadmin', superAdminUser.data.user.id]);

      const result = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${superAdminUser.accessToken}`);

      expect(result.status).toBe(200);
      expect(Array.isArray(result.body)).toBe(true);
      expect(result.body.length).toBeGreaterThanOrEqual(4); // At least our 4 test users
    });

    test('unauthenticated user cannot access users endpoint', async () => {
      const result = await request(app).get('/api/users');

      expect(result.status).toBe(401);
      expect(result.body.error).toBe('Unauthorized - missing token');
    });
  });

  describe('PUT /api/users/:id', () => {
    test('user can update their own name', async () => {
      const updateData = { name: 'Updated Name' };

      const result = await request(app)
        .put(`/api/users/${user1.data.user.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.name).toBe('Updated Name');
      expect(result.body.email).toBe(user1.data.user.email);
      expect(result.body.role).toBe('user');
    });

    test('user can update their own email', async () => {
      const updateData = { email: `updated_${Date.now()}@example.com` };

      const result = await request(app)
        .put(`/api/users/${user1.data.user.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.email).toBe(updateData.email);
    });

    test('user cannot update another user profile', async () => {
      const updateData = { name: 'Hacked Name' };

      const result = await request(app)
        .put(`/api/users/${user2.data.user.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(403);
      expect(result.body.error).toBe('Unauthorized');
    });

    test('user cannot update their role', async () => {
      const updateData = { role: 'admin' };

      const result = await request(app)
        .put(`/api/users/${user1.data.user.id}`)
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(403);
      expect(result.body.error).toBe('Cannot update role through this endpoint');
    });

    test('admin can update their own profile', async () => {
      const updateData = { name: 'Admin Updated Name' };

      const result = await request(app)
        .put(`/api/users/${adminUser.data.user.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.name).toBe('Admin Updated Name');
      expect(result.body.role).toBe('admin');
    });

    test('fails with invalid user ID', async () => {
      const updateData = { name: 'Test Name' };

      const result = await request(app)
        .put('/api/users/invalid')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(403); // User trying to update invalid user ID
    });

    test('fails when user does not exist', async () => {
      const updateData = { name: 'Test Name' };

      const result = await request(app)
        .put('/api/users/99999')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(updateData);

      expect(result.status).toBe(403); // User trying to update non-existent user ID
    });

    test('unauthenticated user cannot update profile', async () => {
      const updateData = { name: 'Hacked Name' };

      const result = await request(app)
        .put(`/api/users/${user1.data.user.id}`)
        .send(updateData);

      expect(result.status).toBe(401);
      expect(result.body.error).toBe('Unauthorized - missing token');
    });
  });
});