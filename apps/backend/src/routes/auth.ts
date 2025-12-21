import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { User } from '../types';

const authRoutes = new Hono();

/**
 * Sync Firebase user to PostgreSQL
 * Frontend calls this after successful Firebase sign-in
 */
authRoutes.post('/sync', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User;

    // User is already synced if we got here (authMiddleware verified it)
    const { firebase_uid, ...userWithoutUid } = user;
    return c.json({ user: userWithoutUid });
  } catch (error) {
    console.error('Sync error:', error);
    return c.json({ error: 'Failed to sync user' }, 500);
  }
});

/**
 * Get current user profile (optional - can use sync instead)
 */
authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user') as User;
  const { firebase_uid, ...userWithoutUid } = user;
  return c.json({ user: userWithoutUid });
});

export default authRoutes;