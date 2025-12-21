import type { Context } from 'hono';
import { BoardService } from '../services/BoardService';
import type { CreateBoardRequest, UpdateBoardRequest } from '../types';
import { checkBoardOwnership, checkBoardAccess } from '../utils/auth';

export class BoardController {
  static async getAll(c: Context) {
    try {
      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      const boards = await BoardService.getAllBoards(db, user.id);
      return c.json(boards);
    } catch (error) {
      console.error('Controller error - getAll boards:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async getById(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid board ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board access (owner or assigned to tasks)
      try {
        await checkBoardAccess(db, id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      const board = await BoardService.getBoardById(db, id);
      return c.json(board);
    } catch (error) {
      console.error('Controller error - getById board:', error);
      if (error instanceof Error && error.message === 'Board not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async getWithColumns(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid board ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board access (owner or assigned to tasks)
      try {
        await checkBoardAccess(db, id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      const board = await BoardService.getBoardWithColumns(db, id);
      return c.json(board);
    } catch (error) {
      console.error('Controller error - getWithColumns board:', error);
      if (error instanceof Error && error.message === 'Board not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async create(c: Context) {
    try {
      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      const body: CreateBoardRequest = await c.req.json();

      const board = await BoardService.createBoard(db, body, user.id);
      return c.json(board, 201);
    } catch (error) {
      console.error('Controller error - create board:', error);
      if (error instanceof Error && error.message.includes('Validation error')) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async update(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid board ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership
      try {
        await checkBoardOwnership(db, id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      const body: Partial<UpdateBoardRequest> = await c.req.json();
      const board = await BoardService.updateBoard(db, id, body);

      return c.json(board);
    } catch (error) {
      console.error('Controller error - update board:', error);
      if (error instanceof Error && (error.message === 'Board not found or no changes made' || error.message.includes('Validation error'))) {
        return c.json({ error: error.message }, error.message === 'Board not found or no changes made' ? 404 : 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async delete(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid board ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership
      try {
        await checkBoardOwnership(db, id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      await BoardService.deleteBoard(db, id);
      return c.json({ message: 'Board deleted successfully' });
    } catch (error) {
      console.error('Controller error - delete board:', error);
      if (error instanceof Error && error.message === 'Board not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
}