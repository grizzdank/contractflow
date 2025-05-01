export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      billing_history: {
        Row: {
          amount: number
          billing_date: string
          created_at: string | null
          id: string
          organization_id: string | null
          status: string
          stripe_invoice_id: string | null
          subscription_id: string | null
        }
        Insert: {
          amount: number
          billing_date: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          status: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount?: number
          billing_date?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_audit_trail: {
        Row: {
          action_type: string
          changes: Json | null
          contract_id: string
          id: string
          organization_id: string
          performed_at: string
          performed_by: string
          performed_by_email: string
        }
        Insert: {
          action_type: string
          changes?: Json | null
          contract_id: string
          id?: string
          organization_id: string
          performed_at?: string
          performed_by: string
          performed_by_email: string
        }
        Update: {
          action_type?: string
          changes?: Json | null
          contract_id?: string
          id?: string
          organization_id?: string
          performed_at?: string
          performed_by?: string
          performed_by_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_coi_files: {
        Row: {
          contract_id: string
          expiration_date: string | null
          file_name: string
          file_path: string
          id: string
          is_executed_contract: boolean | null
          organization_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          contract_id: string
          expiration_date?: string | null
          file_name: string
          file_path: string
          id?: string
          is_executed_contract?: boolean | null
          organization_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          contract_id?: string
          expiration_date?: string | null
          file_name?: string
          file_path?: string
          id?: string
          is_executed_contract?: boolean | null
          organization_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          accounting_codes: string | null
          amount: number
          comments: Json | null
          contract_number: string
          created_at: string
          creator_email: string
          creator_id: string | null
          department: string
          description: string | null
          end_date: string
          id: string
          organization_id: string
          signatory_email: string | null
          signatory_name: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          type: Database["public"]["Enums"]["contract_type"]
          vendor: string
          vendor_address: string | null
          vendor_email: string | null
          vendor_phone: string | null
        }
        Insert: {
          accounting_codes?: string | null
          amount: number
          comments?: Json | null
          contract_number: string
          created_at?: string
          creator_email: string
          creator_id?: string | null
          department: string
          description?: string | null
          end_date: string
          id?: string
          organization_id: string
          signatory_email?: string | null
          signatory_name?: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          type: Database["public"]["Enums"]["contract_type"]
          vendor: string
          vendor_address?: string | null
          vendor_email?: string | null
          vendor_phone?: string | null
        }
        Update: {
          accounting_codes?: string | null
          amount?: number
          comments?: Json | null
          contract_number?: string
          created_at?: string
          creator_email?: string
          creator_id?: string | null
          department?: string
          description?: string | null
          end_date?: string
          id?: string
          organization_id?: string
          signatory_email?: string | null
          signatory_name?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          type?: Database["public"]["Enums"]["contract_type"]
          vendor?: string
          vendor_address?: string | null
          vendor_email?: string | null
          vendor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_organization_id_fkey_v2"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clerk_id: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          clerk_id?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          clerk_id?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_interval: string
          created_at: string | null
          current_period_ends_at: string | null
          id: string
          organization_id: string | null
          plan_type: string
          price_per_seat: number
          seats: number
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          billing_interval: string
          created_at?: string | null
          current_period_ends_at?: string | null
          id?: string
          organization_id?: string | null
          plan_type: string
          price_per_seat: number
          seats?: number
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_interval?: string
          created_at?: string | null
          current_period_ends_at?: string | null
          id?: string
          organization_id?: string | null
          plan_type?: string
          price_per_seat?: number
          seats?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: {
        Args: { org_name: string }
        Returns: string
      }
      debug_jwt: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      contract_status:
        | "new"
        | "in_coord"
        | "approved"
        | "draft"
        | "hold"
        | "in_signature"
        | "executed"
        | "expired"
        | "active"
      contract_type:
        | "service"
        | "nda"
        | "mou"
        | "iaa"
        | "sponsorship"
        | "license"
        | "employment"
        | "other"
        | "product"
        | "vendor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contract_status: [
        "new",
        "in_coord",
        "approved",
        "draft",
        "hold",
        "in_signature",
        "executed",
        "expired",
        "active",
      ],
      contract_type: [
        "service",
        "nda",
        "mou",
        "iaa",
        "sponsorship",
        "license",
        "employment",
        "other",
        "product",
        "vendor",
      ],
    },
  },
} as const
