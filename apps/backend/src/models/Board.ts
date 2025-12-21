import type { D1Database } from '@cloudflare/workers-types';
import type { Board, CreateBoardRequest, UpdateBoardRequest, BoardWithColumns } from '../types';

export class BoardModel {
  static async findAll(db: D1Database, userId: number = 1): Promise<Board[]> {
    const stmt = db.prepare(`
      SELECT id, name, description, background, column_theme, archived, user_id, created_at, updated_at
      FROM boards
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    const result = await stmt.bind(userId).all();
    return result.results.map(row => this.mapToBoard(row));
  }

  static async findById(db: D1Database, id: number): Promise<Board | null> {
    const stmt = db.prepare(`
      SELECT id, name, description, background, column_theme, archived, user_id, created_at, updated_at
      FROM boards
      WHERE id = ?
    `);
    const result = await stmt.bind(id).first();
    return result ? this.mapToBoard(result) : null;
  }

  static async findByIdWithColumns(db: D1Database, id: number): Promise<BoardWithColumns | null> {
    // First get the board
    const board = await this.findById(db, id);
    if (!board) return null;

    // Then get columns with their items
    const columnsStmt = db.prepare(`
      SELECT id, board_id, name, position, created_at, updated_at
      FROM columns
      WHERE board_id = ?
      ORDER BY position
    `);
    const columnsResult = await columnsStmt.bind(id).all();
    
    const columns = [];
    for (const column of columnsResult.results) {
      // Get items for this column
      const itemsStmt = db.prepare(`
        SELECT id, column_id, title, description, position, start_date, end_date, effort, label, priority, archived, created_at, updated_at
        FROM items
        WHERE column_id = ? AND archived = 0
        ORDER BY position
      `);
      const itemsResult = await itemsStmt.bind(column.id).all();
      
      const items = [];
      for (const item of itemsResult.results) {
        // Get tags for this item
        const tagsStmt = db.prepare(`
          SELECT t.id, t.name, t.color, t.created_at, t.updated_at
          FROM tags t
          INNER JOIN item_tags it ON t.id = it.tag_id
          WHERE it.item_id = ?
        `);
        const tagsResult = await tagsStmt.bind(item.id).all();
        
        // Get assigned users for this item
        const usersStmt = db.prepare(`
          SELECT u.id, u.email, u.firebase_uid, u.name, u.role, u.created_at, u.updated_at
          FROM users u
          INNER JOIN item_users iu ON u.id = iu.user_id
          WHERE iu.item_id = ?
        `);
        const usersResult = await usersStmt.bind(item.id).all();
        
        items.push({
          ...this.mapToItem(item),
          tags: tagsResult.results.map(row => this.mapToTag(row)),
          assigned_users: usersResult.results.map(row => this.mapToUser(row))
        });
      }
      
      columns.push({
        ...this.mapToColumn(column),
        items
      });
    }

    return {
      ...board,
      columns
    };
  }

  static async create(db: D1Database, boardData: CreateBoardRequest, userId: number): Promise<Board> {
    const stmt = db.prepare(`
      INSERT INTO boards (name, description, background, column_theme, archived, user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, description, background, column_theme, archived, user_id, created_at, updated_at
    `);
    const result = await stmt.bind(
      boardData.name,
      boardData.description || null,
      boardData.background || 'bg-gray-50',
      boardData.column_theme || 'light',
      boardData.archived ? 1 : 0,
      userId
    ).first();
    
    if (!result) {
      throw new Error('Failed to create board');
    }
    
    return this.mapToBoard(result);
  }

   static async update(db: D1Database, id: number, boardData: Partial<UpdateBoardRequest>): Promise<Board | null> {
     const fields = [];
     const values = [];

     if (boardData.name !== undefined) {
       fields.push('name = ?');
       values.push(boardData.name);
     }

     if (boardData.description !== undefined) {
       fields.push('description = ?');
       values.push(boardData.description);
     }

     if ('background' in boardData) {
       fields.push('background = ?');
       values.push(boardData.background);
     }

     if ('column_theme' in boardData) {
       fields.push('column_theme = ?');
       values.push(boardData.column_theme);
     }

     if ('archived' in boardData) {
       fields.push('archived = ?');
       values.push(boardData.archived ? 1 : 0);
     }

     if (fields.length === 0) {
       return null;
     }

     fields.push('updated_at = CURRENT_TIMESTAMP');
     values.push(id);

     const stmt = db.prepare(`
       UPDATE boards
       SET ${fields.join(', ')}
       WHERE id = ?
       RETURNING id, name, description, background, column_theme, archived, user_id, created_at, updated_at
     `);

     const result = await stmt.bind(...values).first();
     return result ? this.mapToBoard(result) : null;
   }

  static async delete(db: D1Database, id: number): Promise<boolean> {
    const stmt = db.prepare('DELETE FROM boards WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.success && result.meta.changes > 0;
  }

  // Helper method to map D1 result to Board type
  private static mapToBoard(row: any): Board {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      background: row.background,
      column_theme: row.column_theme,
      archived: Boolean(row.archived),
      user_id: row.user_id,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  // Helper method to map D1 result to Column type
  private static mapToColumn(row: any) {
    return {
      id: row.id,
      board_id: row.board_id,
      name: row.name,
      position: row.position,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  // Helper method to map D1 result to Item type
  private static mapToItem(row: any) {
    return {
      id: row.id,
      column_id: row.column_id,
      title: row.title,
      description: row.description,
      position: row.position,
      start_date: row.start_date,
      end_date: row.end_date,
      effort: row.effort,
      label: row.label,
      priority: row.priority,
      archived: Boolean(row.archived),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  // Helper method to map D1 result to Tag type
  private static mapToTag(row: any) {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }

  // Helper method to map D1 result to User type
  private static mapToUser(row: any) {
    return {
      id: row.id,
      email: row.email,
      firebase_uid: row.firebase_uid,
      name: row.name,
      role: row.role,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}