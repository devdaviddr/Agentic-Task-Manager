import type { Request, Response, NextFunction } from 'express';

export const compression = (_req: Request, _res: Response, next: NextFunction): void => {
  next();
  // Actual response compression is handled by the `compression` npm package in app.ts
};