// Cloudflare Workers entry point for TaskManager backend
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './config/database';

const app = new Hono<{ Bindings: Env }>();

// CORS configuration
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Health check endpoint
app.get('/health', async (c) => {
  try {
    // Test D1 database connection
    const result = await c.env.DB.prepare('SELECT 1 as test').first();
    return c.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: result ? 'connected' : 'disconnected'
    });
  } catch (error) {
    return c.json({ 
      status: 'error', 
      error: (error as Error).message 
    }, 500);
  }
});

// Test D1 users endpoint
app.get('/api/test-users', async (c) => {
  try {
    const stmt = c.env.DB.prepare('SELECT COUNT(*) as count FROM users');
    const result = await stmt.first();
    return c.json({ 
      message: 'D1 database working!',
      userCount: result?.count || 0
    });
  } catch (error) {
    return c.json({ 
      error: (error as Error).message 
    }, 500);
  }
});

// Create a test user endpoint
app.post('/api/test-users', async (c) => {
  try {
    const { email, name } = await c.req.json();
    const stmt = c.env.DB.prepare(`
      INSERT INTO users (email, name, firebase_uid, role, created_at, updated_at)
      VALUES (?, ?, ?, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, name, role, created_at, updated_at
    `);
    const result = await stmt.bind(email, name, `test-${Date.now()}`).first();
    return c.json({ 
      success: true,
      user: result
    });
  } catch (error) {
    return c.json({ 
      error: (error as Error).message 
    }, 500);
  }
});

export default app;