import type { Request, Response } from 'express';
import { ItemService } from '../services/ItemService';
import type { CreateItemRequest, MoveItemRequest } from '../types';
import { checkBoardOwnershipViaItem, checkBoardOwnershipViaColumn, checkBoardAccessViaItem, checkBoardAccessViaColumn } from '../utils/auth';

export class ItemController {
  static async get(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid item ID' });
        return;
      }

      const user = req.user!;

      // Check board access via item (owner or assigned to tasks)
      try {
        await checkBoardAccessViaItem(id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
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

      const item = await ItemService.getItemById(id);
      res.json(item);
    } catch (error) {
      console.error('Controller error - get item:', error);
      if (error instanceof Error && error.message === 'Item not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getByColumn(req: Request, res: Response): Promise<void> {
    try {
      const columnId = parseInt(req.params.columnId as string);
      if (isNaN(columnId)) {
        res.status(400).json({ error: 'Invalid column ID' });
        return;
      }

      const user = req.user!;

      // Check board access via column (owner or assigned to tasks)
      try {
        await checkBoardAccessViaColumn(columnId, user.id);
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

      const items = await ItemService.getItemsByColumn(columnId);
      res.json(items);
    } catch (error) {
      console.error('Controller error - getByColumn items:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const columnId = parseInt(req.params.columnId as string);
      if (isNaN(columnId)) {
        res.status(400).json({ error: 'Invalid column ID' });
        return;
      }

      const user = req.user!;

      // Check board ownership via column
      try {
        await checkBoardOwnershipViaColumn(columnId, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Column not found') {
            res.status(404).json({ error: error.message });
            return;
          }
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

      const body: CreateItemRequest = req.body;

      const item = await ItemService.createItem(columnId, body);
      res.status(201).json(item);
    } catch (error) {
      console.error('Controller error - create item:', error);
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
        res.status(400).json({ error: 'Invalid item ID' });
        return;
      }

      const user = req.user!;

      // Check board ownership via item
      try {
        await checkBoardOwnershipViaItem(id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
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

      const body = req.body;

      const item = await ItemService.updateItem(id, body);
      res.json(item);
    } catch (error) {
      console.error('Controller error - update item:', error);
      if (error instanceof Error && (error.message === 'Item not found or no changes made' || error.message.includes('Validation error'))) {
        res.status(error.message === 'Item not found or no changes made' ? 404 : 400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async move(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid item ID' });
        return;
      }

      const user = req.user!;

      // Check board ownership via item
      try {
        await checkBoardOwnershipViaItem(id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
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

      const body: MoveItemRequest = req.body;

      const item = await ItemService.moveItem(id, body);
      res.json(item);
    } catch (error) {
      console.error('Controller error - move item:', error);
      if (error instanceof Error && (error.message === 'Item not found' || error.message.includes('Validation error'))) {
        res.status(error.message === 'Item not found' ? 404 : 400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid item ID' });
        return;
      }

      const user = req.user!;

      // Check board ownership via item
      try {
        await checkBoardOwnershipViaItem(id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
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

      await ItemService.deleteItem(id);
      res.json({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error('Controller error - delete item:', error);
      if (error instanceof Error && error.message === 'Item not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async archive(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid item ID' });
        return;
      }

      const user = req.user!;

      // Check board ownership via item
      try {
        await checkBoardOwnershipViaItem(id, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
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

      const { archived } = req.body;
      const archivedValue = archived !== undefined ? archived : true;

      const item = await ItemService.archiveItem(id, archivedValue);
      res.json(item);
    } catch (error) {
      console.error('Controller error - archive item:', error);
      if (error instanceof Error && error.message === 'Item not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async assignUser(req: Request, res: Response): Promise<void> {
    try {
      const itemId = parseInt(req.params.id as string);
      if (isNaN(itemId)) {
        res.status(400).json({ error: 'Invalid item ID' });
        return;
      }

      const user = req.user!;

      // Check board ownership via item
      try {
        await checkBoardOwnershipViaItem(itemId, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
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

      const { user_id: userId } = req.body;
      if (typeof userId !== 'number') {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      const success = await ItemService.assignUserToItem(itemId, userId);
      if (!success) {
        res.status(500).json({ error: 'Failed to assign user' });
        return;
      }

      res.json({ message: 'User assigned successfully' });
    } catch (error) {
      console.error('Controller error - assign user to item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async removeUser(req: Request, res: Response): Promise<void> {
    try {
      const itemId = parseInt(req.params.id as string);
      const userId = parseInt(req.params.userId as string);
      if (isNaN(itemId) || isNaN(userId)) {
        res.status(400).json({ error: 'Invalid IDs' });
        return;
      }

      const user = req.user!;

      // Check board ownership via item
      try {
        await checkBoardOwnershipViaItem(itemId, user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Item not found' || error.message === 'Board not found') {
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

      const success = await ItemService.removeUserFromItem(itemId, userId);
      if (!success) {
        res.status(404).json({ error: 'User not assigned to item' });
        return;
      }

      res.json({ message: 'User removed successfully' });
    } catch (error) {
      console.error('Controller error - remove user from item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
