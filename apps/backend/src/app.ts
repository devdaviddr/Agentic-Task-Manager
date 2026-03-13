import dotenv from 'dotenv';

// Only load from .env file if environment variables aren't already set (e.g., by tests)
// This allows tests to pre-set env vars before importing this file
if (!process.env.NODE_ENV) {
  dotenv.config();
}

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import {
  errorHandler,
  logger,
  securityHeaders,
  timeout
} from './middleware';
import { isProduction, getCorsOrigins } from './utils/environment';
import { generateOpenAPISpec } from './openapi/spec';
import { swaggerUIOptions } from './openapi/swagger';

const app = express();
const isTestMode = process.env.NODE_ENV === 'test';

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Environment-aware CORS configuration
const corsOrigins = getCorsOrigins();

// Rate limiting - strict limits for auth endpoints (skip in test mode)
if (!isTestMode) {
  // Global rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: isProduction ? 100 : 1000, // stricter in production
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return (req.headers['cf-connecting-ip'] as string) ||
             (req.headers['x-forwarded-for'] as string) ||
             (req.headers['x-real-ip'] as string) ||
             req.ip ||
             'unknown';
    },
  }));
}

// CORS middleware
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
}));

// Security headers
app.use(securityHeaders);

// Response compression
app.use(compression());

// Request timeout
app.use(timeout);

// Logging middleware
app.use(logger);

// Swagger UI documentation
const openApiSpec = generateOpenAPISpec(process.env.API_URL || 'http://localhost:3001');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, swaggerUIOptions));

// OpenAPI spec endpoint (serves the spec for Swagger UI)
app.get('/openapi.json', (_req, res) => {
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  res.json(generateOpenAPISpec(baseUrl));
});

// Routes
app.use('/', routes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: 'Task Manager API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get('/health', async (_req, res) => {
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

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: (error as Error).message
    });
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found', path: _req.path });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;