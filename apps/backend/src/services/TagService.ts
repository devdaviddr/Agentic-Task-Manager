import type { D1Database } from '@cloudflare/workers-types';
import { TagModel } from '../models/Tag';
import type { Tag, CreateTagRequest } from '../types';

export class TagService {
  static async getAllTags(db: D1Database): Promise<Tag[]> {
    try {
      return await TagModel.findAll(db);
    } catch (error) {
      console.error('Service error - getAllTags:', error);
      throw new Error('Failed to retrieve tags');
    }
  }

  static async getTagById(db: D1Database, id: number): Promise<Tag> {
    try {
      const tag = await TagModel.findById(db, id);
      if (!tag) {
        throw new Error('Tag not found');
      }
      return tag;
    } catch (error) {
      console.error('Service error - getTagById:', error);
      if (error instanceof Error && error.message === 'Tag not found') {
        throw error;
      }
      throw new Error('Failed to retrieve tag');
    }
  }

  static async createTag(db: D1Database, tagData: CreateTagRequest): Promise<Tag> {
    try {
      // Business logic validation
      this.validateCreateTagData(tagData);

      // Check if tag with this name already exists
      const existingTag = await TagModel.findByName(db, tagData.name);
      if (existingTag) {
        throw new Error('Tag with this name already exists');
      }

      return await TagModel.create(db, tagData);
    } catch (error) {
      console.error('Service error - createTag:', error);
       if (error instanceof Error && (error.message.toLowerCase().includes('validation') || error.message === 'Tag with this name already exists')) {
         throw error;
       }
      throw new Error('Failed to create tag');
    }
  }

  static async updateTag(db: D1Database, id: number, tagData: Partial<CreateTagRequest>): Promise<Tag> {
    try {
      // Business logic validation
      this.validateUpdateTagData(tagData);

      // Check if another tag with this name already exists (excluding current tag)
      if (tagData.name) {
        const existingTag = await TagModel.findByName(db, tagData.name);
        if (existingTag && existingTag.id !== id) {
          throw new Error('Tag with this name already exists');
        }
      }

      const tag = await TagModel.update(db, id, tagData);
      if (!tag) {
        throw new Error('Tag not found or no changes made');
      }
      return tag;
    } catch (error) {
      console.error('Service error - updateTag:', error);
       if (error instanceof Error && (error.message === 'Tag not found or no changes made' || error.message.toLowerCase().includes('validation') || error.message === 'Tag with this name already exists')) {
         throw error;
       }
      throw new Error('Failed to update tag');
    }
  }

  static async deleteTag(db: D1Database, id: number): Promise<void> {
    try {
      const deleted = await TagModel.delete(db, id);
      if (!deleted) {
        throw new Error('Tag not found');
      }
    } catch (error) {
      console.error('Service error - deleteTag:', error);
      if (error instanceof Error && error.message === 'Tag not found') {
        throw error;
      }
      throw new Error('Failed to delete tag');
    }
  }

  static async getTagsByItemId(db: D1Database, itemId: number): Promise<Tag[]> {
    try {
      return await TagModel.findByItemId(db, itemId);
    } catch (error) {
      console.error('Service error - getTagsByItemId:', error);
      throw new Error('Failed to retrieve item tags');
    }
  }

  static async assignTagToItem(db: D1Database, itemId: number, tagId: number): Promise<void> {
    try {
      // Verify tag exists
      const tag = await TagModel.findById(db, tagId);
      if (!tag) {
        throw new Error('Tag not found');
      }

      await TagModel.assignToItem(db, itemId, tagId);
    } catch (error) {
      console.error('Service error - assignTagToItem:', error);
      if (error instanceof Error && error.message === 'Tag not found') {
        throw error;
      }
      throw new Error('Failed to assign tag to item');
    }
  }

  static async removeTagFromItem(db: D1Database, itemId: number, tagId: number): Promise<void> {
    try {
      await TagModel.removeFromItem(db, itemId, tagId);
    } catch (error) {
      console.error('Service error - removeTagFromItem:', error);
      throw new Error('Failed to remove tag from item');
    }
  }

  static async setItemTags(db: D1Database, itemId: number, tagIds: number[]): Promise<void> {
    try {
      // Validate that all tag IDs exist
      if (tagIds.length > 0) {
        const existingTags = await TagModel.findAll(db);
        const existingTagIds = existingTags.map(tag => tag.id);
        const invalidTagIds = tagIds.filter(id => !existingTagIds.includes(id));

        if (invalidTagIds.length > 0) {
          throw new Error(`Invalid tag IDs: ${invalidTagIds.join(', ')}`);
        }
      }

      await TagModel.setItemTags(db, itemId, tagIds);
    } catch (error) {
      console.error('Service error - setItemTags:', error);
      if (error instanceof Error && error.message.includes('Invalid tag IDs')) {
        throw error;
      }
      throw new Error('Failed to set item tags');
    }
  }

  private static validateCreateTagData(data: CreateTagRequest): void {
    // Check if name is a string first
    if (typeof data.name !== 'string') {
      throw new Error('Validation error: Name is required and must be a string');
    }

    // Then check if it's empty
    if (data.name.trim().length === 0) {
      throw new Error('Validation error: Name cannot be empty');
    }

    if (data.name.length > 50) {
      throw new Error('Validation error: Name cannot exceed 50 characters');
    }

    if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
      throw new Error('Validation error: Color must be a valid hex color code (e.g., #FF0000)');
    }
  }

  private static validateUpdateTagData(data: Partial<CreateTagRequest>): void {
    if (data.name !== undefined) {
      if (typeof data.name !== 'string') {
        throw new Error('Validation error: Name must be a string');
      }

      if (data.name.trim().length === 0) {
        throw new Error('Validation error: Name cannot be empty');
      }

      if (data.name.length > 50) {
        throw new Error('Validation error: Name cannot exceed 50 characters');
      }
    }

    if (data.color !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
      throw new Error('Validation error: Color must be a valid hex color code (e.g., #FF0000)');
    }
  }
}