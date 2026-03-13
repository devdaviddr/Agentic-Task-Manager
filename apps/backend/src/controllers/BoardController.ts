import type { Request, Response } from 'express';
import { BoardService } from '../services/BoardService';
import type { CreateBoardRequest, UpdateBoardRequest } from '../types';
import { checkBoardOwnership, checkBoardAccess } from '../utils/auth';

export class BoardController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const boards = await BoardService.getAllBoards(user.id);
      res.json(boards);
    } catch (error) {
      console.error('Controller error - getAll boards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid board ID' });
        return;
      }

      const user = req.user!;

      // Check board access (owner or assigned to tasks)
      try {
        await checkBoardAccess(id, user.id);
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

      const board = await BoardService.getBoardById(id);
      res.json(board);
    } catch (error) {
      console.error('Controller error - getById board:', error);
      if (error instanceof Error && error.message === 'Board not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getWithColumns(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid board ID' });
        return;
      }

      const user = req.user!;

      // Check board access (owner or assigned to tasks)
      try {
        await checkBoardAccess(id, user.id);
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

      const board = await BoardService.getBoardWithColumns(id);
      res.json(board);
    } catch (error) {
      console.error('Controller error - getWithColumns board:', error);
      if (error instanceof Error && error.message === 'Board not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const body: CreateBoardRequest = req.body;

      const board = await BoardService.createBoard(body, user.id);
      res.status(201).json(board);
    } catch (error) {
      console.error('Controller error - create board:', error);
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
        res.status(400).json({ error: 'Invalid board ID' });
        return;
      }

      const user = req.user!;

      // Check board ownership
      try {
        await checkBoardOwnership(id, user.id);
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

      const body: Partial<UpdateBoardRequest> = req.body;
      const board = await BoardService.updateBoard(id, body);

      res.json(board);
    } catch (error) {
      console.error('Controller error - update board:', error);
      if (error instanceof Error && (error.message === 'Board not found or no changes made' || error.message.includes('Validation error'))) {
        res.status(error.message === 'Board not found or no changes made' ? 404 : 400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid board ID' });
        return;
      }

      const user = req.user!;

      // Check board ownership
      try {
        await checkBoardOwnership(id, user.id);
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

      await BoardService.deleteBoard(id);
      res.json({ message: 'Board deleted successfully' });
    } catch (error) {
      console.error('Controller error - delete board:', error);
      if (error instanceof Error && error.message === 'Board not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}