import { Router } from 'express';
import { UserModel } from '../models/User';
import { authMiddleware } from '../middleware/auth';
import type { UpdateUserRequest } from '../types';

const userRoutes = Router();

userRoutes.get('/users', authMiddleware, async (req, res) => {
  try {
    const currentUser = req.user!;

    // If user is admin/superadmin, return all users
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      const users = await UserModel.findAll();
      res.json(users);
      return;
    }

    // Otherwise, return only the current user's data
    const userData = await UserModel.findById(currentUser.id);
    if (!userData) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove sensitive fields for regular users
    const { password_hash, ...safeUserData } = userData;

    // Return as array for consistency with admin response
    res.json([safeUserData]);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

userRoutes.put('/users/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string);
    const userData: UpdateUserRequest = req.body;

    // Get current user from auth middleware
    const currentUser = req.user!;
    if (currentUser.id !== id) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    // Users cannot update their own role through this endpoint
    if (userData.role !== undefined) {
      res.status(403).json({ error: 'Cannot update role through this endpoint' });
      return;
    }

    const updatedUser = await UserModel.update(id, userData);
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found or no changes made' });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default userRoutes;