import type { D1Database } from '@cloudflare/workers-types';
import type { User, UpdateUserRequest } from '../types';

export class UserModel {
  static async findByEmail(db: D1Database, email: string): Promise<User | null> {
    const stmt = db.prepare(`
      SELECT id, email, firebase_uid, name, role, created_at, updated_at
      FROM users
      WHERE email = ?
    `);
    const result = await stmt.bind(email).first();
    return result ? this.mapToUser(result) : null;
  }

  static async findById(db: D1Database, id: number): Promise<User | null> {
    const stmt = db.prepare(`
      SELECT id, email, firebase_uid, name, role, created_at, updated_at
      FROM users
      WHERE id = ?
    `);
    const result = await stmt.bind(id).first();
    return result ? this.mapToUser(result) : null;
  }

  static async findByFirebaseUid(db: D1Database, firebaseUid: string): Promise<User | null> {
    const stmt = db.prepare(`
      SELECT id, email, firebase_uid, name, role, created_at, updated_at
      FROM users
      WHERE firebase_uid = ?
    `);
    const result = await stmt.bind(firebaseUid).first();
    return result ? this.mapToUser(result) : null;
  }

  static async createFromFirebase(db: D1Database, firebaseUid: string, email: string, name?: string): Promise<User> {
    const stmt = db.prepare(`
      INSERT INTO users (firebase_uid, email, name, role, created_at, updated_at)
      VALUES (?, ?, ?, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, firebase_uid, name, role, created_at, updated_at
    `);
    const result = await stmt.bind(firebaseUid, email, name || null).first();
    if (!result) {
      throw new Error('Failed to create user');
    }
    return this.mapToUser(result);
  }

  static async updateFirebaseUid(db: D1Database, email: string, firebaseUid: string): Promise<User | null> {
    const stmt = db.prepare(`
      UPDATE users
      SET firebase_uid = ?, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
      RETURNING id, email, firebase_uid, name, role, created_at, updated_at
    `);
    const result = await stmt.bind(firebaseUid, email).first();
    return result ? this.mapToUser(result) : null;
  }

  static async findAll(db: D1Database): Promise<User[]> {
    const stmt = db.prepare(`
      SELECT id, email, firebase_uid, name, role, created_at, updated_at
      FROM users
      ORDER BY name, email
    `);
    const result = await stmt.all();
    return result.results.map(row => this.mapToUser(row));
  }

  static async update(db: D1Database, id: number, userData: UpdateUserRequest): Promise<User | null> {
    const fields = [];
    const values = [];

    if (userData.name !== undefined) {
      fields.push('name = ?');
      values.push(userData.name);
    }

    if (userData.email !== undefined) {
      fields.push('email = ?');
      values.push(userData.email);
    }

    if (userData.role !== undefined) {
      fields.push('role = ?');
      values.push(userData.role);
    }

    if (fields.length === 0) {
      return null; // No fields to update
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING id, email, firebase_uid, name, role, created_at, updated_at
    `);
    
    const result = await stmt.bind(...values).first();
    return result ? this.mapToUser(result) : null;
  }

  static async delete(db: D1Database, id: number): Promise<boolean> {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.success && result.meta.changes > 0;
  }

  // Helper method to map D1 result to User type
  private static mapToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      firebase_uid: row.firebase_uid,
      name: row.name,
      role: row.role,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}