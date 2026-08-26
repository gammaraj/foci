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
      account_collaborators: {
        Row: {
          id: string
          owner_id: string
          collaborator_id: string
          role: "viewer" | "editor"
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          collaborator_id: string
          role?: "viewer" | "editor"
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          collaborator_id?: string
          role?: "viewer" | "editor"
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "account_collaborators_owner_id_fkey"; columns: ["owner_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "account_collaborators_collaborator_id_fkey"; columns: ["collaborator_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      account_invites: {
        Row: {
          id: string
          owner_id: string
          invitee_email: string
          invitee_id: string | null
          role: "viewer" | "editor"
          status: "pending" | "accepted" | "declined" | "expired"
          created_at: string
          expires_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          invitee_email: string
          invitee_id?: string | null
          role?: "viewer" | "editor"
          status?: "pending" | "accepted" | "declined" | "expired"
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          invitee_email?: string
          invitee_id?: string | null
          role?: "viewer" | "editor"
          status?: "pending" | "accepted" | "declined" | "expired"
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Relationships: [
          { foreignKeyName: "account_invites_owner_id_fkey"; columns: ["owner_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "account_invites_invitee_id_fkey"; columns: ["invitee_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      collaboration_invites: {
        Row: {
          id: string
          project_id: string
          owner_id: string
          invitee_email: string
          invitee_id: string | null
          role: "viewer" | "editor"
          status: "pending" | "accepted" | "declined" | "expired"
          created_at: string
          expires_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          owner_id: string
          invitee_email: string
          invitee_id?: string | null
          role?: "viewer" | "editor"
          status?: "pending" | "accepted" | "declined" | "expired"
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          owner_id?: string
          invitee_email?: string
          invitee_id?: string | null
          role?: "viewer" | "editor"
          status?: "pending" | "accepted" | "declined" | "expired"
          created_at?: string
          expires_at?: string
          accepted_at?: string | null
        }
        Relationships: [
          { foreignKeyName: "collaboration_invites_owner_id_fkey"; columns: ["owner_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "collaboration_invites_invitee_id_fkey"; columns: ["invitee_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
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
          archived: boolean
          color: string | null
          created_at: number
          description: string | null
          due_date: string | null
          id: string
          is_favorite: boolean
          name: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          archived?: boolean
          color?: string | null
          created_at?: number
          description?: string | null
          due_date?: string | null
          id: string
          is_favorite?: boolean
          name: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          archived?: boolean
          color?: string | null
          created_at?: number
          description?: string | null
          due_date?: string | null
          id?: string
          is_favorite?: boolean
          name?: string
          sort_order?: number | null
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
          alarm_enabled: boolean
          alarm_sound: string
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
          alarm_enabled?: boolean
          alarm_sound?: string
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
          alarm_enabled?: boolean
          alarm_sound?: string
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
          blocked: boolean
          completed: boolean
          completed_at: number | null
          created_at: number
          due_date: string | null
          id: string
          kind: string
          order: number | null
          priority: number | null
          project_id: string
          recurrence: string | null
          sessions: number
          someday: boolean
          subtasks: Json
          time_spent: number
          title: string
          user_id: string
          description: string | null
        }
        Insert: {
          archived_at?: number | null
          blocked?: boolean
          completed?: boolean
          completed_at?: number | null
          created_at: number
          due_date?: string | null
          id: string
          kind?: string
          order?: number | null
          priority?: number | null
          project_id?: string
          recurrence?: string | null
          sessions?: number
          someday?: boolean
          subtasks?: Json
          time_spent?: number
          title: string
          user_id: string
          description?: string | null
        }
        Update: {
          archived_at?: number | null
          blocked?: boolean
          completed?: boolean
          completed_at?: number | null
          created_at?: number
          due_date?: string | null
          id?: string
          kind?: string
          order?: number | null
          priority?: number | null
          project_id?: string
          recurrence?: string | null
          sessions?: number
          someday?: boolean
          subtasks?: Json
          time_spent?: number
          title?: string
          user_id?: string
          description?: string | null
        }
        Relationships: []
      }
      project_collaborators: {
        Row: {
          id: string
          project_id: string
          owner_id: string
          collaborator_id: string
          role: "viewer" | "editor"
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          owner_id: string
          collaborator_id: string
          role?: "viewer" | "editor"
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          owner_id?: string
          collaborator_id?: string
          role?: "viewer" | "editor"
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: "project_collaborators_owner_id_fkey"; columns: ["owner_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "project_collaborators_collaborator_id_fkey"; columns: ["collaborator_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      user_preferences: {
        Row: {
          selected_project_id: string
          user_id: string
          default_task_view: string
          last_task_view: string | null
          task_view_explicit: boolean
          one_thing_task_id: string | null
          one_thing_date: string | null
        }
        Insert: {
          selected_project_id?: string
          user_id: string
          default_task_view?: string
          last_task_view?: string | null
          task_view_explicit?: boolean
          one_thing_task_id?: string | null
          one_thing_date?: string | null
        }
        Update: {
          selected_project_id?: string
          user_id?: string
          default_task_view?: string
          last_task_view?: string | null
          task_view_explicit?: boolean
          one_thing_task_id?: string | null
          one_thing_date?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          user_id: string
          display_name: string | null
          avatar_url: string | null
          email: string
          updated_at: string
        }
        Insert: {
          user_id: string
          display_name?: string | null
          avatar_url?: string | null
          email: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          display_name?: string | null
          avatar_url?: string | null
          email?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "user_profiles_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_collaboration_invite: {
        Args: { p_project_id: string; p_invitee_email: string; p_role: string }
        Returns: undefined
      }
      create_account_invite: {
        Args: { p_invitee_email: string; p_role: string }
        Returns: undefined
      }
      accept_collaboration_invite: {
        Args: { invite_id: string }
        Returns: undefined
      }
      accept_account_invite: {
        Args: { invite_id: string }
        Returns: undefined
      }
      decline_collaboration_invite: {
        Args: { invite_id: string }
        Returns: undefined
      }
      decline_account_invite: {
        Args: { invite_id: string }
        Returns: undefined
      }
      list_my_project_collaborators: {
        Args: { p_project_id: string }
        Returns: {
          collaborator_id: string
          role: string
          created_at: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
        }[]
      }
      list_my_account_collaborators: {
        Args: Record<string, never>
        Returns: {
          collaborator_id: string
          role: string
          created_at: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
        }[]
      }
      list_my_received_project_invites: {
        Args: Record<string, never>
        Returns: {
          id: string
          project_id: string
          project_name: string
          owner_id: string
          owner_email: string | null
          owner_display_name: string | null
          role: string
          status: string
          created_at: string
          expires_at: string
        }[]
      }
      admin_list_users: {
        Args: Record<string, never>
        Returns: {
          user_id: string
          email: string | null
          display_name: string | null
          last_sign_in_at: string | null
          created_at: string | null
          task_count: number
          streak: number
        }[]
      }
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
