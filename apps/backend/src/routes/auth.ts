import { Hono } from 'hono';
import { FirebaseAdminService } from '../services/FirebaseAdminService';
import { UserModel } from '../models/User';

const authRoutes = new Hono();

/**
 * GET /auth/me
 *
 * Verifies the Firebase ID token supplied in the Authorization header and
 * returns the corresponding user record (creating one on first sign-in).
 */
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const idToken = authHeader.substring(7);
  if (!idToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const decoded = await FirebaseAdminService.verifyIdToken(idToken);
  if (!decoded) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  const user = await UserModel.findOrCreateByFirebaseUid(
    decoded.uid,
    decoded.email ?? '',
    decoded.name,
  );

  const { password_hash, ...userWithoutPassword } = user;
  return c.json({ user: userWithoutPassword });
});

export default authRoutes;
