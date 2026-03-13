// Mock environment variables for tests BEFORE importing anything else
// Only set if not already set by vitest-setup.ts
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/taskmanager_test';
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}
if (!process.env.DISABLE_RATE_LIMITING) {
  process.env.DISABLE_RATE_LIMITING = 'true'; // Disable rate limiting in tests
}
if (!process.env.FIREBASE_PROJECT_ID) {
  process.env.FIREBASE_PROJECT_ID = 'test-project';
}

import { testPool } from './setup';
import request from 'supertest';
import app from '../app';
import { TEST_FIREBASE_TOKEN_PREFIX } from './test-constants';

// Export test utilities
export { testPool, teardownTestDatabase, testConnection } from './setup';

// Delay helper for rate limit safety and CPU throttling
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Test data factories
const createValidUser = () => ({
  email: `testuser${Date.now()}${Math.random()}@example.com`,
  password: 'TestPassword123!@#',
  name: 'Test User',
});

const createValidUser2 = () => ({
  email: `testuser2${Date.now()}${Math.random()}@example.com`,
  password: 'TestPassword456!@#',
  name: 'Test User 2',
});

export const testData = {
  get validUser() {
    return createValidUser();
  },
  get validUser2() {
    return createValidUser2();
  },
  invalidPassword: 'weak',
  invalidEmail: 'not-an-email',
  validBoard: {
    name: 'Test Board',
    description: 'A test board for integration tests',
    background: 'bg-blue-50',
    column_theme: 'light',
  },
  validBoard2: {
    name: 'Test Board 2',
    description: 'Another test board',
    background: 'bg-green-50',
    column_theme: 'dark',
  },
  validColumn: {
    name: 'Test Column',
    position: 0,
  },
  validColumn2: {
    name: 'In Progress',
    position: 1,
  },
  validColumn3: {
    name: 'Done',
    position: 2,
  },
  validItem: {
    title: 'Test Item',
    description: 'A test item for integration tests',
    position: 0,
    effort: 5,
    priority: 'high' as const,
  },
  validItem2: {
    title: 'Another Test Item',
    description: 'Another test item',
    position: 1,
    effort: 3,
    priority: 'medium' as const,
  },
  validTag: {
    name: 'Bug',
    color: '#ff0000',
  },
  validTag2: {
    name: 'Feature',
    color: '#00ff00',
  },
  validTask: {
    title: 'Test Task',
    description: 'A test task for integration tests',
  },
  validTask2: {
    title: 'Another Test Task',
    description: 'Another test task',
  },
};

// Authentication helpers
export const auth = {
  /**
   * Create (or retrieve) a test user via a simulated Firebase ID token.
   * The /auth/me endpoint auto-provisions the user on first call.
   */
  async register(userData?: { email?: string; name?: string; password?: string }) {
    await delay(10); // Throttle to reduce CPU load
    const email = userData?.email ?? `testuser${Date.now()}${Math.random()}@example.com`;
    const name = userData?.name ?? 'Test User';
    const uid = `test-uid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    // Format understood by the test FirebaseAdminService override
    const token = `${TEST_FIREBASE_TOKEN_PREFIX}${uid}:${email}:${name}`;

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    return {
      status: res.status,
      data: res.body,
      accessToken: token,
      refreshToken: '',
    };
  },

  /**
   * Get current user profile using a Firebase ID token
   */
  async getMe(accessToken?: string) {
    const req = request(app).get('/auth/me');
    if (accessToken) {
      req.set('Authorization', `Bearer ${accessToken}`);
    }
    const res = await req;
    return {
      status: res.status,
      data: res.body,
    };
  },
};

// Board API helpers
export const boards = {
  /**
   * Create a new board
   */
  async create(boardData = testData.validBoard, accessToken?: string) {
    const req = request(app)
      .post('/api/boards')
      .set('Content-Type', 'application/json')
      .send(boardData);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Get all boards for authenticated user
   */
  async getAll(accessToken?: string) {
    const req = request(app).get('/api/boards');
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Get a specific board by ID
   */
  async getById(boardId: number, accessToken?: string) {
    const req = request(app).get(`/api/boards/${boardId}`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Get board with all its columns
   */
  async getWithColumns(boardId: number, accessToken?: string) {
    const req = request(app).get(`/api/boards/${boardId}/full`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Update a board
   */
  async update(boardId: number, updates: any, accessToken?: string) {
    const req = request(app)
      .put(`/api/boards/${boardId}`)
      .set('Content-Type', 'application/json')
      .send(updates);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Delete a board
   */
  async delete(boardId: number, accessToken?: string) {
    const req = request(app).delete(`/api/boards/${boardId}`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },
};

// Column API helpers
export const columns = {
  /**
   * Create a new column in a board
   */
  async create(boardId: number, columnData: any, accessToken?: string) {
    const req = request(app)
      .post(`/api/boards/${boardId}/columns`)
      .set('Content-Type', 'application/json')
      .send(columnData);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Get all columns for a board
   */
  async getAll(boardId: number, accessToken?: string) {
    const req = request(app).get(`/api/boards/${boardId}/columns`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Get a specific column by ID (Note: no boardId needed in the URL)
   */
  async getById(columnId: number, accessToken?: string) {
    const req = request(app).get(`/api/columns/${columnId}`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Update a column (Note: no boardId needed in the URL)
   */
  async update(columnId: number, updates: any, accessToken?: string) {
    const req = request(app)
      .put(`/api/columns/${columnId}`)
      .set('Content-Type', 'application/json')
      .send(updates);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Delete a column (Note: no boardId needed in the URL)
   */
  async delete(columnId: number, accessToken?: string) {
    const req = request(app).delete(`/api/columns/${columnId}`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },
};

// Item API helpers
export const items = {
  /**
   * Create a new item in a column
   */
  async create(columnId: number, itemData: any, accessToken?: string) {
    const req = request(app)
      .post(`/api/columns/${columnId}/items`)
      .set('Content-Type', 'application/json')
      .send(itemData);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Get a specific item by ID
   */
  async getById(itemId: number, accessToken?: string) {
    const req = request(app).get(`/api/items/${itemId}`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Get all items for a column
   */
  async getByColumn(columnId: number, accessToken?: string) {
    const req = request(app).get(`/api/columns/${columnId}/items`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Update an item
   */
  async update(itemId: number, updates: any, accessToken?: string) {
    const req = request(app)
      .put(`/api/items/${itemId}`)
      .set('Content-Type', 'application/json')
      .send(updates);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Move an item to a different column/position
   */
  async move(itemId: number, moveData: any, accessToken?: string) {
    const req = request(app)
      .put(`/api/items/${itemId}/move`)
      .set('Content-Type', 'application/json')
      .send(moveData);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Archive/unarchive an item
   */
  async archive(itemId: number, archived: boolean, accessToken?: string) {
    const req = request(app)
      .put(`/api/items/${itemId}/archive`)
      .set('Content-Type', 'application/json')
      .send({ archived });
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Delete an item
   */
  async delete(itemId: number, accessToken?: string) {
    const req = request(app).delete(`/api/items/${itemId}`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Assign a user to an item
   */
  async assignUser(itemId: number, userId: number, accessToken?: string) {
    const req = request(app)
      .post(`/api/items/${itemId}/users`)
      .set('Content-Type', 'application/json')
      .send({ user_id: userId });
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Remove a user from an item
   */
  async removeUser(itemId: number, userId: number, accessToken?: string) {
    const req = request(app).delete(`/api/items/${itemId}/users/${userId}`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },
};

// Tag API helpers
export const tags = {
  /**
   * Create a new tag
   */
  async create(tagData: any, accessToken?: string) {
    const req = request(app)
      .post('/api/tags')
      .set('Content-Type', 'application/json')
      .send(tagData);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Get all tags
   */
  async getAll(accessToken?: string) {
    const req = request(app).get('/api/tags');
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Get a specific tag by ID
   */
  async getById(tagId: number, accessToken?: string) {
    const req = request(app).get(`/api/tags/${tagId}`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Update a tag
   */
  async update(tagId: number, updates: any, accessToken?: string) {
    const req = request(app)
      .put(`/api/tags/${tagId}`)
      .set('Content-Type', 'application/json')
      .send(updates);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Delete a tag
   */
  async delete(tagId: number, accessToken?: string) {
    const req = request(app).delete(`/api/tags/${tagId}`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },
};

// Task API helpers
export const tasks = {
  /**
   * Create a new task
   */
  async create(taskData: any, accessToken?: string) {
    const req = request(app)
      .post('/api/tasks')
      .set('Content-Type', 'application/json')
      .send(taskData);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Get all tasks for authenticated user
   */
  async getAll(accessToken?: string) {
    const req = request(app).get('/api/tasks');
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Get a specific task by ID
   */
  async getById(taskId: number, accessToken?: string) {
    const req = request(app).get(`/api/tasks/${taskId}`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Update a task
   */
  async update(taskId: number, updates: any, accessToken?: string) {
    const req = request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Content-Type', 'application/json')
      .send(updates);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },

  /**
   * Delete a task
   */
  async delete(taskId: number, accessToken?: string) {
    const req = request(app).delete(`/api/tasks/${taskId}`);
    if (accessToken) req.set('Authorization', `Bearer ${accessToken}`);
    const res = await req;
    return { status: res.status, data: res.body };
  },
};