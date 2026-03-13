import type { Request, Response } from 'express';
import { TagService } from '../services/TagService';
import type { CreateTagRequest } from '../types';

export class TagController {
  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const tags = await TagService.getAllTags();
      res.json(tags);
    } catch (error) {
      console.error('Controller error - getAll tags:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async get(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid tag ID' });
        return;
      }

      const tag = await TagService.getTagById(id);
      res.json(tag);
    } catch (error) {
      console.error('Controller error - get tag:', error);
      if (error instanceof Error && error.message === 'Tag not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const body: CreateTagRequest = req.body;

      const tag = await TagService.createTag(body);
      res.status(201).json(tag);
    } catch (error) {
      console.error('Controller error - create tag:', error);
      if (error instanceof Error && error.message.includes('Validation error')) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error instanceof Error && error.message === 'Tag with this name already exists') {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid tag ID' });
        return;
      }

      const body: Partial<CreateTagRequest> = req.body;

      const tag = await TagService.updateTag(id, body);
      res.json(tag);
    } catch (error) {
      console.error('Controller error - update tag:', error);
      if (error instanceof Error && (error.message === 'Tag not found or no changes made' || error.message.includes('Validation error') || error.message === 'Tag with this name already exists')) {
        const status = error.message === 'Tag not found or no changes made' ? 404 : 400;
        res.status(status).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid tag ID' });
        return;
      }

      await TagService.deleteTag(id);
      res.json({ message: 'Tag deleted successfully' });
    } catch (error) {
      console.error('Controller error - delete tag:', error);
      if (error instanceof Error && error.message === 'Tag not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}