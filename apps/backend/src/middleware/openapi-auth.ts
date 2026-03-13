import { Context, MiddlewareHandler } from 'hono';
import { FirebaseAdminService } from '../services/FirebaseAdminService';
import { UserModel } from '../models/User';

/**
 * OpenAPI Bearer token authentication middleware.
 * Verifies Firebase ID tokens and attaches the user to the context.
 */
export const openapiAuth: MiddlewareHandler = async (c: Context, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Allow unauthenticated routes to proceed
    return next();
  }

  const token = authHeader.slice(7);
  const decoded = await FirebaseAdminService.verifyIdToken(token);
  if (!decoded) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const user = await UserModel.findOrCreateByFirebaseUid(
    decoded.uid,
    decoded.email ?? '',
    decoded.name,
  );

  c.set('user', user);
  return next();
};

/**
 * Helper to require authentication in route handlers.
 */
export const requireAuth = (c: Context) => {
  const user = c.get('user');
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
};

