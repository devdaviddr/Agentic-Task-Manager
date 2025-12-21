import type { D1Database } from '@cloudflare/workers-types';
import type { Item, CreateItemRequest, MoveItemRequest } from '../types';

export class ItemModel {
  static async findByColumnId(db: D1Database, columnId: number): Promise<Item[]> {
    const stmt = db.prepare(`
      SELECT id, column_id, title, description, position, start_date, end_date, effort, label, priority, archived, created_at, updated_at
      FROM items
      WHERE column_id = ? AND archived = 0
      ORDER BY position
    `);
    const result = await stmt.bind(columnId).all();
    
    const items = [];
    for (const item of result.results) {
      const fullItem = await this.getItemWithRelations(db, item);
      items.push(fullItem);
    }
    
    return items;
  }

  static async findById(db: D1Database, id: number): Promise<Item | null> {
    const stmt = db.prepare(`
      SELECT id, column_id, title, description, position, start_date, end_date, effort, label, priority, archived, created_at, updated_at
      FROM items
      WHERE id = ?
    `);
    const result = await stmt.bind(id).first();
    
    if (!result) return null;
    
    return this.getItemWithRelations(db, result);
  }

  static async create(db: D1Database, columnId: number, itemData: CreateItemRequest): Promise<Item> {
    // Get the highest position for this column
    const positionStmt = db.prepare(`
      SELECT COALESCE(MAX(position), -1) + 1 as next_position
      FROM items
      WHERE column_id = ?
    `);
    const positionResult = await positionStmt.bind(columnId).first();
    const position = itemData.position ?? positionResult?.next_position ?? 0;

    const stmt = db.prepare(`
      INSERT INTO items (column_id, title, description, position, start_date, end_date, effort, label, priority, archived, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, column_id, title, description, position, start_date, end_date, effort, label, priority, archived, created_at, updated_at
    `);
    
    const result = await stmt.bind(
      columnId,
      itemData.title,
      itemData.description || null,
      position,
      itemData.start_date || null,
      itemData.end_date || null,
      itemData.effort || null,
      itemData.label || null,
      itemData.priority || null
    ).first();

    if (!result) {
      throw new Error('Failed to create item');
    }

    const item = this.mapToItem(result);

    // Handle tags if provided
    if (itemData.tag_ids && itemData.tag_ids.length > 0) {
      for (const tagId of itemData.tag_ids) {
        const tagStmt = db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)');
        await tagStmt.bind(item.id, tagId).run();
      }
    }

    // Handle users if provided
    if (itemData.user_ids && itemData.user_ids.length > 0) {
      for (const userId of itemData.user_ids) {
        const userStmt = db.prepare('INSERT INTO item_users (item_id, user_id) VALUES (?, ?)');
        await userStmt.bind(item.id, userId).run();
      }
    }

    // Fetch the complete item with tags and users
    return await this.findById(db, item.id) as Item;
  }

  static async update(db: D1Database, id: number, itemData: Partial<CreateItemRequest>): Promise<Item | null> {
    // Check if item exists
    const existingItem = await this.findById(db, id);
    if (!existingItem) return null;

    const fields = [];
    const values = [];

    if (itemData.title !== undefined) {
      fields.push('title = ?');
      values.push(itemData.title);
    }

    if (itemData.description !== undefined) {
      fields.push('description = ?');
      values.push(itemData.description);
    }

    if (itemData.position !== undefined) {
      fields.push('position = ?');
      values.push(itemData.position);
    }

    if (itemData.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(itemData.start_date);
    }

    if (itemData.end_date !== undefined) {
      fields.push('end_date = ?');
      values.push(itemData.end_date);
    }

    if (itemData.effort !== undefined) {
      fields.push('effort = ?');
      values.push(itemData.effort);
    }

    if ('label' in itemData) {
      fields.push('label = ?');
      values.push(itemData.label || null);
    }

    if ('priority' in itemData) {
      fields.push('priority = ?');
      values.push(itemData.priority || null);
    }

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`
        UPDATE items
        SET ${fields.join(', ')}
        WHERE id = ?
      `);
      
      await stmt.bind(...values).run();
    }

    // Handle tags if provided
    if (itemData.tag_ids !== undefined) {
      // Remove all existing tags for this item
      const deleteTagsStmt = db.prepare('DELETE FROM item_tags WHERE item_id = ?');
      await deleteTagsStmt.bind(id).run();

      // Add new tags if any
      if (itemData.tag_ids.length > 0) {
        for (const tagId of itemData.tag_ids) {
          const tagStmt = db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)');
          await tagStmt.bind(id, tagId).run();
        }
      }
    }

    // Handle users if provided
    if (itemData.user_ids !== undefined) {
      // Remove all existing users for this item
      const deleteUsersStmt = db.prepare('DELETE FROM item_users WHERE item_id = ?');
      await deleteUsersStmt.bind(id).run();

      // Add new users if any
      if (itemData.user_ids.length > 0) {
        // Check which users exist first
        for (const userId of itemData.user_ids) {
          const userExistsStmt = db.prepare('SELECT id FROM users WHERE id = ?');
          const userExists = await userExistsStmt.bind(userId).first();
          
          if (userExists) {
            const userStmt = db.prepare('INSERT INTO item_users (item_id, user_id) VALUES (?, ?)');
            await userStmt.bind(id, userId).run();
          }
        }
      }
    }

    // Fetch the complete item with tags and users
    return await this.findById(db, id);
  }

  static async delete(db: D1Database, id: number): Promise<boolean> {
    const stmt = db.prepare('DELETE FROM items WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.success && result.meta.changes > 0;
  }

  static async archive(db: D1Database, id: number, archived: boolean = true): Promise<Item | null> {
    const stmt = db.prepare(`
      UPDATE items
      SET archived = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = await stmt.bind(archived ? 1 : 0, id).run();

    if (!result.success || result.meta.changes === 0) {
      return null;
    }

    // Fetch the complete item with tags
    return await this.findById(db, id);
  }

  static async assignUser(db: D1Database, itemId: number, userId: number): Promise<boolean> {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO item_users (item_id, user_id)
      VALUES (?, ?)
    `);
    const result = await stmt.bind(itemId, userId).run();
    return result.success;
  }

  static async removeUser(db: D1Database, itemId: number, userId: number): Promise<boolean> {
    const stmt = db.prepare(`
      DELETE FROM item_users
      WHERE item_id = ? AND user_id = ?
    `);
    const result = await stmt.bind(itemId, userId).run();
    return result.success && result.meta.changes > 0;
  }

  static async move(db: D1Database, id: number, moveData: MoveItemRequest): Promise<Item | null> {
    // Get current item info
    const currentItemStmt = db.prepare('SELECT id, column_id, position FROM items WHERE id = ?');
    const currentItemResult = await currentItemStmt.bind(id).first();
    
    if (!currentItemResult) return null;

    const oldColumnId = currentItemResult.column_id as number;
    const oldPosition = currentItemResult.position as number;
    const { column_id: newColumnId, position: newPosition } = moveData;

    try {
      if (oldColumnId === newColumnId) {
        // Moving within the same column
        if (newPosition > oldPosition) {
          // Moving down: shift items between old and new position up
          const stmt1 = db.prepare(`
            UPDATE items
            SET position = position - 1, updated_at = CURRENT_TIMESTAMP
            WHERE column_id = ? AND position > ? AND position <= ?
          `);
          await stmt1.bind(oldColumnId, oldPosition, newPosition).run();
        } else if (newPosition < oldPosition) {
          // Moving up: shift items between new and old position down
          const stmt2 = db.prepare(`
            UPDATE items
            SET position = position + 1, updated_at = CURRENT_TIMESTAMP
            WHERE column_id = ? AND position >= ? AND position < ?
          `);
          await stmt2.bind(oldColumnId, newPosition, oldPosition).run();
        }
        // If same position, do nothing
      } else {
        // Moving to a different column
        // 1. Shift items in old column down to fill the gap
        const stmt3 = db.prepare(`
          UPDATE items
          SET position = position - 1, updated_at = CURRENT_TIMESTAMP
          WHERE column_id = ? AND position > ?
        `);
        await stmt3.bind(oldColumnId, oldPosition).run();

        // 2. Shift items in new column up to make space
        const stmt4 = db.prepare(`
          UPDATE items
          SET position = position + 1, updated_at = CURRENT_TIMESTAMP
          WHERE column_id = ? AND position >= ?
        `);
        await stmt4.bind(newColumnId, newPosition).run();
      }

      // Update the item
      const stmt5 = db.prepare(`
        UPDATE items
        SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      await stmt5.bind(newColumnId, newPosition, id).run();

      // Fetch the complete item with tags
      return await this.findById(db, id);
    } catch (error) {
      console.error('Error moving item:', error);
      throw error;
    }
  }

  // Helper method to get item with tags and assigned users
  private static async getItemWithRelations(db: D1Database, itemRow: any): Promise<Item> {
    const item = this.mapToItem(itemRow);
    
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
    
    return {
      ...item,
      tags: tagsResult.results.map(row => this.mapToTag(row)),
      assigned_users: usersResult.results.map(row => this.mapToUser(row))
    };
  }

  // Helper method to map D1 result to Item type
  private static mapToItem(row: any): Item {
    return {
      id: row.id,
      column_id: row.column_id,
      title: row.title,
      description: row.description,
      position: row.position,
      start_date: row.start_date ? new Date(row.start_date) : undefined,
      end_date: row.end_date ? new Date(row.end_date) : undefined,
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
