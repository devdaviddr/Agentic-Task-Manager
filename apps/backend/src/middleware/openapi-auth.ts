import type { Request, Response, NextFunction } from 'express';
import { FirebaseAdminService } from '../services/FirebaseAdminService';
import { UserModel } from '../models/User';

/**
 * OpenAPI Bearer token authentication middleware.
 * Verifies Firebase ID tokens and attaches the user to the request.
 */
export const openapiAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Allow unauthenticated routes to proceed
    next();
    return;
  }

  const token = authHeader.slice(7);
  const decoded = await FirebaseAdminService.verifyIdToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  if (!decoded.email) {
    res.status(400).json({ error: 'Firebase token missing email claim' });
    return;
  }

  const user = await UserModel.findOrCreateByFirebaseUid(
    decoded.uid,
    decoded.email,
    decoded.name,
  );

  req.user = user;
  next();
};
