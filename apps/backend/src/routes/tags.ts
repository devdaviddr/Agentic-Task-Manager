import { Router } from 'express';
import { TagController } from '../controllers/TagController';
import { authMiddleware } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';

const router = Router();

// GET /tags - Get all tags (authenticated users)
router.get('/tags', authMiddleware, TagController.getAll);

// GET /tags/:id - Get tag by ID (authenticated users)
router.get('/tags/:id', authMiddleware, TagController.get);

// POST /tags - Create new tag (admin only)
router.post('/tags', authMiddleware, requireAdmin, TagController.create);

// PUT /tags/:id - Update tag (admin only)
router.put('/tags/:id', authMiddleware, requireAdmin, TagController.update);

// DELETE /tags/:id - Delete tag (admin only)
router.delete('/tags/:id', authMiddleware, requireAdmin, TagController.delete);

export default router;