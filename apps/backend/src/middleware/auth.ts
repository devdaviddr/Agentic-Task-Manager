import type { Request, Response, NextFunction } from 'express';
import { FirebaseAdminService } from '../services/FirebaseAdminService';
import { UserModel } from '../models/User';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized - missing token' });
    return;
  }

  const idToken = authHeader.substring(7);
  if (!idToken) {
    res.status(401).json({ error: 'Unauthorized - missing token' });
    return;
  }

  const decoded = await FirebaseAdminService.verifyIdToken(idToken);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  if (!decoded.email) {
    res.status(400).json({ error: 'Firebase token missing email claim' });
    return;
  }

  // Find or create the user based on Firebase UID
  const user = await UserModel.findOrCreateByFirebaseUid(
    decoded.uid,
    decoded.email,
    decoded.name,
  );

  // Attach user to request
  req.user = user;
  next();
};
