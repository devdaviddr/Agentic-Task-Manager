import type { Request, Response, NextFunction } from 'express';

export const timeout = (req: Request, res: Response, next: NextFunction): void => {
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      res.status(503).json({ error: 'Request timeout' });
    }
  }, 30000); // 30 seconds

  res.on('finish', () => clearTimeout(timeoutId));
  res.on('close', () => clearTimeout(timeoutId));

  next();
};