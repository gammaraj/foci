export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_goal_data: {
        Row: {
          date: string
          last_streak_update: string | null
          session_count: number
          streak: number
          updated_at: string
          user_id: string
        }
        Insert: {
          date: string
          last_streak_update?: string | null
          session_count?: number
          streak?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          date?: string
          last_streak_update?: string | null
          session_count?: number
          streak?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: number
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: number
          id: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: number
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          auto_start_enabled: boolean
          break_duration: number
          daily_goal: number
          inactivity_threshold: number
          notifications_enabled: boolean
          updated_at: string
          user_id: string
          work_duration: number
        }
        Insert: {
          auto_start_enabled?: boolean
          break_duration?: number
          daily_goal?: number
          inactivity_threshold?: number
          notifications_enabled?: boolean
          updated_at?: string
          user_id: string
          work_duration?: number
        }
        Update: {
          auto_start_enabled?: boolean
          break_duration?: number
          daily_goal?: number
          inactivity_threshold?: number
          notifications_enabled?: boolean
          updated_at?: string
          user_id?: string
          work_duration?: number
        }
        Relationships: []
      }
      streak_history: {
        Row: {
          date_key: string
          goal_met: boolean
          id: string
          recorded_at: number
          session_count: number
          user_id: string
        }
        Insert: {
          date_key: string
          goal_met?: boolean
          id?: string
          recorded_at: number
          session_count?: number
          user_id: string
        }
        Update: {
          date_key?: string
          goal_met?: boolean
          id?: string
          recorded_at?: number
          session_count?: number
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          archived_at: number | null
          completed: boolean
          created_at: number
          due_date: string | null
          id: string
          order: number | null
          project_id: string
          sessions: number
          subtasks: Json
          time_spent: number
          title: string
          user_id: string
        }
        Insert: {
          archived_at?: number | null
          completed?: boolean
          created_at: number
          due_date?: string | null
          id: string
          order?: number | null
          project_id?: string
          sessions?: number
          subtasks?: Json
          time_spent?: number
          title: string
          user_id: string
        }
        Update: {
          archived_at?: number | null
          completed?: boolean
          created_at?: number
          due_date?: string | null
          id?: string
          order?: number | null
          project_id?: string
          sessions?: number
          subtasks?: Json
          time_spent?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          selected_project_id: string
          user_id: string
        }
        Insert: {
          selected_project_id?: string
          user_id: string
        }
        Update: {
          selected_project_id?: string
          user_id?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
