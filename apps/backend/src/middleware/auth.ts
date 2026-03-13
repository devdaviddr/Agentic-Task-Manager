import { MiddlewareHandler } from 'hono';
import { FirebaseAdminService } from '../services/FirebaseAdminService';
import { UserModel } from '../models/User';

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - missing token' }, 401);
  }

  const idToken = authHeader.substring(7);
  if (!idToken) {
    return c.json({ error: 'Unauthorized - missing token' }, 401);
  }

  const decoded = await FirebaseAdminService.verifyIdToken(idToken);
  if (!decoded) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  // Find or create the user based on Firebase UID
  const user = await UserModel.findOrCreateByFirebaseUid(
    decoded.uid,
    decoded.email ?? '',
    decoded.name,
  );

  // Attach user to context
  c.set('user', user);
  return await next();
};
