import { Router } from 'express';
import { ColumnController } from '../controllers/ColumnController';
import { authMiddleware } from '../middleware/auth';

const columnRoutes = Router();

columnRoutes.get('/boards/:boardId/columns', authMiddleware, ColumnController.getByBoard);
columnRoutes.post('/boards/:boardId/columns', authMiddleware, ColumnController.create);
columnRoutes.put('/columns/:id', authMiddleware, ColumnController.update);
columnRoutes.delete('/columns/:id', authMiddleware, ColumnController.delete);
columnRoutes.put('/columns/:id/move', authMiddleware, ColumnController.move);

export default columnRoutes;