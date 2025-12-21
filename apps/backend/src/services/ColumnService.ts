import type { D1Database } from '@cloudflare/workers-types';
import { ColumnModel } from '../models/Column';
import type { Column, CreateColumnRequest } from '../types';

export class ColumnService {
  static async getColumnsByBoard(db: D1Database, boardId: number): Promise<Column[]> {
    try {
      return await ColumnModel.findByBoardId(db, boardId);
    } catch (error) {
      console.error('Service error - getColumnsByBoard:', error);
      throw new Error('Failed to retrieve columns');
    }
  }

  static async getColumnById(db: D1Database, id: number): Promise<Column> {
    try {
      const column = await ColumnModel.findById(db, id);
      if (!column) {
        throw new Error('Column not found');
      }
      return column;
    } catch (error) {
      console.error('Service error - getColumnById:', error);
      if (error instanceof Error && error.message === 'Column not found') {
        throw error;
      }
      throw new Error('Failed to retrieve column');
    }
  }

  static async createColumn(db: D1Database, boardId: number, columnData: CreateColumnRequest): Promise<Column> {
    try {
      // Business logic validation
      this.validateCreateColumnData(columnData);

      return await ColumnModel.create(db, boardId, columnData);
    } catch (error) {
      console.error('Service error - createColumn:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('validation')) {
        throw error;
      }
      throw new Error('Failed to create column');
    }
  }

  static async updateColumn(db: D1Database, id: number, columnData: Partial<CreateColumnRequest>): Promise<Column> {
    try {
      // Business logic validation
      this.validateUpdateColumnData(columnData);

      const column = await ColumnModel.update(db, id, columnData);
      if (!column) {
        throw new Error('Column not found or no changes made');
      }
      return column;
    } catch (error) {
      console.error('Service error - updateColumn:', error);
      if (error instanceof Error && (error.message === 'Column not found or no changes made' || error.message.toLowerCase().includes('validation'))) {
        throw error;
      }
      throw new Error('Failed to update column');
    }
  }

  static async deleteColumn(db: D1Database, id: number): Promise<void> {
    try {
      const deleted = await ColumnModel.delete(db, id);
      if (!deleted) {
        throw new Error('Column not found');
      }
    } catch (error) {
      console.error('Service error - deleteColumn:', error);
      if (error instanceof Error && error.message === 'Column not found') {
        throw error;
      }
      throw new Error('Failed to delete column');
    }
  }

  static async moveColumn(db: D1Database, id: number, newPosition: number): Promise<Column> {
    try {
      const column = await ColumnModel.moveColumn(db, id, newPosition);
      if (!column) {
        throw new Error('Column not found');
      }
      return column;
    } catch (error) {
      console.error('Service error - moveColumn:', error);
      if (error instanceof Error && error.message === 'Column not found') {
        throw error;
      }
      throw new Error('Failed to move column');
    }
  }

  private static validateCreateColumnData(data: CreateColumnRequest): void {
    if (!data.name || typeof data.name !== 'string') {
      throw new Error('Validation error: Name is required and must be a string');
    }

    if (data.name.trim().length === 0) {
      throw new Error('Validation error: Name cannot be empty');
    }

    if (data.name.length > 100) {
      throw new Error('Validation error: Name cannot exceed 100 characters');
    }

    if (data.position !== undefined && (typeof data.position !== 'number' || data.position < 0)) {
      throw new Error('Validation error: Position must be a non-negative number');
    }
  }

  private static validateUpdateColumnData(data: Partial<CreateColumnRequest>): void {
    if (data.name !== undefined) {
      if (typeof data.name !== 'string') {
        throw new Error('Validation error: Name must be a string');
      }

      if (data.name.trim().length === 0) {
        throw new Error('Validation error: Name cannot be empty');
      }

      if (data.name.length > 100) {
        throw new Error('Validation error: Name cannot exceed 100 characters');
      }
    }

    if (data.position !== undefined && (typeof data.position !== 'number' || data.position < 0)) {
      throw new Error('Validation error: Position must be a non-negative number');
    }
  }
}