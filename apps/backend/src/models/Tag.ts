import type { D1Database } from '@cloudflare/workers-types';
import type { Tag, CreateTagRequest } from '../types';

export class TagModel {
  static async findAll(db: D1Database): Promise<Tag[]> {
    const stmt = db.prepare(`
      SELECT id, name, color, created_at, updated_at
      FROM tags
      ORDER BY name
    `);
    const result = await stmt.all();
    return result.results.map(row => this.mapToTag(row));
  }

  static async findById(db: D1Database, id: number): Promise<Tag | null> {
    const stmt = db.prepare(`
      SELECT id, name, color, created_at, updated_at
      FROM tags
      WHERE id = ?
    `);
    const result = await stmt.bind(id).first();
    return result ? this.mapToTag(result) : null;
  }

  static async findByName(db: D1Database, name: string): Promise<Tag | null> {
    const stmt = db.prepare(`
      SELECT id, name, color, created_at, updated_at
      FROM tags
      WHERE LOWER(name) = LOWER(?)
    `);
    const result = await stmt.bind(name).first();
    return result ? this.mapToTag(result) : null;
  }

  static async create(db: D1Database, tagData: CreateTagRequest): Promise<Tag> {
    const stmt = db.prepare(`
      INSERT INTO tags (name, color, created_at, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, name, color, created_at, updated_at
    `);
    const result = await stmt.bind(tagData.name, tagData.color || '#3B82F6').first();
    
    if (!result) {
      throw new Error('Failed to create tag');
    }
    
    return this.mapToTag(result);
  }

  static async update(db: D1Database, id: number, tagData: Partial<CreateTagRequest>): Promise<Tag | null> {
    const fields = [];
    const values = [];

    if (tagData.name !== undefined) {
      fields.push('name = ?');
      values.push(tagData.name);
    }

    if (tagData.color !== undefined) {
      fields.push('color = ?');
      values.push(tagData.color);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE tags
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING id, name, color, created_at, updated_at
    `);
    
    const result = await stmt.bind(...values).first();
    return result ? this.mapToTag(result) : null;
  }

  static async delete(db: D1Database, id: number): Promise<boolean> {
    const stmt = db.prepare('DELETE FROM tags WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.success && result.meta.changes > 0;
  }

  static async findByItemId(db: D1Database, itemId: number): Promise<Tag[]> {
    const stmt = db.prepare(`
      SELECT t.id, t.name, t.color, t.created_at, t.updated_at
      FROM tags t
      INNER JOIN item_tags it ON t.id = it.tag_id
      WHERE it.item_id = ?
      ORDER BY t.name
    `);
    const result = await stmt.bind(itemId).all();
    return result.results.map(row => this.mapToTag(row));
  }

  static async assignToItem(db: D1Database, itemId: number, tagId: number): Promise<void> {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO item_tags (item_id, tag_id)
      VALUES (?, ?)
    `);
    await stmt.bind(itemId, tagId).run();
  }

  static async removeFromItem(db: D1Database, itemId: number, tagId: number): Promise<void> {
    const stmt = db.prepare(`
      DELETE FROM item_tags
      WHERE item_id = ? AND tag_id = ?
    `);
    await stmt.bind(itemId, tagId).run();
  }

  static async setItemTags(db: D1Database, itemId: number, tagIds: number[]): Promise<void> {
    // D1 doesn't support transactions, so we'll do our best with individual operations
    
    // Remove all existing tags for this item
    const deleteStmt = db.prepare('DELETE FROM item_tags WHERE item_id = ?');
    await deleteStmt.bind(itemId).run();

    // Add new tags if any
    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        const insertStmt = db.prepare('INSERT INTO item_tags (item_id, tag_id) VALUES (?, ?)');
        await insertStmt.bind(itemId, tagId).run();
      }
    }
  }

  // Helper method to map D1 result to Tag type
  private static mapToTag(row: any): Tag {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}