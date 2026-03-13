import { Router } from 'express';
import taskRoutes from './tasks';
import boardRoutes from './boards';
import columnRoutes from './columns';
import itemRoutes from './items';
import tagRoutes from './tags';
import authRoutes from './auth';
import userRoutes from './users';
import adminRoutes from './admin';

const router = Router();

// Health check route
router.get('/health', async (_req, res) => {
  try {
    // Import pool dynamically to avoid circular dependency
    const { pool } = await import('../config/database');
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api', userRoutes);
router.use('/api', taskRoutes);
router.use('/api', boardRoutes);
router.use('/api', columnRoutes);
router.use('/api', itemRoutes);
router.use('/api', tagRoutes);

export default router;