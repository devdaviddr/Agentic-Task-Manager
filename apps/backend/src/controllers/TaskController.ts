import type { Request, Response } from 'express';
import { TaskService } from '../services/TaskService';
import type { CreateTaskRequest, UpdateTaskRequest } from '../types';
import { checkTaskOwnership } from '../utils/auth';

export class TaskController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const tasks = await TaskService.getAllTasksByUser(user.id);
      res.json(tasks);
    } catch (error) {
      console.error('Controller error - getAll:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }

      const user = req.user!;

      // Check task ownership
      try {
        await checkTaskOwnership(id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Task not found') {
            res.status(404).json({ error: error.message });
            return;
          }
          if (error.message === 'Access denied') {
            res.status(403).json({ error: error.message });
            return;
          }
        }
        throw error;
      }

      const task = await TaskService.getTaskById(id);
      res.json(task);
    } catch (error) {
      console.error('Controller error - getById:', error);
      if (error instanceof Error && error.message === 'Task not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const body: CreateTaskRequest = req.body;
      const user = req.user!;

      const task = await TaskService.createTask(body, user.id);
      res.status(201).json(task);
    } catch (error) {
      console.error('Controller error - create:', error);
      if (error instanceof Error && error.message.includes('Validation error')) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }

      const user = req.user!;

      // Check task ownership
      try {
        await checkTaskOwnership(id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Task not found') {
            res.status(404).json({ error: error.message });
            return;
          }
          if (error.message === 'Access denied') {
            res.status(403).json({ error: error.message });
            return;
          }
        }
        throw error;
      }

      const body: UpdateTaskRequest = req.body;
      const task = await TaskService.updateTask(id, body);

      res.json(task);
    } catch (error) {
      console.error('Controller error - update:', error);
      if (error instanceof Error && (error.message === 'Task not found or no changes made' || error.message.includes('Validation error'))) {
        res.status(error.message === 'Task not found or no changes made' ? 404 : 400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }

      const user = req.user!;

      // Check task ownership
      try {
        await checkTaskOwnership(id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Task not found') {
            res.status(404).json({ error: error.message });
            return;
          }
          if (error.message === 'Access denied') {
            res.status(403).json({ error: error.message });
            return;
          }
        }
        throw error;
      }

      await TaskService.deleteTask(id);
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Controller error - delete:', error);
      if (error instanceof Error && error.message === 'Task not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}