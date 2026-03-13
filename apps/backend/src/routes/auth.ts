import { Router } from 'express';
import { FirebaseAdminService } from '../services/FirebaseAdminService';
import { UserModel } from '../models/User';

const authRoutes = Router();

/**
 * GET /auth/me
 *
 * Verifies the Firebase ID token supplied in the Authorization header and
 * returns the corresponding user record (creating one on first sign-in).
 */
authRoutes.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('[/auth/me] Authorization header:', authHeader ? `${authHeader.slice(0, 20)}...` : 'none');
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const idToken = authHeader.substring(7);
  console.log('[/auth/me] token length:', idToken?.length);
  if (!idToken) {
    res.status(401).json({ error: 'Unauthorized' });
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

  const user = await UserModel.findOrCreateByFirebaseUid(
    decoded.uid,
    decoded.email,
    decoded.name,
  );

  const { password_hash, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

export default authRoutes;
