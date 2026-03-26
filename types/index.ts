export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type Status = 'todo' | 'inprogress' | 'done'

export interface Subtask {
  id: string
  task_id: string
  title: string
  completed: boolean
  created_at: string
}

export interface Task {
  id: string
  board_id: string
  user_id: string
  title: string
  description?: string
  status: Status
  priority: Priority
  due_date?: string
  estimated_hours?: number
  position: number
  created_at: string
  subtasks?: Subtask[]
}

export interface Board {
  id: string
  user_id: string
  title: string
  description?: string
  created_at: string
  tasks?: Task[]
}

export interface User {
  id: string
  email: string
}