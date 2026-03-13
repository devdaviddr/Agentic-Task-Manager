import { describe, test, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('API Endpoints', () => {
  test('GET / - returns API info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty('message', 'Task Manager API');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('environment');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('GET /health - returns health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('database', 'connected');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('GET /nonexistent - returns 404', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);

    expect(res.body).toHaveProperty('error', 'Not Found');
    expect(res.body).toHaveProperty('path', '/nonexistent');
  });
});