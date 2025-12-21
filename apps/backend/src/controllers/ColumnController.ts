import type { Context } from 'hono';
import { ColumnService } from '../services/ColumnService';
import type { CreateColumnRequest } from '../types';
import { checkBoardOwnership, checkBoardOwnershipViaColumn, checkBoardAccess } from '../utils/auth';

export class ColumnController {
  static async getByBoard(c: Context) {
    try {
      const boardId = parseInt(c.req.param('boardId'));
      if (isNaN(boardId)) {
        return c.json({ error: 'Invalid board ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board access (owner or assigned to tasks)
      try {
        await checkBoardAccess(db, boardId, user.id);
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

      const columns = await ColumnService.getColumnsByBoard(db, boardId);
      return c.json(columns);
    } catch (error) {
      console.error('Controller error - getByBoard columns:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async create(c: Context) {
    try {
      const boardId = parseInt(c.req.param('boardId'));
      if (isNaN(boardId)) {
        return c.json({ error: 'Invalid board ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership
      try {
        await checkBoardOwnership(db, boardId, user.id);
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

      const body: CreateColumnRequest = await c.req.json();

      const column = await ColumnService.createColumn(db, boardId, body);
      return c.json(column, 201);
    } catch (error) {
      console.error('Controller error - create column:', error);
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
        return c.json({ error: 'Invalid column ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership via column
      try {
        await checkBoardOwnershipViaColumn(db, id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Column not found' || error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      const body: Partial<CreateColumnRequest> = await c.req.json();
      const column = await ColumnService.updateColumn(db, id, body);

      return c.json(column);
    } catch (error) {
      console.error('Controller error - update column:', error);
      if (error instanceof Error && (error.message === 'Column not found or no changes made' || error.message.includes('Validation error'))) {
        return c.json({ error: error.message }, error.message === 'Column not found or no changes made' ? 404 : 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async delete(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid column ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership via column
      try {
        await checkBoardOwnershipViaColumn(db, id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Column not found' || error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      await ColumnService.deleteColumn(db, id);
      return c.json({ message: 'Column deleted successfully' });
    } catch (error) {
      console.error('Controller error - delete column:', error);
      if (error instanceof Error && error.message === 'Column not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async move(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid column ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership via column
      try {
        await checkBoardOwnershipViaColumn(db, id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Column not found' || error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      const body = await c.req.json();
      const position = body.position;

      if (typeof position !== 'number' || position < 0) {
        return c.json({ error: 'Invalid position' }, 400);
      }

      const column = await ColumnService.moveColumn(db, id, position);
      return c.json(column);
    } catch (error) {
      console.error('Controller error - move column:', error);
      if (error instanceof Error && error.message === 'Column not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
}