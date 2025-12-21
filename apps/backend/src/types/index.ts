import 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    user: User;
  }
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}
export interface User {
  id: number;
  email: string;
  firebase_uid?: string;
  name?: string;
  role: 'user' | 'admin' | 'superadmin';
  created_at: Date;
  updated_at: Date;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'user' | 'admin' | 'superadmin';
}

// New types for boards feature
export interface Board {
  id: number;
  name: string;
  description?: string;
  background?: string;
  column_theme?: string;
  archived: boolean;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
  background?: string;
  column_theme?: string;
  archived?: boolean;
}

export interface UpdateBoardRequest {
  name?: string;
  description?: string;
  background?: string;
  column_theme?: string;
  archived?: boolean;
}

export interface Column {
  id: number;
  board_id: number;
  name: string;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface Item {
  id: number;
  column_id: number;
  title: string;
  description?: string;
  position: number;
  start_date?: Date;
  end_date?: Date;
  effort?: number;
  label?: string;
  priority?: 'high' | 'medium' | 'low' | null;
  tags?: Tag[];
  assigned_users?: User[];
  archived: boolean;
  created_at: Date;
  updated_at: Date;
}

// Request/Response types
export interface CreateColumnRequest {
  name: string;
  position?: number;
}

export interface CreateItemRequest {
  title: string;
  description?: string;
  position?: number;
  start_date?: Date;
  end_date?: Date;
  effort?: number;
  label?: string | null;
  priority?: 'high' | 'medium' | 'low' | null;
  tag_ids?: number[];
  user_ids?: number[];
}

export interface UpdateItemRequest {
  title?: string;
  description?: string;
  position?: number;
  start_date?: Date;
  end_date?: Date;
  effort?: number;
  label?: string | null;
  priority?: 'high' | 'medium' | 'low' | null;
  tag_ids?: number[];
  user_ids?: number[];
}

export interface MoveItemRequest {
  column_id: number;
  position: number;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

export interface BoardWithColumns extends Board {
  columns: (Column & { items: Item[] })[];
}