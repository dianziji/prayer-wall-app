
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          prayer_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          prayer_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          prayer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_prayer_id_fkey"
            columns: ["prayer_id"]
            isOneToOne: false
            referencedRelation: "prayers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_prayer_id_fkey"
            columns: ["prayer_id"]
            isOneToOne: false
            referencedRelation: "v_prayers_likes"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          prayer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          prayer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          prayer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_prayer_id_fkey"
            columns: ["prayer_id"]
            isOneToOne: false
            referencedRelation: "prayers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_prayer_id_fkey"
            columns: ["prayer_id"]
            isOneToOne: false
            referencedRelation: "v_prayers_likes"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_walls: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          stats: Json | null
          theme: Json | null
          week_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          stats?: Json | null
          theme?: Json | null
          week_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          stats?: Json | null
          theme?: Json | null
          week_start?: string
        }
        Relationships: []
      }
      prayers: {
        Row: {
          author_name: string | null
          color: string | null
          content: string
          created_at: string | null
          fellowship: string | null
          font_style: string | null
          guest_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
          wall_id: string | null
        }
        Insert: {
          author_name?: string | null
          color?: string | null
          content: string
          created_at?: string | null
          fellowship?: string | null
          font_style?: string | null
          guest_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
          wall_id?: string | null
        }
        Update: {
          author_name?: string | null
          color?: string | null
          content?: string
          created_at?: string | null
          fellowship?: string | null
          font_style?: string | null
          guest_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
          wall_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prayers_wall_id_fkey"
            columns: ["wall_id"]
            isOneToOne: false
            referencedRelation: "prayer_walls"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_fellowship: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_fellowship?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_fellowship?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      archive_weeks: {
        Row: {
          first_prayer_at: string | null
          last_prayer_at: string | null
          prayer_count: number | null
          week_start_et: string | null
        }
        Relationships: []
      }
      v_prayers_likes: {
        Row: {
          author_name: string | null
          color: string | null
          content: string | null
          created_at: string | null
          fellowship: string | null
          font_style: string | null
          guest_id: string | null
          id: string | null
          like_count: number | null
          liked_by_me: boolean | null
          metadata: Json | null
          user_id: string | null
          wall_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prayers_wall_id_fkey"
            columns: ["wall_id"]
            isOneToOne: false
            referencedRelation: "prayer_walls"
            referencedColumns: ["id"]
          },
        ]
      }
      fellowships: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id: string
          is_active?: boolean | null
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
        }
        Relationships: []
      }
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
