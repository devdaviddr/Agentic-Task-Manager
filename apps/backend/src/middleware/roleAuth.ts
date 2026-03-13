import type { Request, Response, NextFunction } from 'express';
import type { User } from '../types';

export type UserRole = 'user' | 'admin' | 'superadmin';

export const requireRole = (requiredRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as User;

    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      admin: 2,
      superadmin: 3,
    };

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireSuperadmin = requireRole('superadmin');