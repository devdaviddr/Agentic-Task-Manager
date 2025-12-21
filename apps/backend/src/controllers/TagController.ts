import type { Context } from 'hono';
import { TagService } from '../services/TagService';
import type { CreateTagRequest } from '../types';

export class TagController {
  static async getAll(c: Context) {
    try {
      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }
      
      const tags = await TagService.getAllTags(db);
      return c.json(tags);
    } catch (error) {
      console.error('Controller error - getAll tags:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async get(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid tag ID' }, 400);
      }

      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }

      const tag = await TagService.getTagById(db, id);
      return c.json(tag);
    } catch (error) {
      console.error('Controller error - get tag:', error);
      if (error instanceof Error && error.message === 'Tag not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async create(c: Context) {
    try {
      const body: CreateTagRequest = await c.req.json();

      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }

      const tag = await TagService.createTag(db, body);
      return c.json(tag, 201);
    } catch (error) {
      console.error('Controller error - create tag:', error);
      if (error instanceof Error && error.message.includes('Validation error')) {
        return c.json({ error: error.message }, 400);
      }
      if (error instanceof Error && error.message === 'Tag with this name already exists') {
        return c.json({ error: error.message }, 409);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async update(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid tag ID' }, 400);
      }

      const body: Partial<CreateTagRequest> = await c.req.json();

      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }

      const tag = await TagService.updateTag(db, id, body);
      return c.json(tag);
    } catch (error) {
      console.error('Controller error - update tag:', error);
      if (error instanceof Error && (error.message === 'Tag not found or no changes made' || error.message.includes('Validation error') || error.message === 'Tag with this name already exists')) {
        const status = error.message === 'Tag not found or no changes made' ? 404 : 400;
        return c.json({ error: error.message }, status);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }

  static async delete(c: Context) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ error: 'Invalid tag ID' }, 400);
      }

      const db = (c.env as any)?.DB;
      if (!db) {
        return c.json({ error: 'Database not available' }, 500);
      }

      await TagService.deleteTag(db, id);
      return c.json({ message: 'Tag deleted successfully' });
    } catch (error) {
      console.error('Controller error - delete tag:', error);
      if (error instanceof Error && error.message === 'Tag not found') {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
}