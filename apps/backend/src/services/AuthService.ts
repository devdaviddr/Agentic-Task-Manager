import type { D1Database } from '@cloudflare/workers-types';
import { UserModel } from '../models/User';
import { auth as firebaseAuth } from '../config/firebase';
import type { User } from '../types';

export class AuthService {
  /**
   * Sync Firebase user to D1 database
   * Creates user if doesn't exist, updates if exists
   */
  static async syncFirebaseUser(db: D1Database, firebaseUid: string): Promise<User> {
    // Get user info from Firebase
    const firebaseUser = await firebaseAuth.getUser(firebaseUid);

    // Check if user exists in D1
    let user = await UserModel.findByFirebaseUid(db, firebaseUid);

    if (!user) {
      // Check if user exists by email (migration case)
      user = await UserModel.findByEmail(db, firebaseUser.email!);

      if (user) {
        // Update existing user with Firebase UID
        user = await UserModel.updateFirebaseUid(db, firebaseUser.email!, firebaseUid);
      } else {
        // Create new user
        user = await UserModel.createFromFirebase(
          db,
          firebaseUid,
          firebaseUser.email!,
          firebaseUser.displayName || undefined
        );
      }
    }

    if (!user) {
      throw new Error('Failed to create or update user');
    }

    return user;
  }

  /**
   * Get user from Firebase UID
   */
  static async getUserByFirebaseUid(db: D1Database, firebaseUid: string): Promise<User | null> {
    return UserModel.findByFirebaseUid(db, firebaseUid);
  }

  /**
   * Verify Firebase ID token and return user
   */
  static async verifyToken(db: D1Database, idToken: string): Promise<User | null> {
    try {
      const decodedToken = await firebaseAuth.verifyIdToken(idToken);
      return await this.getUserByFirebaseUid(db, decodedToken.uid);
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Delete user from Firebase and D1
   */
  static async deleteUser(db: D1Database, firebaseUid: string): Promise<void> {
    // Delete from Firebase
    await firebaseAuth.deleteUser(firebaseUid);

    // Delete from D1
    const user = await UserModel.findByFirebaseUid(db, firebaseUid);
    if (user) {
      await UserModel.delete(db, user.id);
    }
  }
}