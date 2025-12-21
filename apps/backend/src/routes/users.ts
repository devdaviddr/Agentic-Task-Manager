import { Hono } from 'hono';
import type { Context } from 'hono';
import { UserModel } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import type { UpdateUserRequest, User } from '../types';

// Extend Hono context to include user
type Variables = {
  user: User;
};

type AppContext = Context<{ Variables: Variables }>;

const userRoutes = new Hono<{ Variables: Variables }>();

userRoutes.get('/users', authMiddleware, async (c: AppContext) => {
  try {
    const currentUser = c.get('user');
    const db = (c.env as any)?.DB;
    if (!db) {
      return c.json({ error: 'Database not available' }, 500);
    }
    
    // If user is admin/superadmin, return all users
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      const users = await UserModel.findAll(db);
      return c.json(users);
    }
    
    // Otherwise, return only the current user's data
    const userData = await UserModel.findById(db, currentUser.id);
    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Remove sensitive fields for regular users
    // Note: password_hash was removed in Firebase migration
    const safeUserData = userData;
    
    // Return as array for consistency with admin response
    return c.json([safeUserData]);
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

userRoutes.put('/users/:id', authMiddleware, async (c: AppContext) => {
  try {
    const id = parseInt(c.req.param('id'));
    const userData: UpdateUserRequest = await c.req.json();

    // Get current user from auth middleware
    const currentUser = c.get('user');
    if (currentUser.id !== id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Users cannot update their own role through this endpoint
    if (userData.role !== undefined) {
      return c.json({ error: 'Cannot update role through this endpoint' }, 403);
    }

    const db = (c.env as any)?.DB;
    if (!db) {
      return c.json({ error: 'Database not available' }, 500);
    }

    const updatedUser = await UserModel.update(db, id, userData);
    if (!updatedUser) {
      return c.json({ error: 'User not found or no changes made' }, 404);
    }

    return c.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default userRoutes;