import type { D1Database } from '@cloudflare/workers-types';
import type { Column, CreateColumnRequest } from '../types';

export class ColumnModel {
  static async findByBoardId(db: D1Database, boardId: number): Promise<Column[]> {
    const stmt = db.prepare(`
      SELECT id, board_id, name, position, created_at, updated_at
      FROM columns
      WHERE board_id = ?
      ORDER BY position
    `);
    const result = await stmt.bind(boardId).all();
    return result.results.map(row => this.mapToColumn(row));
  }

  static async findById(db: D1Database, id: number): Promise<Column | null> {
    const stmt = db.prepare(`
      SELECT id, board_id, name, position, created_at, updated_at
      FROM columns
      WHERE id = ?
    `);
    const result = await stmt.bind(id).first();
    return result ? this.mapToColumn(result) : null;
  }

  static async create(db: D1Database, boardId: number, columnData: CreateColumnRequest): Promise<Column> {
    // Get the highest position for this board
    const positionStmt = db.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as next_position
      FROM columns
      WHERE board_id = ?
    `);
    const positionResult = await positionStmt.bind(boardId).first();
    const position = columnData.position ?? positionResult?.next_position ?? 0;

    const stmt = db.prepare(`
      INSERT INTO columns (board_id, name, position, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, board_id, name, position, created_at, updated_at
    `);
    const result = await stmt.bind(boardId, columnData.name, position).first();
    
    if (!result) {
      throw new Error('Failed to create column');
    }
    
    return this.mapToColumn(result);
  }

  static async update(db: D1Database, id: number, columnData: Partial<CreateColumnRequest>): Promise<Column | null> {
    const fields = [];
    const values = [];

    if (columnData.name !== undefined) {
      fields.push('name = ?');
      values.push(columnData.name);
    }

    if (columnData.position !== undefined) {
      fields.push('position = ?');
      values.push(columnData.position);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE columns
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING id, board_id, name, position, created_at, updated_at
    `);
    
    const result = await stmt.bind(...values).first();
    return result ? this.mapToColumn(result) : null;
  }

  static async delete(db: D1Database, id: number): Promise<boolean> {
    const stmt = db.prepare('DELETE FROM columns WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.success && result.meta.changes > 0;
  }

  static async moveColumn(db: D1Database, id: number, newPosition: number): Promise<Column | null> {
    // Get current column info
    const currentColumn = await this.findById(db, id);
    if (!currentColumn) return null;

    // D1 doesn't support transactions, so we'll do our best with individual operations
    // This could potentially cause race conditions in high-concurrency scenarios
    
    try {
      // Shift other columns
      if (newPosition > currentColumn.position) {
        // Moving down: shift items between old and new position up
        const stmt1 = db.prepare(`
          UPDATE columns
          SET position = position - 1, updated_at = CURRENT_TIMESTAMP
          WHERE board_id = ? AND position > ? AND position <= ?
        `);
        await stmt1.bind(currentColumn.board_id, currentColumn.position, newPosition).run();
      } else {
        // Moving up: shift items between new and old position down
        const stmt2 = db.prepare(`
          UPDATE columns
          SET position = position + 1, updated_at = CURRENT_TIMESTAMP
          WHERE board_id = ? AND position >= ? AND position < ?
        `);
        await stmt2.bind(currentColumn.board_id, newPosition, currentColumn.position).run();
      }

      // Update the column position
      const stmt3 = db.prepare(`
        UPDATE columns
        SET position = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        RETURNING id, board_id, name, position, created_at, updated_at
      `);
      const result = await stmt3.bind(newPosition, id).first();
      
      return result ? this.mapToColumn(result) : null;
    } catch (error) {
      // In case of error, we can't rollback in D1
      console.error('Error moving column:', error);
      throw error;
    }
  }

  // Helper method to map D1 result to Column type
  private static mapToColumn(row: any): Column {
    return {
      id: row.id,
      board_id: row.board_id,
      name: row.name,
      position: row.position,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}