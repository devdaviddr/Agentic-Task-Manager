import type { D1Database } from '@cloudflare/workers-types';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types';

export class TaskModel {
  static async findAll(db: D1Database): Promise<Task[]> {
    const stmt = db.prepare(`
      SELECT id, title, description, completed, user_id, created_at, updated_at
      FROM tasks
      ORDER BY created_at DESC
    `);
    const result = await stmt.all();
    return result.results.map(row => this.mapToTask(row));
  }

  static async findById(db: D1Database, id: number): Promise<Task | null> {
    const stmt = db.prepare(`
      SELECT id, title, description, completed, user_id, created_at, updated_at
      FROM tasks
      WHERE id = ?
    `);
    const result = await stmt.bind(id).first();
    return result ? this.mapToTask(result) : null;
  }

  static async findByUserId(db: D1Database, userId: number): Promise<Task[]> {
    const stmt = db.prepare(`
      SELECT id, title, description, completed, user_id, created_at, updated_at
      FROM tasks
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    const result = await stmt.bind(userId).all();
    return result.results.map(row => this.mapToTask(row));
  }

  static async create(db: D1Database, taskData: CreateTaskRequest & { user_id: number }): Promise<Task> {
    const stmt = db.prepare(`
      INSERT INTO tasks (title, description, completed, user_id, created_at, updated_at)
      VALUES (?, ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, title, description, completed, user_id, created_at, updated_at
    `);
    const result = await stmt.bind(taskData.title, taskData.description || null, taskData.user_id).first();
    if (!result) {
      throw new Error('Failed to create task');
    }
    return this.mapToTask(result);
  }

  static async update(db: D1Database, id: number, taskData: UpdateTaskRequest): Promise<Task | null> {
    const fields = [];
    const values = [];

    if (taskData.title !== undefined) {
      fields.push('title = ?');
      values.push(taskData.title);
    }

    if (taskData.description !== undefined) {
      fields.push('description = ?');
      values.push(taskData.description);
    }

    if (taskData.completed !== undefined) {
      fields.push('completed = ?');
      values.push(taskData.completed ? 1 : 0);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`
      UPDATE tasks
      SET ${fields.join(', ')}
      WHERE id = ?
      RETURNING id, title, description, completed, user_id, created_at, updated_at
    `);
    
    const result = await stmt.bind(...values).first();
    return result ? this.mapToTask(result) : null;
  }

  static async delete(db: D1Database, id: number): Promise<boolean> {
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = await stmt.bind(id).run();
    return result.success && result.meta.changes > 0;
  }

  // Helper method to map D1 result to Task type
  private static mapToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      completed: Boolean(row.completed),
      user_id: row.user_id,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    };
  }
}