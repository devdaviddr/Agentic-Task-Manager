import type { Context } from 'hono';
import { ItemService } from '../services/ItemService';
import type { CreateItemRequest, MoveItemRequest } from '../types';
import { checkBoardOwnershipViaItem, checkBoardOwnershipViaColumn, checkBoardAccessViaItem, checkBoardAccessViaColumn } from '../utils/auth';

export class ItemController {
  static async get(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid item ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board access via item (owner or assigned to tasks)
      try {
        await checkBoardAccessViaItem(db, id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      const item = await ItemService.getItemById(db, id);
      return c.json(item);
    } catch (error) {
      console.error('Controller error - get item:', error);
      if (error instanceof Error && error.message === 'Item not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async getByColumn(c: Context) {
    try {
      const columnId = parseInt(c.req.param('columnId'));
      if (isNaN(columnId)) {
        return c.json({ error: 'Invalid column ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board access via column (owner or assigned to tasks)
      try {
        await checkBoardAccessViaColumn(db, columnId, user.id);
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

      const items = await ItemService.getItemsByColumn(db, columnId);
      return c.json(items);
    } catch (error) {
      console.error('Controller error - getByColumn items:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async create(c: Context) {
    try {
      const columnId = parseInt(c.req.param('columnId'));
      if (isNaN(columnId)) {
        return c.json({ error: 'Invalid column ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership via column
      try {
        await checkBoardOwnershipViaColumn(db, columnId, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Column not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      const body: CreateItemRequest = await c.req.json();

      // Parse dates from strings
      const itemData: CreateItemRequest = {
        ...body,
        start_date: body.start_date ? new Date(body.start_date) : undefined,
        end_date: body.end_date ? new Date(body.end_date) : undefined,
      };

      const item = await ItemService.createItem(db, columnId, itemData);
      return c.json(item, 201);
    } catch (error) {
      console.error('Controller error - create item:', error);
      if (error instanceof Error && error.message.includes('Validation error')) {
        return c.json({ error: error.message }, 400);
      }
      // Check for database constraint violations (foreign key, etc.)
      if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
        return c.json({ error: 'Invalid column ID' }, 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async update(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid item ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership via item
      try {
        await checkBoardOwnershipViaItem(db, id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      const body: Partial<CreateItemRequest> = await c.req.json();

      // Parse dates from strings
      const itemData: Partial<CreateItemRequest> = {
        ...body,
        start_date: body.start_date ? new Date(body.start_date) : undefined,
        end_date: body.end_date ? new Date(body.end_date) : undefined,
      };

      const item = await ItemService.updateItem(db, id, itemData);

      return c.json(item);
    } catch (error) {
      console.error('Controller error - update item:', error);
      if (error instanceof Error && (error.message === 'Item not found or no changes made' || error.message.includes('Validation error'))) {
        return c.json({ error: error.message }, error.message === 'Item not found or no changes made' ? 404 : 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async move(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid item ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership via item
      try {
        await checkBoardOwnershipViaItem(db, id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      const body: MoveItemRequest = await c.req.json();

      const item = await ItemService.moveItem(db, id, body);
      return c.json(item);
    } catch (error) {
      console.error('Controller error - move item:', error);
      if (error instanceof Error && (error.message === 'Item not found' || error.message.includes('Validation error'))) {
        return c.json({ error: error.message }, error.message === 'Item not found' ? 404 : 400);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async delete(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid item ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership via item
      try {
        await checkBoardOwnershipViaItem(db, id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      await ItemService.deleteItem(db, id);
      return c.json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Controller error - delete item:', error);
      if (error instanceof Error && error.message === 'Item not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async archive(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid item ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership via item
      try {
        await checkBoardOwnershipViaItem(db, id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      const body = await c.req.json();
      const archived = body.archived !== undefined ? body.archived : true;

      const item = await ItemService.archiveItem(db, id, archived);
      return c.json(item);
    } catch (error) {
      console.error('Controller error - archive item:', error);
      if (error instanceof Error && error.message === 'Item not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async assignUser(c: Context) {
    try {
      const itemId = parseInt(c.req.param('id'));
      if (isNaN(itemId)) {
        return c.json({ error: 'Invalid item ID' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership via item
      try {
        await checkBoardOwnershipViaItem(db, itemId, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      const body = await c.req.json();
      const userId = body.user_id;
      if (typeof userId !== 'number') {
        return c.json({ error: 'Invalid user ID' }, 400);
      }

      const success = await ItemService.assignUserToItem(db, itemId, userId);
      if (!success) {
        return c.json({ error: 'Failed to assign user' }, 500);
      }

      return c.json({ message: 'User assigned successfully' });
    } catch (error) {
      console.error('Controller error - assign user to item:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async removeUser(c: Context) {
    try {
      const itemId = parseInt(c.req.param('id'));
      const userId = parseInt(c.req.param('userId'));
      if (isNaN(itemId) || isNaN(userId)) {
        return c.json({ error: 'Invalid IDs' }, 400);
      }

      const user = c.get('user');
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      // Check board ownership via item
      try {
        await checkBoardOwnershipViaItem(db, itemId, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
            return c.json({ error: error.message }, 404);
          }
          if (error.message === 'Access denied') {
            return c.json({ error: error.message }, 403);
          }
        }
        throw error;
      }

      const success = await ItemService.removeUserFromItem(db, itemId, userId);
      if (!success) {
        return c.json({ error: 'User not assigned to item' }, 404);
      }

       return c.json({ message: 'User removed successfully' });
     } catch (error) {
       console.error('Controller error - remove user from item:', error);
       return c.json({ error: 'Internal server error' }, 500);
     }
   }
 }