import { MiddlewareHandler } from 'hono';
import { auth as firebaseAuth } from '../config/firebase';
import { UserModel } from '../models/User';

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    // Get token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized - missing token' }, 401);
    }

    const token = authHeader.substring(7);

    // Verify Firebase ID token
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Get D1 database from environment
    const db = (c.env as any)?.DB;
    if (!db) {
      console.error('Auth middleware: Database not available');
      return c.json({ error: 'Database unavailable' }, 500);
    }

    // Look up user in D1 database by Firebase UID
    const user = await UserModel.findByFirebaseUid(db, firebaseUid);

    if (!user) {
      return c.json({ error: 'User not found in database' }, 404);
    }

    // Attach user to context
    c.set('user', user);
    return await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
};