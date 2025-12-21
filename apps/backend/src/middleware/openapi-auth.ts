import { Context, MiddlewareHandler } from 'hono';
import { AuthService } from '../services/AuthService';

/**
 * OpenAPI Bearer token authentication middleware
 * Extracts Firebase ID token from Authorization header and validates it
 * Attaches user data to context if valid
 */
export const openapiAuth: MiddlewareHandler = async (c: Context, next) => {
  // Get Authorization header
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Don't block request, let the route handle authentication
    // This allows unauthenticated routes to work
    return next();
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.slice(7);

  // Verify Firebase ID token
  const db = (c.env as any)?.DB;
  if (!db) {
    return c.json({ error: 'Database not available' }, 500);
  }
  
  const user = await AuthService.verifyToken(db, token);
  if (!user) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  // Attach user to context for protected routes to use
  c.set('user', user);

  return next();
};

/**
 * Helper to require authentication
 * Use this in route handlers that need auth
 */
export const requireAuth = (c: Context) => {
  const user = c.get('user');
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
};
