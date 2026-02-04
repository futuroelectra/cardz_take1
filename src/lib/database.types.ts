/**
 * Supabase database types. Regenerate after schema changes with:
 * npx supabase gen types typescript --project-id "$PROJECT_REF" > src/lib/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          password_hash: string;
          created_at: number;
        };
        Insert: {
          id: string;
          email: string;
          name?: string;
          password_hash: string;
          created_at: number;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          password_hash?: string;
          created_at?: number;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          device_id: string;
          user_id: string | null;
          created_at: number;
          phase: string;
          collector_user_message_count: number | null;
          collector_messages: Json | null;
          creative_summary: Json | null;
          approved_at: number | null;
          build_id: string | null;
        };
        Insert: {
          id: string;
          device_id: string;
          user_id?: string | null;
          created_at: number;
          phase?: string;
          collector_user_message_count?: number | null;
          collector_messages?: Json | null;
          creative_summary?: Json | null;
          approved_at?: number | null;
          build_id?: string | null;
        };
        Update: {
          id?: string;
          device_id?: string;
          user_id?: string | null;
          created_at?: number;
          phase?: string;
          collector_user_message_count?: number | null;
          collector_messages?: Json | null;
          creative_summary?: Json | null;
          approved_at?: number | null;
          build_id?: string | null;
        };
        Relationships: [];
      };
      builds: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          status: string;
          creative_summary: Json;
          blueprint: Json | null;
          artifact: Json | null;
          token_cost_cents: number;
          created_at: number;
          updated_at: number;
          error: string | null;
        };
        Insert: {
          id: string;
          session_id: string;
          user_id?: string | null;
          status?: string;
          creative_summary: Json;
          blueprint?: Json | null;
          artifact?: Json | null;
          token_cost_cents?: number;
          created_at: number;
          updated_at: number;
          error?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          status?: string;
          creative_summary?: Json;
          blueprint?: Json | null;
          artifact?: Json | null;
          token_cost_cents?: number;
          created_at?: number;
          updated_at?: number;
          error?: string | null;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          user_id: string;
          lemon_squeezy_customer_id: string | null;
          subscription_status: string | null;
          updated_at: number;
        };
        Insert: {
          user_id: string;
          lemon_squeezy_customer_id?: string | null;
          subscription_status?: string | null;
          updated_at: number;
        };
        Update: {
          user_id?: string;
          lemon_squeezy_customer_id?: string | null;
          subscription_status?: string | null;
          updated_at?: number;
        };
        Relationships: [];
      };
      experiences: {
        Row: {
          id: string;
          created_at: string;
          code: string;
          json_schema: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          code: string;
          json_schema?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          code?: string;
          json_schema?: Json | null;
        };
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          build_id: string;
          owner_id: string;
          status: string;
          share_token: string;
          passphrase: string | null;
          activated_at: number | null;
          claimed_by_user_id: string | null;
          created_at: number;
          exported_at: number | null;
          code: string;
        };
        Insert: {
          id: string;
          build_id: string;
          owner_id: string;
          status?: string;
          share_token: string;
          passphrase?: string | null;
          activated_at?: number | null;
          claimed_by_user_id?: string | null;
          created_at: number;
          exported_at?: number | null;
          code?: string;
        };
        Update: {
          id?: string;
          build_id?: string;
          owner_id?: string;
          status?: string;
          share_token?: string;
          passphrase?: string | null;
          activated_at?: number | null;
          claimed_by_user_id?: string | null;
          created_at?: number;
          exported_at?: number | null;
          code?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
  };
};
