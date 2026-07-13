import type { SubscriptionPlanId, SubscriptionStatus } from "@/lib/billingPlans"

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AuditSessionStatus =
  | "draft"
  | "pending"
  | "crawling"
  | "analyzing"
  | "completed"
  | "failed"

export type AuditPageType =
  | "homepage"
  | "pricing"
  | "about"
  | "contact"
  | "services"
  | "features"
  | "login"
  | "signup"
  | "custom"

export type PageDiscoveryStatus =
  | "candidate"
  | "reachable"
  | "unreachable"
  | "unknown"

export type FindingCategory =
  | "ux"
  | "conversion"
  | "trust"
  | "performance"
  | "copy"
  | "accessibility"
  | "technical"

export type FindingSeverity = "critical" | "high" | "medium" | "low"

export type AuditScoreCategory =
  | "clarity"
  | "trust"
  | "friction"
  | "performance"
  | "cta_strength"
  | "overall"
  | "conversion"
  | "mobile"
  | "ux"
  | "growth"

export type Database = {
  public: {
    Tables: {
      audits: {
        Row: {
          id: string
          user_id: string
          website_url: string
          audit_type: string
          status: AuditSessionStatus
          error_message: string | null
          workspace_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          website_url: string
          audit_type?: string
          status?: AuditSessionStatus
          error_message?: string | null
          workspace_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          website_url?: string
          audit_type?: string
          status?: AuditSessionStatus
          error_message?: string | null
          workspace_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_pages: {
        Row: {
          id: string
          audit_id: string
          page_type: AuditPageType
          url: string
          path: string
          title: string
          discovery_status: PageDiscoveryStatus
          desktop_screenshot_key: string | null
          mobile_screenshot_key: string | null
          discovered_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          page_type: AuditPageType
          url: string
          path: string
          title: string
          discovery_status?: PageDiscoveryStatus
          desktop_screenshot_key?: string | null
          mobile_screenshot_key?: string | null
          discovered_at?: string
        }
        Update: {
          id?: string
          audit_id?: string
          page_type?: AuditPageType
          url?: string
          path?: string
          title?: string
          discovery_status?: PageDiscoveryStatus
          desktop_screenshot_key?: string | null
          mobile_screenshot_key?: string | null
          discovered_at?: string
        }
        Relationships: []
      }
      audit_findings: {
        Row: {
          id: string
          audit_id: string
          page_id: string | null
          rule_id: string | null
          category: FindingCategory
          severity: FindingSeverity
          title: string
          description: string
          recommendation: string
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          page_id?: string | null
          rule_id?: string | null
          category: FindingCategory
          severity: FindingSeverity
          title: string
          description: string
          recommendation: string
          created_at?: string
        }
        Update: {
          id?: string
          audit_id?: string
          page_id?: string | null
          rule_id?: string | null
          category?: FindingCategory
          severity?: FindingSeverity
          title?: string
          description?: string
          recommendation?: string
          created_at?: string
        }
        Relationships: []
      }
      audit_scores: {
        Row: {
          id: string
          audit_id: string
          category: AuditScoreCategory
          score: number | null
          max_score: number
          label: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          category: AuditScoreCategory
          score?: number | null
          max_score?: number
          label: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          audit_id?: string
          category?: AuditScoreCategory
          score?: number | null
          max_score?: number
          label?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_history: {
        Row: {
          id: string
          audit_id: string
          status: AuditSessionStatus
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          status: AuditSessionStatus
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          audit_id?: string
          status?: AuditSessionStatus
          message?: string
          created_at?: string
        }
        Relationships: []
      }
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
      workspace_members: {
        Row: {
          id: string
          workspace_id: string
          user_id: string
          role: "owner" | "admin" | "member"
          status: "active" | "invited"
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          role?: "owner" | "admin" | "member"
          status?: "active" | "invited"
          created_at?: string
        }
        Update: {
          role?: "owner" | "admin" | "member"
          status?: "active" | "invited"
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
        Insert: {
          id?: string
          workspace_id: string
          user_id: string
          plan?: SubscriptionPlanId
          status?: SubscriptionStatus
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          payment_provider?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          scheduled_plan?: SubscriptionPlanId | null
          scheduled_change_at?: string | null
          pending_plan?: SubscriptionPlanId | null
          lifetime_audits_used?: number
          period_audits_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          plan?: SubscriptionPlanId
          status?: SubscriptionStatus
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          payment_provider?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          scheduled_plan?: SubscriptionPlanId | null
          scheduled_change_at?: string | null
          pending_plan?: SubscriptionPlanId | null
          lifetime_audits_used?: number
          period_audits_used?: number
          updated_at?: string
        }
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
        Insert: {
          user_id: string
          weekly_digest?: boolean
          audit_complete_email?: boolean
          score_drop_alerts?: boolean
          score_drop_threshold?: number
          created_at?: string
          updated_at?: string
        }
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
        Insert: {
          user_id: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
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
        Insert: {
          id?: string
          user_id: string
          email: string
          override_plan: "starter" | "growth" | "scale" | "internal"
          enabled?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          override_plan?: "starter" | "growth" | "scale" | "internal"
          enabled?: boolean
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      bootstrap_business_foundation: {
        Args: Record<string, never>
        Returns: string
      }
      try_consume_audit_entitlement: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      get_personal_workspace_id: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_active_plan_override: {
        Args: { p_user_id: string }
        Returns: "starter" | "growth" | "scale" | "internal" | null
      }
      set_subscription_pending_plan: {
        Args: { p_pending_plan: SubscriptionPlanId | null }
        Returns: undefined
      }
    }
    Enums: {
      audit_session_status: AuditSessionStatus
      audit_page_type: AuditPageType
      page_discovery_status: PageDiscoveryStatus
      finding_category: FindingCategory
      finding_severity: FindingSeverity
      audit_score_category: AuditScoreCategory
    }
    CompositeTypes: Record<string, never>
  }
}
