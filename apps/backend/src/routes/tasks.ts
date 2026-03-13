import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authMiddleware } from '../middleware/auth';

const taskRoutes = Router();

taskRoutes.get('/tasks', authMiddleware, TaskController.getAll);
taskRoutes.get('/tasks/:id', authMiddleware, TaskController.getById);
taskRoutes.post('/tasks', authMiddleware, TaskController.create);
taskRoutes.put('/tasks/:id', authMiddleware, TaskController.update);
taskRoutes.delete('/tasks/:id', authMiddleware, TaskController.delete);

export default taskRoutes;