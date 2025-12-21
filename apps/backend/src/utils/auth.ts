import type { D1Database } from '@cloudflare/workers-types';
import { BoardService } from '../services/BoardService';
import { ColumnService } from '../services/ColumnService';
import { ItemService } from '../services/ItemService';
import { TaskService } from '../services/TaskService';
import type { Board, Column, Item, Task } from '../types';

export async function checkBoardOwnership(db: D1Database, boardId: number, userId: number): Promise<Board> {
  const board = await BoardService.getBoardById(db, boardId);
  if (!board) {
    throw new Error('Board not found');
  }
  if (board.user_id !== userId) {
    throw new Error('Access denied');
  }
  return board;
}

export async function checkBoardOwnershipViaColumn(db: D1Database, columnId: number, userId: number): Promise<{column: Column, board: Board}> {
  const column = await ColumnService.getColumnById(db, columnId);
  if (!column) {
    throw new Error('Column not found');
  }
  const board = await checkBoardOwnership(db, column.board_id, userId);
  return { column, board };
}

export async function checkBoardOwnershipViaItem(db: D1Database, itemId: number, userId: number): Promise<{item: Item, column: Column, board: Board}> {
  const item = await ItemService.getItemById(db, itemId);
  if (!item) {
    throw new Error('Item not found');
  }
  const { column, board } = await checkBoardOwnershipViaColumn(db, item.column_id, userId);
  return { item, column, board };
}

// Check if user has access to board (owner or assigned to tasks on the board)
export async function checkBoardAccess(db: D1Database, boardId: number, userId: number): Promise<Board> {
  const board = await BoardService.getBoardById(db, boardId);
  if (!board) {
    throw new Error('Board not found');
  }
  
  // Check if user is the owner
  if (board.user_id === userId) {
    return board;
  }
  
  // Check if user is assigned to any tasks on this board
  const hasAssignedTasks = await checkUserHasTasksOnBoard(db, boardId, userId);
  if (!hasAssignedTasks) {
    throw new Error('Access denied');
  }
  
  return board;
}

// Check if user has access via column (owner or assigned to tasks on the board)
export async function checkBoardAccessViaColumn(db: D1Database, columnId: number, userId: number): Promise<{column: Column, board: Board}> {
  const column = await ColumnService.getColumnById(db, columnId);
  if (!column) {
    throw new Error('Column not found');
  }
  const board = await checkBoardAccess(db, column.board_id, userId);
  return { column, board };
}

// Check if user has access via item (owner or assigned to tasks on the board)
export async function checkBoardAccessViaItem(db: D1Database, itemId: number, userId: number): Promise<{item: Item, column: Column, board: Board}> {
  const item = await ItemService.getItemById(db, itemId);
  if (!item) {
    throw new Error('Item not found');
  }
  const { column, board } = await checkBoardAccessViaColumn(db, item.column_id, userId);
  return { item, column, board };
}

// Check task ownership
export async function checkTaskOwnership(db: D1Database, taskId: number, userId: number): Promise<Task> {
  const task = await TaskService.getTaskById(db, taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  if (task.user_id !== userId) {
    throw new Error('Access denied');
  }
  return task;
}

// Helper to check if user has tasks assigned on a board
async function checkUserHasTasksOnBoard(db: D1Database, boardId: number, userId: number): Promise<boolean> {
  const stmt = db.prepare(`
    SELECT EXISTS (
      SELECT 1 FROM item_users iu
      JOIN items i ON iu.item_id = i.id
      JOIN columns c ON i.column_id = c.id
      WHERE c.board_id = ? AND iu.user_id = ?
    ) as has_tasks
  `);
  const result = await stmt.bind(boardId, userId).first();
  
  return Boolean(result?.has_tasks);
}