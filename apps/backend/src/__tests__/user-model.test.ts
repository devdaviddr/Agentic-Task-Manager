import { describe, test, expect, beforeEach } from 'vitest';
import { UserModel } from '../models/User';

describe('User Model', () => {
  let testUserId: number;
  const testFirebaseUid = 'test-firebase-uid-123';
  
  // Mock D1 Database for testing
  const mockDb = {
    prepare: (query: string) => ({
      bind: (...params: any[]) => ({
        first: async () => {
          // Mock responses for different query patterns
          if (query.includes('SELECT') && query.includes('email = ?')) {
            if (params[0] === 'test@example.com') {
              return {
                id: 1,
                email: 'test@example.com',
                firebase_uid: testFirebaseUid,
                name: 'Test User',
                role: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
            }
            return null;
          }
          if (query.includes('SELECT') && query.includes('id = ?')) {
            if (params[0] === 1) {
              return {
                id: 1,
                email: 'test@example.com',
                firebase_uid: testFirebaseUid,
                name: 'Test User',
                role: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
            }
            return null;
          }
          if (query.includes('SELECT') && query.includes('firebase_uid = ?')) {
            if (params[0] === testFirebaseUid) {
              return {
                id: 1,
                email: 'test@example.com',
                firebase_uid: testFirebaseUid,
                name: 'Test User',
                role: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
            }
            return null;
          }
          if (query.includes('INSERT') && query.includes('RETURNING')) {
            return {
              id: Math.floor(Math.random() * 1000) + 100,
              email: params[1],
              firebase_uid: params[0],
              name: params[2] || null,
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
          if (query.includes('UPDATE') && query.includes('SET firebase_uid')) {
            if (params[1] === 'test@example.com') {
              return {
                id: 1,
                email: 'test@example.com',
                firebase_uid: params[0],
                name: 'Test User',
                role: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
            }
            return null;
          }
          if (query.includes('UPDATE') && query.includes('WHERE id = ?')) {
            if (params[params.length - 1] === 1) {
              return {
                id: 1,
                email: 'test@example.com',
                firebase_uid: testFirebaseUid,
                name: 'Updated Name',
                role: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
            }
            return null;
          }
          return null;
        },
        all: async () => {
          if (query.includes('SELECT') && !query.includes('WHERE')) {
            return [
              {
                id: 1,
                email: 'test@example.com',
                firebase_uid: testFirebaseUid,
                name: 'Test User',
                role: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              {
                id: 2,
                email: 'another@example.com',
                firebase_uid: 'another-firebase-uid',
                name: 'Another User',
                role: 'admin',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ];
          }
          return [];
        }
      }),
      run: async () => ({ 
        success: true, 
        changes: 1,
        meta: { changed_db: false, changes: 1, last_row_id: 1, duration: 0.1 }
      })
    }),
    exec: async () => ({ success: true })
  } as any;

  beforeEach(async () => {
    testUserId = 1;
  });

  describe('findByEmail', () => {
    test('returns user when email exists', async () => {
      const user = await UserModel.findByEmail(mockDb, 'test@example.com');

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
      const user = await UserModel.findByEmail(mockDb, 'nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    test('returns user when id exists', async () => {
      const user = await UserModel.findById(mockDb, testUserId);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.email).toBe('test@example.com');
      expect(user?.name).toBe('Test User');
      expect(user?.role).toBe('user');
      expect(user?.firebase_uid).toBe(testFirebaseUid);
    });

    test('returns null when id does not exist', async () => {
      const user = await UserModel.findById(mockDb, 99999);

      expect(user).toBeNull();
    });
  });

  describe('findByFirebaseUid', () => {
    test('returns user when Firebase UID exists', async () => {
      const user = await UserModel.findByFirebaseUid(mockDb, testFirebaseUid);

      expect(user).toBeDefined();
      expect(user?.firebase_uid).toBe(testFirebaseUid);
      expect(user?.email).toBe('test@example.com');
      expect(user?.name).toBe('Test User');
      expect(user?.role).toBe('user');
    });

    test('returns null when Firebase UID does not exist', async () => {
      const user = await UserModel.findByFirebaseUid(mockDb, 'nonexistent-uid');

      expect(user).toBeNull();
    });
  });

  describe('findAll', () => {
    test('returns all users', async () => {
      const users = await UserModel.findAll(mockDb);

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
      // Create a mock that returns empty array
      const emptyMockDb = {
        prepare: () => ({
          bind: () => ({
            all: async () => []
          })
        })
      } as any;

      const users = await UserModel.findAll(emptyMockDb);

      expect(users).toEqual([]);
    });
  });

  describe('createFromFirebase', () => {
    test('creates a new user successfully', async () => {
      const firebaseUid = 'new-firebase-uid';
      const email = 'newuser@example.com';
      const name = 'New User';

      const user = await UserModel.createFromFirebase(mockDb, firebaseUid, email, name);

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

      const user = await UserModel.createFromFirebase(mockDb, firebaseUid, email);

      expect(user.name).toBeNull();
    });
  });

  describe('updateFirebaseUid', () => {
    test('updates Firebase UID for existing user', async () => {
      const newFirebaseUid = 'updated-firebase-uid';
      const email = 'test@example.com';

      const updatedUser = await UserModel.updateFirebaseUid(mockDb, email, newFirebaseUid);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firebase_uid).toBe(newFirebaseUid);
      expect(updatedUser?.email).toBe(email);
      expect(updatedUser?.id).toBe(testUserId);
    });

    test('returns null when email does not exist', async () => {
      const updatedUser = await UserModel.updateFirebaseUid(mockDb, 'nonexistent@example.com', 'some-uid');

      expect(updatedUser).toBeNull();
    });
  });

  describe('update', () => {
    test('updates user name successfully', async () => {
      const updateData = { name: 'Updated Name' };

      const updatedUser = await UserModel.update(mockDb, testUserId, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.id).toBe(testUserId);
      expect(updatedUser?.name).toBe('Updated Name');
      expect(updatedUser?.email).toBe('test@example.com');
      expect(updatedUser?.role).toBe('user');
    });

    test('updates user email successfully', async () => {
      const updateData = { email: 'updated@example.com' };

      const updatedUser = await UserModel.update(mockDb, testUserId, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.email).toBe('updated@example.com');
    });

    test('updates user role successfully', async () => {
      const updateData = { role: 'admin' as const };

      const updatedUser = await UserModel.update(mockDb, testUserId, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.role).toBe('admin');
    });

    test('updates multiple fields successfully', async () => {
      const updateData = {
        name: 'Multi Update',
        email: 'multi@example.com',
        role: 'superadmin' as const
      };

      const updatedUser = await UserModel.update(mockDb, testUserId, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.name).toBe('Multi Update');
      expect(updatedUser?.email).toBe('multi@example.com');
      expect(updatedUser?.role).toBe('superadmin');
    });

    test('returns null when no fields to update', async () => {
      const updatedUser = await UserModel.update(mockDb, testUserId, {});

      expect(updatedUser).toBeNull();
    });

    test('returns null when user does not exist', async () => {
      const updateData = { name: 'Non-existent User' };

      const updatedUser = await UserModel.update(mockDb, 99999, updateData);

      expect(updatedUser).toBeNull();
    });
  });

  describe('delete', () => {
    test('deletes existing user successfully', async () => {
      const result = await UserModel.delete(mockDb, testUserId);

      expect(result).toBe(true);
    });

    test('returns false when user does not exist', async () => {
      const result = await UserModel.delete(mockDb, 99999);

      expect(result).toBe(false);
    });
  });
});