import dotenv from 'dotenv';

// Only load from .env file if environment variables aren't already set (e.g., by tests)
// This allows tests to pre-set env vars before importing this file
if (!process.env.NODE_ENV) {
  dotenv.config();
}

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { rateLimiter } from 'hono-rate-limiter';
import routes from './routes';
import {
  errorHandler,
  logger,
  securityHeaders,
  compression,
  timeout
} from './middleware';
import { swaggerUI } from '@hono/swagger-ui';
import { isProduction, getCorsOrigins } from './utils/environment';

const app = new Hono();
const isTestMode = process.env.NODE_ENV === 'test';

// Environment-aware CORS configuration
const corsOrigins = getCorsOrigins();

// Rate limiting - strict limits for auth endpoints (skip in test mode)
if (!isTestMode) {
  // Global rate limiting
  app.use('*', rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isProduction ? 100 : 1000, // stricter in production
    standardHeaders: true,
    keyGenerator: (c) => {
      // Use IP address for rate limiting
      return c.req.header('CF-Connecting-IP') ||
             c.req.header('X-Forwarded-For') ||
             c.req.header('X-Real-IP') ||
             'unknown';
    },
  }));
}

// CORS middleware
app.use('*', cors({
  origin: corsOrigins,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
}));

// Security headers
app.use('*', securityHeaders);

// Compression
app.use('*', compression);

// Request timeout
app.use('*', timeout);

// Logging middleware
app.use('*', logger);

// Error handler (must be after other middleware)
app.use('*', errorHandler);

// Swagger UI documentation route
const swaggerUIMiddleware = swaggerUI({
  url: '/openapi.json',
  defaultModelsExpandDepth: 1,
  defaultModelExpandDepth: 1,
  docExpansion: 'list',
  filter: true,
});

app.get('/docs', swaggerUIMiddleware);

// Routes
app.route('/', routes);

// Root route
app.get('/', (c) => c.json({
  message: 'Task Manager API',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString()
}));

// Health check route
app.get('/health', async (c) => {
  try {
    // Import pool dynamically to avoid circular dependency
    const { pool } = await import('./config/database');
    await pool.query('SELECT 1');

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    };

    return c.json(health);
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: (error as Error).message
    }, 503);
  }
});

// Import OpenAPI spec generator
import { generateOpenAPISpec } from './openapi/spec';

// OpenAPI spec endpoint (serves the spec for Swagger UI)
app.get('/openapi.json', (c) => {
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  return c.json(generateOpenAPISpec(baseUrl));
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404);
});

export default app;