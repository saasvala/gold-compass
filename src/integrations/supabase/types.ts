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
      bot_configs: {
        Row: {
          bot_category: string
          bot_type: string
          created_at: string
          id: string
          is_demo: boolean
          name: string
          pnl_total: number | null
          settings: Json | null
          status: string
          strategy: Json | null
          total_trades: number | null
          updated_at: string
          user_id: string
          win_rate: number | null
        }
        Insert: {
          bot_category: string
          bot_type: string
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          pnl_total?: number | null
          settings?: Json | null
          status?: string
          strategy?: Json | null
          total_trades?: number | null
          updated_at?: string
          user_id: string
          win_rate?: number | null
        }
        Update: {
          bot_category?: string
          bot_type?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          pnl_total?: number | null
          settings?: Json | null
          status?: string
          strategy?: Json | null
          total_trades?: number | null
          updated_at?: string
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_history: {
        Row: {
          created_at: string
          direction: string
          entry_price: number
          id: string
          lot_size: number
          profit_usd: number | null
          reward_usd: number | null
          risk_percent: number | null
          risk_usd: number | null
          rr_ratio: number | null
          sl_price: number
          status: string
          tp_price: number
          trading_mode: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          direction: string
          entry_price: number
          id?: string
          lot_size: number
          profit_usd?: number | null
          reward_usd?: number | null
          risk_percent?: number | null
          risk_usd?: number | null
          rr_ratio?: number | null
          sl_price: number
          status?: string
          tp_price: number
          trading_mode: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          entry_price?: number
          id?: string
          lot_size?: number
          profit_usd?: number | null
          reward_usd?: number | null
          risk_percent?: number | null
          risk_usd?: number | null
          rr_ratio?: number | null
          sl_price?: number
          status?: string
          tp_price?: number
          trading_mode?: string
          user_id?: string | null
        }
        Relationships: []
      }
      trade_journal: {
        Row: {
          created_at: string
          direction: string
          emotion: string | null
          entry_price: number
          id: string
          lessons: string | null
          lot_size: number
          mistakes: string | null
          notes: string | null
          profit_usd: number | null
          rating: number | null
          result: string | null
          rr_ratio: number | null
          screenshot_url: string | null
          setup_type: string | null
          sl_price: number
          tp_price: number
          trade_id: string | null
          trading_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          emotion?: string | null
          entry_price: number
          id?: string
          lessons?: string | null
          lot_size?: number
          mistakes?: string | null
          notes?: string | null
          profit_usd?: number | null
          rating?: number | null
          result?: string | null
          rr_ratio?: number | null
          screenshot_url?: string | null
          setup_type?: string | null
          sl_price: number
          tp_price: number
          trade_id?: string | null
          trading_mode: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          emotion?: string | null
          entry_price?: number
          id?: string
          lessons?: string | null
          lot_size?: number
          mistakes?: string | null
          notes?: string | null
          profit_usd?: number | null
          rating?: number | null
          result?: string | null
          rr_ratio?: number | null
          screenshot_url?: string | null
          setup_type?: string | null
          sl_price?: number
          tp_price?: number
          trade_id?: string | null
          trading_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_journal_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trade_history"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          active_mode: string
          created_at: string
          id: string
          settings: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active_mode?: string
          created_at?: string
          id?: string
          settings?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active_mode?: string
          created_at?: string
          id?: string
          settings?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_bot_leaderboard: {
        Args: never
        Returns: {
          avg_pnl: number
          avg_trades: number
          avg_win_rate: number
          best_pnl: number
          bot_category: string
          bot_type: string
          sharpe_ratio: number
          total_pnl: number
          total_users: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "trader" | "investor" | "reseller"
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
    Enums: {
      app_role: ["admin", "trader", "investor", "reseller"],
    },
  },
} as const
