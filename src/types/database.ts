export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          context: string | null
          cycle_months: number
          cycle_start_date: string | null
          cycle_end_date: string | null
          onboarding_completed: boolean
          level: number
          xp: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          context?: string | null
          cycle_months?: number
          cycle_start_date?: string | null
          cycle_end_date?: string | null
          onboarding_completed?: boolean
          level?: number
          xp?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          context?: string | null
          cycle_months?: number
          cycle_start_date?: string | null
          cycle_end_date?: string | null
          onboarding_completed?: boolean
          level?: number
          xp?: number
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          type: 'financial' | 'habit' | 'task' | 'hybrid'
          deadline: string
          progress: number
          status: 'active' | 'completed' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          type: 'financial' | 'habit' | 'task' | 'hybrid'
          deadline: string
          progress?: number
          status?: 'active' | 'completed' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          type?: 'financial' | 'habit' | 'task' | 'hybrid'
          deadline?: string
          progress?: number
          status?: 'active' | 'completed' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description: string | null
          expense_type: 'fixed' | 'variable' | 'installment' | null
          installment_current: number | null
          installment_total: number | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description?: string | null
          expense_type?: 'fixed' | 'variable' | 'installment' | null
          installment_current?: number | null
          installment_total?: number | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          amount?: number
          category?: string
          description?: string | null
          expense_type?: 'fixed' | 'variable' | 'installment' | null
          installment_current?: number | null
          installment_total?: number | null
          date?: string
          created_at?: string
        }
      }
      savings_boxes: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          name: string
          target_amount: number
          current_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          name: string
          target_amount: number
          current_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          name?: string
          target_amount?: number
          current_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          name: string
          frequency: 'daily' | 'weekly'
          times_per_week: number | null
          preferred_time: string | null
          status: 'active' | 'paused' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          name: string
          frequency: 'daily' | 'weekly'
          times_per_week?: number | null
          preferred_time?: string | null
          status?: 'active' | 'paused' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          name?: string
          frequency?: 'daily' | 'weekly'
          times_per_week?: number | null
          preferred_time?: string | null
          status?: 'active' | 'paused' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          date: string
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          date: string
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          date?: string
          completed?: boolean
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          title: string
          description: string | null
          category: string
          priority: 'high' | 'medium' | 'low'
          due_date: string | null
          recurrence: 'none' | 'daily' | 'weekly' | 'monthly'
          status: 'pending' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          title: string
          description?: string | null
          category?: string
          priority?: 'high' | 'medium' | 'low'
          due_date?: string | null
          recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'
          status?: 'pending' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          title?: string
          description?: string | null
          category?: string
          priority?: 'high' | 'medium' | 'low'
          due_date?: string | null
          recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'
          status?: 'pending' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      task_checklist_items: {
        Row: {
          id: string
          task_id: string
          title: string
          completed: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          title: string
          completed?: boolean
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          title?: string
          completed?: boolean
          position?: number
          created_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          user_id: string
          badge_type: string
          badge_name: string
          description: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_type: string
          badge_name: string
          description: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_type?: string
          badge_name?: string
          description?: string
          earned_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type SavingsBox = Database['public']['Tables']['savings_boxes']['Row']
export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitLog = Database['public']['Tables']['habit_logs']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskChecklistItem = Database['public']['Tables']['task_checklist_items']['Row']
export type Badge = Database['public']['Tables']['badges']['Row']
