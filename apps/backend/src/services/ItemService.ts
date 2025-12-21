import type { D1Database } from '@cloudflare/workers-types';
import { ItemModel } from '../models/Item';
import type { Item, CreateItemRequest, MoveItemRequest } from '../types';

export class ItemService {
  static async getItemsByColumn(db: D1Database, columnId: number): Promise<Item[]> {
    try {
      return await ItemModel.findByColumnId(db, columnId);
    } catch (error) {
      console.error('Service error - getItemsByColumn:', error);
      throw new Error('Failed to retrieve items');
    }
  }

  static async getItemById(db: D1Database, id: number): Promise<Item> {
    try {
      const item = await ItemModel.findById(db, id);
      if (!item) {
        throw new Error('Item not found');
      }
      return item;
    } catch (error) {
      console.error('Service error - getItemById:', error);
      if (error instanceof Error && error.message === 'Item not found') {
        throw error;
      }
      throw new Error('Failed to retrieve item');
    }
  }

  static async createItem(db: D1Database, columnId: number, itemData: CreateItemRequest): Promise<Item> {
    try {
      // Business logic validation
      this.validateCreateItemData(itemData);

      return await ItemModel.create(db, columnId, itemData);
    } catch (error) {
      console.error('Service error - createItem:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('validation')) {
        throw error;
      }
      // Re-throw database constraint errors
      if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
        throw error;
      }
      throw new Error('Failed to create item');
    }
  }

  static async updateItem(db: D1Database, id: number, itemData: Partial<CreateItemRequest>): Promise<Item> {
    try {
      // Business logic validation
      this.validateUpdateItemData(itemData);

      const item = await ItemModel.update(db, id, itemData);
      if (!item) {
        throw new Error('Item not found or no changes made');
      }
      return item;
    } catch (error) {
      console.error('Service error - updateItem:', error);
      if (error instanceof Error && (error.message === 'Item not found or no changes made' || error.message.includes('validation'))) {
        throw error;
      }
      throw new Error('Failed to update item');
    }
  }

  static async moveItem(db: D1Database, id: number, moveData: MoveItemRequest): Promise<Item> {
    try {
      // Business logic validation
      this.validateMoveItemData(moveData);

      const item = await ItemModel.move(db, id, moveData);
      if (!item) {
        throw new Error('Item not found');
      }
      return item;
    } catch (error) {
      console.error('Service error - moveItem:', error);
      if (error instanceof Error && (error.message === 'Item not found' || error.message.includes('Validation error'))) {
        throw error;
      }
      throw new Error('Failed to move item');
    }
  }

  static async deleteItem(db: D1Database, id: number): Promise<void> {
    try {
      const deleted = await ItemModel.delete(db, id);
      if (!deleted) {
        throw new Error('Item not found');
      }
    } catch (error) {
      console.error('Service error - deleteItem:', error);
      if (error instanceof Error && error.message === 'Item not found') {
        throw error;
      }
      throw new Error('Failed to delete item');
    }
  }

  static async archiveItem(db: D1Database, id: number, archived: boolean = true): Promise<Item> {
    try {
      const item = await ItemModel.archive(db, id, archived);
      if (!item) {
        throw new Error('Item not found');
      }
      return item;
    } catch (error) {
      console.error('Service error - archiveItem:', error);
      if (error instanceof Error && error.message === 'Item not found') {
        throw error;
      }
      throw new Error('Failed to archive item');
    }
  }

  static async assignUserToItem(db: D1Database, itemId: number, userId: number): Promise<boolean> {
    try {
      return await ItemModel.assignUser(db, itemId, userId);
    } catch (error) {
      console.error('Service error - assignUserToItem:', error);
      throw new Error('Failed to assign user to item');
    }
  }

  static async removeUserFromItem(db: D1Database, itemId: number, userId: number): Promise<boolean> {
    try {
      return await ItemModel.removeUser(db, itemId, userId);
    } catch (error) {
      console.error('Service error - removeUserFromItem:', error);
      throw new Error('Failed to remove user from item');
    }
  }

  private static validateCreateItemData(data: CreateItemRequest): void {
    if (!data.title || typeof data.title !== 'string') {
      throw new Error('Validation error: Title is required and must be a string');
    }

    if (data.title.trim().length === 0) {
      throw new Error('Validation error: Title cannot be empty');
    }

    if (data.title.length > 255) {
      throw new Error('Validation error: Title cannot exceed 255 characters');
    }

    if (data.description && typeof data.description !== 'string') {
      throw new Error('Validation error: Description must be a string');
    }

    if (data.position !== undefined && (typeof data.position !== 'number' || data.position < 0)) {
      throw new Error('Validation error: Position must be a non-negative number');
    }

    if (data.start_date !== undefined && !(data.start_date instanceof Date)) {
      throw new Error('Validation error: Start date must be a valid date');
    }

    if (data.end_date !== undefined && !(data.end_date instanceof Date)) {
      throw new Error('Validation error: End date must be a valid date');
    }

    if (data.start_date && data.end_date && data.start_date > data.end_date) {
      throw new Error('Validation error: Start date cannot be after end date');
    }

    if (data.effort !== undefined && (typeof data.effort !== 'number' || data.effort < 0 || data.effort > 10)) {
      throw new Error('Validation error: Effort must be a number between 0 and 10');
    }

    if (data.label !== undefined && typeof data.label !== 'string') {
      throw new Error('Validation error: Label must be a string');
    }

    if (data.priority !== undefined && data.priority !== null && !['high', 'medium', 'low'].includes(data.priority)) {
      throw new Error('Validation error: Priority must be one of: high, medium, low');
    }

    if (data.tag_ids !== undefined && (!Array.isArray(data.tag_ids) || !data.tag_ids.every(id => typeof id === 'number'))) {
      throw new Error('Validation error: Tag IDs must be an array of numbers');
    }

    if (data.user_ids !== undefined && (!Array.isArray(data.user_ids) || !data.user_ids.every(id => typeof id === 'number'))) {
      throw new Error('Validation error: User IDs must be an array of numbers');
    }
  }

  private static validateUpdateItemData(data: Partial<CreateItemRequest>): void {
    if (data.title !== undefined) {
      if (typeof data.title !== 'string') {
        throw new Error('Validation error: Title must be a string');
      }

      if (data.title.trim().length === 0) {
        throw new Error('Validation error: Title cannot be empty');
      }

      if (data.title.length > 255) {
        throw new Error('Validation error: Title cannot exceed 255 characters');
      }
    }

    if (data.description !== undefined && typeof data.description !== 'string') {
      throw new Error('Validation error: Description must be a string');
    }

    if (data.position !== undefined && (typeof data.position !== 'number' || data.position < 0)) {
      throw new Error('Validation error: Position must be a non-negative number');
    }

    if (data.start_date !== undefined && !(data.start_date instanceof Date)) {
      throw new Error('Validation error: Start date must be a valid date');
    }

    if (data.end_date !== undefined && !(data.end_date instanceof Date)) {
      throw new Error('Validation error: End date must be a valid date');
    }

    if (data.start_date && data.end_date && data.start_date > data.end_date) {
      throw new Error('Validation error: Start date cannot be after end date');
    }

    if (data.effort !== undefined && (typeof data.effort !== 'number' || data.effort < 0 || data.effort > 10)) {
      throw new Error('Validation error: Effort must be a number between 0 and 10');
    }

    if (data.label !== undefined && data.label !== null && typeof data.label !== 'string') {
      throw new Error('Validation error: Label must be a string or null');
    }

    if (data.priority !== undefined && data.priority !== null && !['high', 'medium', 'low'].includes(data.priority)) {
      throw new Error('Validation error: Priority must be one of: high, medium, low');
    }

    if (data.tag_ids !== undefined && (!Array.isArray(data.tag_ids) || !data.tag_ids.every(id => typeof id === 'number'))) {
      throw new Error('Validation error: Tag IDs must be an array of numbers');
    }

    if (data.user_ids !== undefined && (!Array.isArray(data.user_ids) || !data.user_ids.every(id => typeof id === 'number'))) {
      throw new Error('Validation error: User IDs must be an array of numbers');
    }
  }

  private static validateMoveItemData(data: MoveItemRequest): void {
    if (typeof data.column_id !== 'number' || data.column_id <= 0) {
      throw new Error('Validation error: Column ID must be a positive number');
    }

    if (typeof data.position !== 'number' || data.position < 0) {
      throw new Error('Validation error: Position must be a non-negative number');
    }
  }
}