import type { Request, Response } from 'express';
import { ColumnService } from '../services/ColumnService';
import type { CreateColumnRequest } from '../types';
import { checkBoardOwnership, checkBoardOwnershipViaColumn, checkBoardAccess } from '../utils/auth';

export class ColumnController {
  static async getByBoard(req: Request, res: Response): Promise<void> {
    try {
      const boardId = parseInt(req.params.boardId as string);
      if (isNaN(boardId)) {
        res.status(400).json({ error: 'Invalid board ID' });
        return;
      }

      const user = req.user!;

      // Check board access (owner or assigned to tasks)
      try {
        await checkBoardAccess(boardId, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Board not found') {
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

      const columns = await ColumnService.getColumnsByBoard(boardId);
      res.json(columns);
    } catch (error) {
      console.error('Controller error - getByBoard columns:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const boardId = parseInt(req.params.boardId as string);
      if (isNaN(boardId)) {
        res.status(400).json({ error: 'Invalid board ID' });
        return;
      }

      const user = req.user!;

      // Check board ownership
      try {
        await checkBoardOwnership(boardId, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Board not found') {
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

      const body: CreateColumnRequest = req.body;

      const column = await ColumnService.createColumn(boardId, body);
      res.status(201).json(column);
    } catch (error) {
      console.error('Controller error - create column:', error);
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
        res.status(400).json({ error: 'Invalid column ID' });
        return;
      }

      const user = req.user!;

      // Check board ownership via column
      try {
        await checkBoardOwnershipViaColumn(id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Column not found' || error.message === 'Board not found') {
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

      const body: Partial<CreateColumnRequest> = req.body;
      const column = await ColumnService.updateColumn(id, body);

      res.json(column);
    } catch (error) {
      console.error('Controller error - update column:', error);
      if (error instanceof Error && (error.message === 'Column not found or no changes made' || error.message.includes('Validation error'))) {
        res.status(error.message === 'Column not found or no changes made' ? 404 : 400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid column ID' });
        return;
      }

      const user = req.user!;

      // Check board ownership via column
      try {
        await checkBoardOwnershipViaColumn(id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Column not found' || error.message === 'Board not found') {
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

      await ColumnService.deleteColumn(id);
      res.json({ message: 'Column deleted successfully' });
    } catch (error) {
      console.error('Controller error - delete column:', error);
      if (error instanceof Error && error.message === 'Column not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async move(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid column ID' });
        return;
      }

      const user = req.user!;

      // Check board ownership via column
      try {
        await checkBoardOwnershipViaColumn(id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Column not found' || error.message === 'Board not found') {
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

      const { position } = req.body;

      if (typeof position !== 'number' || position < 0) {
        res.status(400).json({ error: 'Invalid position' });
        return;
      }

      const column = await ColumnService.moveColumn(id, position);
      res.json(column);
    } catch (error) {
      console.error('Controller error - move column:', error);
      if (error instanceof Error && error.message === 'Column not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}