import { Router } from 'express';
import { BoardController } from '../controllers/BoardController';
import { authMiddleware } from '../middleware/auth';

const boardRoutes = Router();

boardRoutes.get('/boards', authMiddleware, BoardController.getAll);
boardRoutes.get('/boards/:id', authMiddleware, BoardController.getById);
boardRoutes.get('/boards/:id/full', authMiddleware, BoardController.getWithColumns);
boardRoutes.post('/boards', authMiddleware, BoardController.create);
boardRoutes.put('/boards/:id', authMiddleware, BoardController.update);
boardRoutes.delete('/boards/:id', authMiddleware, BoardController.delete);

export default boardRoutes;