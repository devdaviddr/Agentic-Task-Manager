// Mock environment variables for tests BEFORE importing anything else
// Only set if not already set by vitest-setup.ts
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/taskmanager_test';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret';
}
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}
if (!process.env.DISABLE_RATE_LIMITING) {
  process.env.DISABLE_RATE_LIMITING = 'true'; // Disable rate limiting in tests
}

import { testPool } from './setup';
import app from '../app';

// Export test utilities
export { testPool, teardownTestDatabase, testConnection } from './setup';

// Helper to create mock request
export const createMockRequest = (method: string, url: string, body?: any, headers?: Record<string, string>) => {
  return new Request(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
};

// Helper to parse response
export const parseResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

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
    const token = `test-firebase-token:${uid}:${email}:${name}`;

    const res = await app.request('/auth/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await parseResponse(res);

    return {
      status: res.status,
      data,
      accessToken: token,
      refreshToken: '',
    };
  },

  /**
   * Get current user profile using a Firebase ID token
   */
  async getMe(accessToken?: string) {
    const res = await app.request('/auth/me', {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },
};

// Board API helpers
export const boards = {
  /**
   * Create a new board
   */
  async create(boardData = testData.validBoard, accessToken?: string) {
    const res = await app.request('/api/boards', {
      method: 'POST',
      body: JSON.stringify(boardData),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Get all boards for authenticated user
   */
  async getAll(accessToken?: string) {
    const res = await app.request('/api/boards', {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Get a specific board by ID
   */
  async getById(boardId: number, accessToken?: string) {
    const res = await app.request(`/api/boards/${boardId}`, {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Get board with all its columns
   */
  async getWithColumns(boardId: number, accessToken?: string) {
    const res = await app.request(`/api/boards/${boardId}/full`, {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Update a board
   */
  async update(boardId: number, updates: any, accessToken?: string) {
    const res = await app.request(`/api/boards/${boardId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Delete a board
   */
  async delete(boardId: number, accessToken?: string) {
    const res = await app.request(`/api/boards/${boardId}`, {
      method: 'DELETE',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },
};

// Column API helpers
export const columns = {
  /**
   * Create a new column in a board
   */
  async create(boardId: number, columnData: any, accessToken?: string) {
    const res = await app.request(`/api/boards/${boardId}/columns`, {
      method: 'POST',
      body: JSON.stringify(columnData),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Get all columns for a board
   */
  async getAll(boardId: number, accessToken?: string) {
    const res = await app.request(`/api/boards/${boardId}/columns`, {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Get a specific column by ID (Note: no boardId needed in the URL)
   */
  async getById(columnId: number, accessToken?: string) {
    const res = await app.request(`/api/columns/${columnId}`, {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Update a column (Note: no boardId needed in the URL)
   */
  async update(columnId: number, updates: any, accessToken?: string) {
    const res = await app.request(`/api/columns/${columnId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Delete a column (Note: no boardId needed in the URL)
   */
  async delete(columnId: number, accessToken?: string) {
    const res = await app.request(`/api/columns/${columnId}`, {
      method: 'DELETE',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },
};

// Item API helpers
export const items = {
  /**
   * Create a new item in a column
   */
  async create(columnId: number, itemData: any, accessToken?: string) {
    const res = await app.request(`/api/columns/${columnId}/items`, {
      method: 'POST',
      body: JSON.stringify(itemData),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Get a specific item by ID
   */
  async getById(itemId: number, accessToken?: string) {
    const res = await app.request(`/api/items/${itemId}`, {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Get all items for a column
   */
  async getByColumn(columnId: number, accessToken?: string) {
    const res = await app.request(`/api/columns/${columnId}/items`, {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Update an item
   */
  async update(itemId: number, updates: any, accessToken?: string) {
    const res = await app.request(`/api/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Move an item to a different column/position
   */
  async move(itemId: number, moveData: any, accessToken?: string) {
    const res = await app.request(`/api/items/${itemId}/move`, {
      method: 'PUT',
      body: JSON.stringify(moveData),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Archive/unarchive an item
   */
  async archive(itemId: number, archived: boolean, accessToken?: string) {
    const res = await app.request(`/api/items/${itemId}/archive`, {
      method: 'PUT',
      body: JSON.stringify({ archived }),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Delete an item
   */
  async delete(itemId: number, accessToken?: string) {
    const res = await app.request(`/api/items/${itemId}`, {
      method: 'DELETE',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Assign a user to an item
   */
  async assignUser(itemId: number, userId: number, accessToken?: string) {
    const res = await app.request(`/api/items/${itemId}/users`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Remove a user from an item
   */
  async removeUser(itemId: number, userId: number, accessToken?: string) {
    const res = await app.request(`/api/items/${itemId}/users/${userId}`, {
      method: 'DELETE',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },
};

// Tag API helpers
export const tags = {
  /**
   * Create a new tag
   */
  async create(tagData: any, accessToken?: string) {
    const res = await app.request('/api/tags', {
      method: 'POST',
      body: JSON.stringify(tagData),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Get all tags
   */
  async getAll(accessToken?: string) {
    const res = await app.request('/api/tags', {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Get a specific tag by ID
   */
  async getById(tagId: number, accessToken?: string) {
    const res = await app.request(`/api/tags/${tagId}`, {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Update a tag
   */
  async update(tagId: number, updates: any, accessToken?: string) {
    const res = await app.request(`/api/tags/${tagId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Delete a tag
   */
  async delete(tagId: number, accessToken?: string) {
    const res = await app.request(`/api/tags/${tagId}`, {
      method: 'DELETE',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },
};

// Task API helpers
export const tasks = {
  /**
   * Create a new task
   */
  async create(taskData: any, accessToken?: string) {
    const res = await app.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Get all tasks for authenticated user
   */
  async getAll(accessToken?: string) {
    const res = await app.request('/api/tasks', {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Get a specific task by ID
   */
  async getById(taskId: number, accessToken?: string) {
    const res = await app.request(`/api/tasks/${taskId}`, {
      method: 'GET',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Update a task
   */
  async update(taskId: number, updates: any, accessToken?: string) {
    const res = await app.request(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },

  /**
   * Delete a task
   */
  async delete(taskId: number, accessToken?: string) {
    const res = await app.request(`/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    const data = await parseResponse(res);
    return {
      status: res.status,
      data,
    };
  },
};