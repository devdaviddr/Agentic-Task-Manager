import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import type { User, CreateUserRequest, UpdateUserRequest } from '../types';

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(`
      SELECT id, email, password_hash, firebase_uid, name, role, created_at, updated_at
      FROM users
      WHERE email = $1
    `, [email]);
    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const result = await pool.query(`
      SELECT id, email, password_hash, firebase_uid, name, role, created_at, updated_at
      FROM users
      WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  static async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const result = await pool.query(`
      SELECT id, email, password_hash, firebase_uid, name, role, created_at, updated_at
      FROM users
      WHERE firebase_uid = $1
    `, [firebaseUid]);
    return result.rows[0] || null;
  }

  static async create(userData: CreateUserRequest): Promise<User> {
    const hashedPassword = userData.password
      ? await bcrypt.hash(userData.password, 12)
      : null;
    const result = await pool.query(`
      INSERT INTO users (email, password_hash, firebase_uid, name, role, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'user', NOW(), NOW())
      RETURNING id, email, password_hash, firebase_uid, name, role, created_at, updated_at
    `, [userData.email, hashedPassword, userData.firebase_uid || null, userData.name || null]);
    return result.rows[0];
  }

  /** Find an existing user by Firebase UID or create one from the token claims. */
  static async findOrCreateByFirebaseUid(
    firebaseUid: string,
    email: string,
    name?: string,
  ): Promise<User> {
    // Try to find by Firebase UID first
    let user = await this.findByFirebaseUid(firebaseUid);
    if (user) return user;

    // Fall back to finding by email (e.g., user existed before Firebase migration)
    user = await this.findByEmail(email);
    if (user) {
      // Link Firebase UID to the existing account
      const result = await pool.query(`
        UPDATE users SET firebase_uid = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, email, password_hash, firebase_uid, name, role, created_at, updated_at
      `, [firebaseUid, user.id]);
      return result.rows[0];
    }

    // Create a brand-new user
    return this.create({ email, firebase_uid: firebaseUid, name });
  }

  static async findAll(): Promise<User[]> {
    const result = await pool.query(`
      SELECT id, email, name, role, created_at, updated_at
      FROM users
      ORDER BY name, email
    `);
    return result.rows;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    if (!user.password_hash) return false;
    return await bcrypt.compare(password, user.password_hash);
  }

  static async update(id: number, userData: UpdateUserRequest): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (userData.name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      values.push(userData.name);
      paramIndex++;
    }

    if (userData.email !== undefined) {
      fields.push(`email = $${paramIndex}`);
      values.push(userData.email);
      paramIndex++;
    }

    if (userData.role !== undefined) {
      fields.push(`role = $${paramIndex}`);
      values.push(userData.role);
      paramIndex++;
    }

    if (fields.length === 0) {
      return null; // No fields to update
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(`
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, name, role, created_at, updated_at
    `, values);

    return result.rows[0] || null;
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
