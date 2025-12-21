import { Hono } from 'hono';
import taskRoutes from './tasks';
import boardRoutes from './boards';
import columnRoutes from './columns';
import itemRoutes from './items';
import tagRoutes from './tags';
import authRoutes from './auth';
import userRoutes from './users';
import adminRoutes from './admin';

const router = new Hono();

// Health check route
router.get('/health', async (c) => {
  try {
    // Check D1 database connection
    const db = (c.env as any)?.DB;
    if (!db) {
      return c.json({
        status: 'error',
        database: 'disconnected',
        error: 'Database not available',
        timestamp: new Date().toISOString()
      }, 500);
    }
    
    // Simple test query
    await db.prepare('SELECT 1').first();
    return c.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      status: 'error',
      database: 'disconnected',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Mount routes
router.route('/auth', authRoutes);
router.route('/api/admin', adminRoutes);
router.route('/api', userRoutes);
router.route('/api', taskRoutes);
router.route('/api', boardRoutes);
router.route('/api', columnRoutes);
router.route('/api', itemRoutes);
router.route('/api', tagRoutes);

export default router;