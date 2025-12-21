import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { auth, tags, testData } from '../test/utils';

describe('Tag API', () => {
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    // Register users for testing
    console.log('🧹 Setting up test users...');

    // Register users
    const admin = await auth.register(testData.validUser);
    adminToken = admin.accessToken!;
    // Note: For D1 tests, we assume admin role is handled through the API
    // For testing purposes, we'll use a separate admin user registration

    const user = await auth.register(testData.validUser2);
    userToken = user.accessToken!;

    console.log('✅ Test users set up');
  });

  afterEach(async () => {
    // Test cleanup is handled by the test framework
    console.log('🧹 Test cleanup completed');
  });

  describe('GET /api/tags - Get All Tags', () => {
    it('Get all tags successfully', async () => {
      // Create some tags as admin
      await tags.create(testData.validTag, adminToken);
      await tags.create(testData.validTag2, adminToken);

      const response = await tags.getAll(userToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(2);
      expect(response.data[0]).toHaveProperty('id');
      expect(response.data[0].name).toBe(testData.validTag.name);
      expect(response.data[1].name).toBe(testData.validTag2.name);
    });

    it('Get all tags fails without authentication', async () => {
      const response = await tags.getAll();

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
    });
  });

  describe('GET /api/tags/:id - Get Tag', () => {
    it('Get tag by ID successfully', async () => {
      // Create a tag
      const createResponse = await tags.create(testData.validTag, adminToken);
      const tagId = createResponse.data.id;

      const response = await tags.getById(tagId, userToken);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(tagId);
      expect(response.data.name).toBe(testData.validTag.name);
      expect(response.data.color).toBe(testData.validTag.color);
    });

    it('Get tag fails for non-existent tag', async () => {
      const response = await tags.getById(99999, userToken);

      expect(response.status).toBe(404);
      expect(response.data.error).toBe('Tag not found');
    });

    it('Get tag fails without authentication', async () => {
      const response = await tags.getById(1);

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
    });

    it('Get tag fails with invalid ID', async () => {
      const response = await tags.getById(NaN, userToken);

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('Invalid tag ID');
    });
  });

  describe('POST /api/tags - Create Tag', () => {
    it('Create tag successfully as admin', async () => {
      const response = await tags.create(testData.validTag, adminToken);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(testData.validTag.name);
      expect(response.data.color).toBe(testData.validTag.color);
      expect(response.data).toHaveProperty('created_at');
      expect(response.data).toHaveProperty('updated_at');
    });

    it('Create tag fails without admin role', async () => {
      const response = await tags.create(testData.validTag, userToken);

      expect(response.status).toBe(403);
      expect(response.data).toHaveProperty('error');
    });

    it('Create tag fails without authentication', async () => {
      const response = await tags.create(testData.validTag);

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
    });

    it('Create tag fails with missing name', async () => {
      const invalidTag = { color: '#ff0000' };
      const response = await tags.create(invalidTag, adminToken);

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('Validation error: Name is required');
    });

    it('Create tag fails with empty name', async () => {
      const invalidTag = { name: '', color: '#ff0000' };
      const response = await tags.create(invalidTag, adminToken);

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('Validation error: Name cannot be empty');
    });

    it('Create tag fails with name too long', async () => {
      const invalidTag = { name: 'a'.repeat(51), color: '#ff0000' };
      const response = await tags.create(invalidTag, adminToken);

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('Validation error: Name cannot exceed 50 characters');
    });

    it('Create tag fails with invalid color format', async () => {
      const invalidTag = { name: 'Test Tag', color: 'red' };
      const response = await tags.create(invalidTag, adminToken);

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('Validation error: Color must be a valid hex color code');
    });

    it('Create tag fails with duplicate name', async () => {
      // Create first tag
      await tags.create(testData.validTag, adminToken);

      // Try to create another with same name
      const response = await tags.create(testData.validTag, adminToken);

      expect(response.status).toBe(409);
      expect(response.data.error).toBe('Tag with this name already exists');
    });
  });

  describe('PUT /api/tags/:id - Update Tag', () => {
    it('Update tag successfully as admin', async () => {
      // Create a tag
      const createResponse = await tags.create(testData.validTag, adminToken);
      const tagId = createResponse.data.id;

      const updates = {
        name: 'Updated Tag Name',
        color: '#00ff00',
      };

      const response = await tags.update(tagId, updates, adminToken);

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(tagId);
      expect(response.data.name).toBe(updates.name);
      expect(response.data.color).toBe(updates.color);
    });

    it('Update tag with partial data', async () => {
      // Create a tag
      const createResponse = await tags.create(testData.validTag, adminToken);
      const tagId = createResponse.data.id;

      const updates = { name: 'Partially Updated' };

      const response = await tags.update(tagId, updates, adminToken);

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(updates.name);
      expect(response.data.color).toBe(testData.validTag.color); // Unchanged
    });

    it('Update tag fails without admin role', async () => {
      // Create a tag
      const createResponse = await tags.create(testData.validTag, adminToken);
      const tagId = createResponse.data.id;

      const updates = { name: 'Updated Name' };
      const response = await tags.update(tagId, updates, userToken);

      expect(response.status).toBe(403);
      expect(response.data).toHaveProperty('error');
    });

    it('Update tag fails for non-existent tag', async () => {
      const updates = { name: 'Updated Name' };
      const response = await tags.update(99999, updates, adminToken);

      expect(response.status).toBe(404);
      expect(response.data.error).toBe('Tag not found or no changes made');
    });

    it('Update tag fails with duplicate name', async () => {
      // Create two tags
      await tags.create(testData.validTag, adminToken);
      const createResponse2 = await tags.create(testData.validTag2, adminToken);
      const tagId2 = createResponse2.data.id;

      // Try to update second tag with first tag's name
      const updates = { name: testData.validTag.name };
      const response = await tags.update(tagId2, updates, adminToken);

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('Tag with this name already exists');
    });

    it('Update tag fails with invalid name', async () => {
      // Create a tag
      const createResponse = await tags.create(testData.validTag, adminToken);
      const tagId = createResponse.data.id;

      const updates = { name: '' };
      const response = await tags.update(tagId, updates, adminToken);

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('Validation error: Name cannot be empty');
    });

    it('Update tag fails with invalid color', async () => {
      // Create a tag
      const createResponse = await tags.create(testData.validTag, adminToken);
      const tagId = createResponse.data.id;

      const updates = { color: 'invalid' };
      const response = await tags.update(tagId, updates, adminToken);

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('Validation error: Color must be a valid hex color code');
    });

    it('Update tag fails without authentication', async () => {
      const updates = { name: 'Updated Name' };
      const response = await tags.update(1, updates);

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
    });

    it('Update tag fails with invalid ID', async () => {
      const updates = { name: 'Updated Name' };
      const response = await tags.update(NaN, updates, adminToken);

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('Invalid tag ID');
    });
  });

  describe('DELETE /api/tags/:id - Delete Tag', () => {
    it('Delete tag successfully as admin', async () => {
      // Create a tag
      const createResponse = await tags.create(testData.validTag, adminToken);
      const tagId = createResponse.data.id;

      const response = await tags.delete(tagId, adminToken);

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Tag deleted successfully');

      // Verify tag is deleted
      const getResponse = await tags.getById(tagId, userToken);
      expect(getResponse.status).toBe(404);
    });

    it('Delete tag fails without admin role', async () => {
      // Create a tag
      const createResponse = await tags.create(testData.validTag, adminToken);
      const tagId = createResponse.data.id;

      const response = await tags.delete(tagId, userToken);

      expect(response.status).toBe(403);
      expect(response.data).toHaveProperty('error');
    });

    it('Delete tag fails for non-existent tag', async () => {
      const response = await tags.delete(99999, adminToken);

      expect(response.status).toBe(404);
      expect(response.data.error).toBe('Tag not found');
    });

    it('Delete tag fails without authentication', async () => {
      const response = await tags.delete(1);

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
    });

    it('Delete tag fails with invalid ID', async () => {
      const response = await tags.delete(NaN, adminToken);

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('Invalid tag ID');
    });
  });
});