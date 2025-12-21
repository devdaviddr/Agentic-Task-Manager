import { describe, test, expect, beforeEach } from 'vitest';
import { UserModel } from '../models/User';
import { getTestPool } from '../test/setup';

describe('User Model', () => {
  let testUserId: number;
  const testFirebaseUid = 'test-firebase-uid-123';

  beforeEach(async () => {
    // Clean up test data
    const pool = getTestPool();
    await pool.query('DELETE FROM users');

    // Create a test user for update/delete tests
    const result = await pool.query(`
      INSERT INTO users (email, firebase_uid, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, ['test@example.com', testFirebaseUid, 'Test User', 'user']);
    testUserId = result.rows[0].id;
  });

  describe('findByEmail', () => {
    test('returns user when email exists', async () => {
      const user = await UserModel.findByEmail('test@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
      expect(user?.name).toBe('Test User');
      expect(user?.role).toBe('user');
      expect(user?.firebase_uid).toBe(testFirebaseUid);
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('created_at');
      expect(user).toHaveProperty('updated_at');
    });

    test('returns null when email does not exist', async () => {
      const user = await UserModel.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    test('returns user when id exists', async () => {
      const user = await UserModel.findById(testUserId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.email).toBe('test@example.com');
      expect(user?.name).toBe('Test User');
      expect(user?.role).toBe('user');
      expect(user?.firebase_uid).toBe(testFirebaseUid);
    });

    test('returns null when id does not exist', async () => {
      const user = await UserModel.findById(99999);

      expect(user).toBeNull();
    });
  });

  describe('findByFirebaseUid', () => {
    test('returns user when Firebase UID exists', async () => {
      const user = await UserModel.findByFirebaseUid(testFirebaseUid);

      expect(user).toBeDefined();
      expect(user?.firebase_uid).toBe(testFirebaseUid);
      expect(user?.email).toBe('test@example.com');
      expect(user?.name).toBe('Test User');
      expect(user?.role).toBe('user');
    });

    test('returns null when Firebase UID does not exist', async () => {
      const user = await UserModel.findByFirebaseUid('nonexistent-uid');

      expect(user).toBeNull();
    });
  });

  describe('findAll', () => {
    test('returns all users', async () => {
      // Create another user
      const anotherUid = 'another-firebase-uid';
      await getTestPool().query(`
        INSERT INTO users (email, firebase_uid, name, role)
        VALUES ($1, $2, $3, $4)
      `, ['another@example.com', anotherUid, 'Another User', 'admin']);

      const users = await UserModel.findAll();

      expect(users).toHaveLength(2);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).toHaveProperty('firebase_uid');
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('role');

      // Check that both users are present
      const emails = users.map(u => u.email).sort();
      expect(emails).toEqual(['another@example.com', 'test@example.com']);
    });

    test('returns empty array when no users exist', async () => {
      // Clean up all users
      await getTestPool().query('DELETE FROM users');

      const users = await UserModel.findAll();

      expect(users).toEqual([]);
    });
  });

  describe('createFromFirebase', () => {
    test('creates a new user successfully', async () => {
      const firebaseUid = 'new-firebase-uid';
      const email = 'newuser@example.com';
      const name = 'New User';

      const user = await UserModel.createFromFirebase(firebaseUid, email, name);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.firebase_uid).toBe(firebaseUid);
      expect(user.name).toBe(name);
      expect(user.role).toBe('user');
      expect(user).toHaveProperty('created_at');
      expect(user).toHaveProperty('updated_at');
    });

    test('creates user with null name', async () => {
      const firebaseUid = 'no-name-uid';
      const email = 'noname@example.com';

      const user = await UserModel.createFromFirebase(firebaseUid, email);

      expect(user.name).toBeNull();
    });
  });

  describe('updateFirebaseUid', () => {
    test('updates Firebase UID for existing user', async () => {
      const newFirebaseUid = 'updated-firebase-uid';
      const email = 'test@example.com';

      const updatedUser = await UserModel.updateFirebaseUid(email, newFirebaseUid);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firebase_uid).toBe(newFirebaseUid);
      expect(updatedUser?.email).toBe(email);
      expect(updatedUser?.id).toBe(testUserId);
    });

    test('returns null when email does not exist', async () => {
      const updatedUser = await UserModel.updateFirebaseUid('nonexistent@example.com', 'some-uid');

      expect(updatedUser).toBeNull();
    });
  });

  describe('update', () => {
    test('updates user name successfully', async () => {
      const updateData = { name: 'Updated Name' };

      const updatedUser = await UserModel.update(testUserId, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.id).toBe(testUserId);
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.email).toBe('test@example.com');
      expect(updatedUser?.role).toBe('user');
    });

    test('updates user email successfully', async () => {
      const updateData = { email: 'updated@example.com' };

      const updatedUser = await UserModel.update(testUserId, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.email).toBe('updated@example.com');
    });

    test('updates user role successfully', async () => {
      const updateData = { role: 'admin' as const };

      const updatedUser = await UserModel.update(testUserId, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.role).toBe('admin');
    });

    test('updates multiple fields successfully', async () => {
      const updateData = {
        name: 'Multi Update',
        email: 'multi@example.com',
        role: 'superadmin' as const
      };

      const updatedUser = await UserModel.update(testUserId, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Multi Update');
      expect(updatedUser?.email).toBe('multi@example.com');
      expect(updatedUser?.role).toBe('superadmin');
    });

    test('returns null when no fields to update', async () => {
      const updatedUser = await UserModel.update(testUserId, {});

      expect(updatedUser).toBeNull();
    });

    test('returns null when user does not exist', async () => {
      const updateData = { name: 'Non-existent User' };

      const updatedUser = await UserModel.update(99999, updateData);

      expect(updatedUser).toBeNull();
    });
  });

  describe('delete', () => {
    test('deletes existing user successfully', async () => {
      const result = await UserModel.delete(testUserId);

      expect(result).toBe(true);

      // Verify user was deleted
      const user = await UserModel.findById(testUserId);
      expect(user).toBeNull();
    });

    test('returns false when user does not exist', async () => {
      const result = await UserModel.delete(99999);

      expect(result).toBe(false);
    });
  });
});