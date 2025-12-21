import { app as openapiApp } from '../openapi';

/**
 * POST /api/auth/login
 * Authentication is now handled via Google Firebase
 * This endpoint is disabled
 */
openapiApp.post('/api/auth/login', async (c) => {
  return c.json({ 
    error: 'Authentication is now handled via Google Firebase. Use Google Sign-In and include Firebase ID token in Authorization header as Bearer token.' 
  }, 410); // 410 Gone
});

export default openapiApp;
