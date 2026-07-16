import type { SubscriptionPlanId, SubscriptionStatus } from "@/lib/billingPlans"
import type { Json } from "@/types/database"

export type BusinessDatabase = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string
          last_name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          first_name?: string
          last_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          id: string
          type: "personal" | "organization"
          name: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type?: "personal" | "organization"
          name: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      workspace_domains: {
        Row: {
          id: string
          workspace_id: string
          hostname: string
          is_primary: boolean
          last_audited_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          hostname: string
          is_primary?: boolean
          last_audited_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          hostname?: string
          is_primary?: boolean
          last_audited_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          plan: SubscriptionPlanId
          status: SubscriptionStatus
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          payment_provider: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          scheduled_plan: SubscriptionPlanId | null
          scheduled_change_at: string | null
          pending_plan: SubscriptionPlanId | null
          lifetime_audits_used: number
          period_audits_used: number
          created_at: string
          updated_at: string
        }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
      notification_preferences: {
        Row: {
          user_id: string
          weekly_digest: boolean
          audit_complete_email: boolean
          score_drop_alerts: boolean
          score_drop_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: Record<string, never>
        Update: {
          weekly_digest?: boolean
          audit_complete_email?: boolean
          score_drop_alerts?: boolean
          score_drop_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          user_id: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: Record<string, never>
        Update: {
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_plan_overrides: {
        Row: {
          id: string
          user_id: string
          email: string
          override_plan: "starter" | "growth" | "scale" | "internal"
          enabled: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Record<string, never>
        Update: Record<string, never>
        Relationships: []
      }
    }
    Functions: {
      bootstrap_business_foundation: {
        Args: Record<string, never>
        Returns: string
      }
      get_personal_workspace_id: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_active_plan_override: {
        Args: { p_user_id: string }
        Returns: "starter" | "growth" | "scale" | "internal" | null
      }
    }
    Enums: Record<string, never>
    Views: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type BusinessTables = BusinessDatabase["public"]["Tables"]

export type SubscriptionRow = BusinessTables["subscriptions"]["Row"]

export type WorkspaceRow = BusinessTables["workspaces"]["Row"]

export type WorkspaceDomainRow = BusinessTables["workspace_domains"]["Row"]

export type NotificationPreferencesRow = BusinessTables["notification_preferences"]["Row"]

export type UserPreferencesRow = BusinessTables["user_preferences"]["Row"]

export type BusinessJson = Json
