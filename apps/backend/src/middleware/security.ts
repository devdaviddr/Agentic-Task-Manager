import type { Request, Response, NextFunction } from 'express';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';

export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // HSTS in production
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  next();
};