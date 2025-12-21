import { Hono } from 'hono';
import type { Context } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';
import { UserModel } from '../models/User';
import type { User } from '../types';

// Extend Hono context to include user
type Variables = {
  user: User;
};

type AppContext = Context<{ Variables: Variables }>;

const adminRoutes = new Hono<{ Variables: Variables }>();

// Get all users (admin only)
adminRoutes.get('/users', authMiddleware, requireAdmin, async (c: AppContext) => {
  try {
    const db = (c.env as any)?.DB;
    if (!db) {
      return c.json({ error: 'Database not available' }, 500);
    }
    
    const users = await UserModel.findAll(db);
    return c.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Update user details (admin only)
adminRoutes.put('/users/:id', authMiddleware, requireAdmin, async (c: AppContext) => {
  const userId = parseInt(c.req.param('id'))
  if (isNaN(userId)) {
    return c.json({ error: 'Invalid user ID' }, 400)
  }

  const currentUser = c.get('user')
  const { role, name, email } = await c.req.json<{ role?: 'user' | 'admin' | 'superadmin'; name?: string; email?: string }>()

  if (!role && !name && !email) {
    return c.json({ error: 'At least one field must be provided' }, 400)
  }

  if (role && !['user', 'admin', 'superadmin'].includes(role)) {
    return c.json({ error: 'Invalid role' }, 400)
  }

  // Prevent admin from changing their own role or other admins' roles unless superadmin
  if (role && currentUser.role !== 'superadmin' && (userId === currentUser.id || role === 'superadmin')) {
    return c.json({ error: 'Insufficient permissions to make this change' }, 403)
  }

  try {
    const db = (c.env as any)?.DB;
    if (!db) {
      return c.json({ error: 'Database not available' }, 500);
    }
    
    const updatedUser = await UserModel.update(db, userId, { role, name, email });
    return c.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
})

// Delete user (superadmin only)
adminRoutes.delete('/users/:id', authMiddleware, requireAdmin, async (c: AppContext) => {
  const userId = parseInt(c.req.param('id'))
  if (isNaN(userId)) {
    return c.json({ error: 'Invalid user ID' }, 400)
  }

  const currentUser = c.get('user')

  // Only superadmins can delete users
  if (currentUser.role !== 'superadmin') {
    return c.json({ error: 'Insufficient permissions' }, 403)
  }

  // Prevent self-deletion
  if (userId === currentUser.id) {
    return c.json({ error: 'Cannot delete your own account' }, 400)
  }

  try {
    const db = (c.env as any)?.DB;
    if (!db) {
      return c.json({ error: 'Database not available' }, 500);
    }
    
    await UserModel.delete(db, userId);
    return c.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
})

export default adminRoutes;