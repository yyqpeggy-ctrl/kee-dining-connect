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
      event_notifications: {
        Row: {
          channel: string
          created_at: string
          delivery_stats: Json | null
          error_message: string | null
          event_id: string
          event_name: string
          id: string
          message_content: string | null
          message_template: string
          recipient_count: number
          rule_name: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          target_type: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          delivery_stats?: Json | null
          error_message?: string | null
          event_id: string
          event_name: string
          id?: string
          message_content?: string | null
          message_template: string
          recipient_count?: number
          rule_name?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_type: string
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          delivery_stats?: Json | null
          error_message?: string | null
          event_id?: string
          event_name?: string
          id?: string
          message_content?: string | null
          message_template?: string
          recipient_count?: number
          rule_name?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          target_type?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          check_in_at: string | null
          created_at: string
          email: string | null
          event_id: string
          event_name: string
          id: string
          is_new_customer: boolean
          name: string
          notes: string | null
          phone: string | null
          source: string
          status: string
          updated_at: string
          wechat: string | null
        }
        Insert: {
          check_in_at?: string | null
          created_at?: string
          email?: string | null
          event_id: string
          event_name: string
          id?: string
          is_new_customer?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          wechat?: string | null
        }
        Update: {
          check_in_at?: string | null
          created_at?: string
          email?: string | null
          event_id?: string
          event_name?: string
          id?: string
          is_new_customer?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          wechat?: string | null
        }
        Relationships: []
      }
      event_reminder_rules: {
        Row: {
          channel: string
          created_at: string
          description: string | null
          description_zh: string | null
          id: string
          is_active: boolean
          message_template: string
          message_template_zh: string
          rule_name: string
          rule_name_zh: string
          target_type: string
          trigger_offset_minutes: number
          trigger_relative_to: string
        }
        Insert: {
          channel?: string
          created_at?: string
          description?: string | null
          description_zh?: string | null
          id?: string
          is_active?: boolean
          message_template: string
          message_template_zh: string
          rule_name: string
          rule_name_zh: string
          target_type?: string
          trigger_offset_minutes: number
          trigger_relative_to?: string
        }
        Update: {
          channel?: string
          created_at?: string
          description?: string | null
          description_zh?: string | null
          id?: string
          is_active?: boolean
          message_template?: string
          message_template_zh?: string
          rule_name?: string
          rule_name_zh?: string
          target_type?: string
          trigger_offset_minutes?: number
          trigger_relative_to?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string
          created_at: string
          description_en: string | null
          description_zh: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          name_en: string
          name_zh: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_zh?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name_en: string
          name_zh: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_zh?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name_en?: string
          name_zh?: string
          price?: number
          sort_order?: number
          updated_at?: string
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
