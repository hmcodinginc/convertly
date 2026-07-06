export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AuditSessionStatus =
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
          status: AuditSessionStatus
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          website_url: string
          status?: AuditSessionStatus
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          website_url?: string
          status?: AuditSessionStatus
          error_message?: string | null
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
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
