import { Router } from 'express';
import { ItemController } from '../controllers/ItemController';
import { authMiddleware } from '../middleware/auth';

const itemRoutes = Router();

itemRoutes.get('/items/:id', authMiddleware, ItemController.get);
itemRoutes.get('/columns/:columnId/items', authMiddleware, ItemController.getByColumn);
itemRoutes.post('/columns/:columnId/items', authMiddleware, ItemController.create);
itemRoutes.put('/items/:id', authMiddleware, ItemController.update);
itemRoutes.put('/items/:id/move', authMiddleware, ItemController.move);
itemRoutes.put('/items/:id/archive', authMiddleware, ItemController.archive);
itemRoutes.delete('/items/:id', authMiddleware, ItemController.delete);
itemRoutes.post('/items/:id/users', authMiddleware, ItemController.assignUser);
itemRoutes.delete('/items/:id/users/:userId', authMiddleware, ItemController.removeUser);

export default itemRoutes;