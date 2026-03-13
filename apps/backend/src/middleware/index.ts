import type { Request, Response, NextFunction } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Unhandled error:', error);

  // In production, don't leak error details
  const errorMessage = isProduction
    ? 'Internal server error'
    : error.message;

  res.status(500).json({
    error: errorMessage,
    ...(isProduction ? {} : { stack: error.stack })
  });
};

export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.headers['cf-connecting-ip'] as string ||
          req.headers['x-forwarded-for'] as string ||
          req.headers['x-real-ip'] as string ||
          req.ip ||
          'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    if (duration > 1000) {
      console.warn('⚠️  Slow request:', logData);
    } else {
      console.log(`${logData.method} ${logData.path} - ${logData.status} - ${logData.duration}`);
    }
  });

  next();
};

export { requireRole, requireAdmin, requireSuperadmin } from './roleAuth';
export { authMiddleware } from './auth';
export { securityHeaders } from './security';
export { compression } from './compression';
export { timeout } from './timeout';