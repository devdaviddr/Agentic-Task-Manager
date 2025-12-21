import type { D1Database } from '@cloudflare/workers-types';
import { TaskModel } from '../models/Task';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../types';

export class TaskService {
  static async getAllTasks(db: D1Database): Promise<Task[]> {
    try {
      return await TaskModel.findAll(db);
    } catch (error) {
      console.error('Service error - getAllTasks:', error);
      throw new Error('Failed to retrieve tasks');
    }
  }

  static async getAllTasksByUser(db: D1Database, userId: number): Promise<Task[]> {
    try {
      return await TaskModel.findByUserId(db, userId);
    } catch (error) {
      console.error('Service error - getAllTasksByUser:', error);
      throw new Error('Failed to retrieve user tasks');
    }
  }

  static async getTaskById(db: D1Database, id: number): Promise<Task> {
    try {
      const task = await TaskModel.findById(db, id);
      if (!task) {
        throw new Error('Task not found');
      }
      return task;
    } catch (error) {
      console.error('Service error - getTaskById:', error);
      if (error instanceof Error && error.message === 'Task not found') {
        throw error;
      }
      throw new Error('Failed to retrieve task');
    }
  }

  static async createTask(db: D1Database, taskData: CreateTaskRequest, userId: number): Promise<Task> {
    try {
      // Business logic validation
      this.validateCreateTaskData(taskData);

      return await TaskModel.create(db, { ...taskData, user_id: userId });
    } catch (error) {
      console.error('Service error - createTask:', error);
       if (error instanceof Error && error.message.toLowerCase().includes('validation')) {
         throw error;
       }
      throw new Error('Failed to create task');
    }
  }

  static async updateTask(db: D1Database, id: number, taskData: UpdateTaskRequest): Promise<Task> {
    try {
      // Business logic validation
      this.validateUpdateTaskData(taskData);

      const task = await TaskModel.update(db, id, taskData);
      if (!task) {
        throw new Error('Task not found or no changes made');
      }
      return task;
    } catch (error) {
      console.error('Service error - updateTask:', error);
       if (error instanceof Error && (error.message === 'Task not found or no changes made' || error.message.toLowerCase().includes('validation'))) {
         throw error;
       }
      throw new Error('Failed to update task');
    }
  }

  static async deleteTask(db: D1Database, id: number): Promise<void> {
    try {
      const deleted = await TaskModel.delete(db, id);
      if (!deleted) {
        throw new Error('Task not found');
      }
    } catch (error) {
      console.error('Service error - deleteTask:', error);
      if (error instanceof Error && error.message === 'Task not found') {
        throw error;
      }
      throw new Error('Failed to delete task');
    }
  }

  private static validateCreateTaskData(data: CreateTaskRequest): void {
    if (data.title === undefined || data.title === null) {
      throw new Error('Validation error: Title is required');
    }

    if (typeof data.title !== 'string') {
      throw new Error('Validation error: Title must be a string');
    }

    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Validation error: Title is required and cannot be empty');
    }

    if (data.title.length > 255) {
      throw new Error('Validation error: Title cannot exceed 255 characters');
    }

    if (data.description && typeof data.description !== 'string') {
      throw new Error('Validation error: Description must be a string');
    }
  }

  private static validateUpdateTaskData(data: UpdateTaskRequest): void {
    if (data.title !== undefined) {
      if (typeof data.title !== 'string') {
        throw new Error('Validation error: Title must be a string');
      }

      if (data.title.trim().length === 0) {
        throw new Error('Validation error: Title is required and cannot be empty');
      }

      if (data.title.length > 255) {
        throw new Error('Validation error: Title cannot exceed 255 characters');
      }
    }

    if (data.description !== undefined && typeof data.description !== 'string') {
      throw new Error('Validation error: Description must be a string');
    }

    if (data.completed !== undefined && typeof data.completed !== 'boolean') {
      throw new Error('Validation error: Completed must be a boolean');
    }
  }
}