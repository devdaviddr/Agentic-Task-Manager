import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';
import { UserModel } from '../models/User';

const adminRoutes = Router();

// Get all users (admin only)
adminRoutes.get('/users', authMiddleware, requireAdmin, async (_req, res) => {
  try {
    const users = await UserModel.findAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user details (admin only)
adminRoutes.put('/users/:id', authMiddleware, requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id as string);
  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid user ID' });
    return;
  }

  const currentUser = req.user!;
  const { role, name, email } = req.body as { role?: 'user' | 'admin' | 'superadmin'; name?: string; email?: string };

  if (!role && !name && !email) {
    res.status(400).json({ error: 'At least one field must be provided' });
    return;
  }

  if (role && !['user', 'admin', 'superadmin'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }

  // Prevent admin from changing their own role or other admins' roles unless superadmin
  if (role && currentUser.role !== 'superadmin' && (userId === currentUser.id || role === 'superadmin')) {
    res.status(403).json({ error: 'Insufficient permissions to make this change' });
    return;
  }

  try {
    const updatedUser = await UserModel.update(userId, { role, name, email });
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (superadmin only)
adminRoutes.delete('/users/:id', authMiddleware, requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id as string);
  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid user ID' });
    return;
  }

  const currentUser = req.user!;

  // Only superadmins can delete users
  if (currentUser.role !== 'superadmin') {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }

  // Prevent self-deletion
  if (userId === currentUser.id) {
    res.status(400).json({ error: 'Cannot delete your own account' });
    return;
  }

  try {
    await UserModel.delete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default adminRoutes;