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
      admin_permissions: {
        Row: {
          created_at: string
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          expire_date: string | null
          id: string
          is_published: boolean
          priority: string
          publish_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          expire_date?: string | null
          id?: string
          is_published?: boolean
          priority?: string
          publish_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          expire_date?: string | null
          id?: string
          is_published?: boolean
          priority?: string
          publish_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          attendance_status: string | null
          attended_at: string | null
          event_id: string
          id: string
          notes: string | null
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          attendance_status?: string | null
          attended_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          attendance_status?: string | null
          attended_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          registered_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string
          id: string
          is_published: boolean
          location: string | null
          location_type: string
          max_attendees: number | null
          registration_deadline: string | null
          title: string
          updated_at: string
          virtual_link: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          event_date: string
          event_type?: string
          id?: string
          is_published?: boolean
          location?: string | null
          location_type?: string
          max_attendees?: number | null
          registration_deadline?: string | null
          title: string
          updated_at?: string
          virtual_link?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_published?: boolean
          location?: string | null
          location_type?: string
          max_attendees?: number | null
          registration_deadline?: string | null
          title?: string
          updated_at?: string
          virtual_link?: string | null
        }
        Relationships: []
      }
      membership_types: {
        Row: {
          annual_dues: number
          benefits: string[] | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          annual_dues?: number
          benefits?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          annual_dues?: number
          benefits?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          amount: number | null
          created_at: string
          hubtel_status: string | null
          id: string
          log_type: string
          parsed_status: string | null
          payment_id: string | null
          raw_payload: Json
          source_ip: string | null
          transaction_reference: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          hubtel_status?: string | null
          id?: string
          log_type: string
          parsed_status?: string | null
          payment_id?: string | null
          raw_payload: Json
          source_ip?: string | null
          transaction_reference?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          hubtel_status?: string | null
          id?: string
          log_type?: string
          parsed_status?: string | null
          payment_id?: string | null
          raw_payload?: Json
          source_ip?: string | null
          transaction_reference?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_type: string
          status: Database["public"]["Enums"]["payment_status"]
          transaction_reference: string | null
          updated_at: string
          user_id: string
          webhook_token: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_reference?: string | null
          updated_at?: string
          user_id: string
          webhook_token?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_reference?: string | null
          updated_at?: string
          user_id?: string
          webhook_token?: string | null
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          bio: string | null
          created_at: string
          headline: string
          id: string
          is_featured: boolean
          is_published: boolean
          portfolio_images: string[] | null
          services: string[] | null
          skills: string[] | null
          slug: string
          social_links: Json | null
          updated_at: string
          user_id: string
          website_url: string | null
          years_of_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          headline?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          portfolio_images?: string[] | null
          services?: string[] | null
          skills?: string[] | null
          slug: string
          social_links?: Json | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          years_of_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          headline?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          portfolio_images?: string[] | null
          services?: string[] | null
          skills?: string[] | null
          slug?: string
          social_links?: Json | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_branch: string | null
          bank_name: string | null
          bir_registration_number: string | null
          business_address: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          created_at: string
          disability_type: string | null
          education_level: string | null
          email: string
          full_name: string
          gender: string | null
          has_certificate_of_continuance: boolean | null
          has_certificate_of_registration: boolean | null
          id: string
          is_public_directory: boolean
          mailing_address: string | null
          membership_expiry_date: string | null
          membership_start_date: string | null
          membership_status: Database["public"]["Enums"]["membership_status"]
          membership_type_id: string | null
          nis_registration_number: string | null
          notify_announcements: boolean
          notify_event_reminders: boolean
          notify_payment_receipts: boolean
          num_permanent_staff: number | null
          num_temporary_staff: number | null
          phone: string | null
          region: string | null
          special_skills: string | null
          updated_at: string
          user_id: string
          vat_registration_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bir_registration_number?: string | null
          business_address?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string
          disability_type?: string | null
          education_level?: string | null
          email: string
          full_name: string
          gender?: string | null
          has_certificate_of_continuance?: boolean | null
          has_certificate_of_registration?: boolean | null
          id?: string
          is_public_directory?: boolean
          mailing_address?: string | null
          membership_expiry_date?: string | null
          membership_start_date?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          membership_type_id?: string | null
          nis_registration_number?: string | null
          notify_announcements?: boolean
          notify_event_reminders?: boolean
          notify_payment_receipts?: boolean
          num_permanent_staff?: number | null
          num_temporary_staff?: number | null
          phone?: string | null
          region?: string | null
          special_skills?: string | null
          updated_at?: string
          user_id: string
          vat_registration_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bir_registration_number?: string | null
          business_address?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string
          disability_type?: string | null
          education_level?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          has_certificate_of_continuance?: boolean | null
          has_certificate_of_registration?: boolean | null
          id?: string
          is_public_directory?: boolean
          mailing_address?: string | null
          membership_expiry_date?: string | null
          membership_start_date?: string | null
          membership_status?: Database["public"]["Enums"]["membership_status"]
          membership_type_id?: string | null
          nis_registration_number?: string | null
          notify_announcements?: boolean
          notify_event_reminders?: boolean
          notify_payment_receipts?: boolean
          num_permanent_staff?: number | null
          num_temporary_staff?: number | null
          phone?: string | null
          region?: string | null
          special_skills?: string | null
          updated_at?: string
          user_id?: string
          vat_registration_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_membership_type_id_fkey"
            columns: ["membership_type_id"]
            isOneToOne: false
            referencedRelation: "membership_types"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          external_url: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by: string
          description?: string | null
          external_url?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          external_url?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          district: string | null
          id: string
          region: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          id?: string
          region?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          district?: string | null
          id?: string
          region?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_members: {
        Row: {
          avatar_url: string | null
          bank_branch: string | null
          bank_name: string | null
          bir_registration_number: string | null
          business_address: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          created_at: string | null
          education_level: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          has_certificate_of_continuance: boolean | null
          has_certificate_of_registration: boolean | null
          id: string | null
          is_public_directory: boolean | null
          mailing_address: string | null
          membership_expiry_date: string | null
          membership_start_date: string | null
          membership_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          membership_type_id: string | null
          nis_registration_number: string | null
          num_permanent_staff: number | null
          num_temporary_staff: number | null
          region: string | null
          special_skills: string | null
          updated_at: string | null
          user_id: string | null
          vat_registration_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bir_registration_number?: string | null
          business_address?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string | null
          education_level?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          has_certificate_of_continuance?: boolean | null
          has_certificate_of_registration?: boolean | null
          id?: string | null
          is_public_directory?: boolean | null
          mailing_address?: string | null
          membership_expiry_date?: string | null
          membership_start_date?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          membership_type_id?: string | null
          nis_registration_number?: string | null
          num_permanent_staff?: number | null
          num_temporary_staff?: number | null
          region?: string | null
          special_skills?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_registration_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bir_registration_number?: string | null
          business_address?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          created_at?: string | null
          education_level?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          has_certificate_of_continuance?: boolean | null
          has_certificate_of_registration?: boolean | null
          id?: string | null
          is_public_directory?: boolean | null
          mailing_address?: string | null
          membership_expiry_date?: string | null
          membership_start_date?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          membership_type_id?: string | null
          nis_registration_number?: string | null
          num_permanent_staff?: number | null
          num_temporary_staff?: number | null
          region?: string | null
          special_skills?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_registration_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_membership_type_id_fkey"
            columns: ["membership_type_id"]
            isOneToOne: false
            referencedRelation: "membership_types"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_members: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          full_name: string | null
          id: string | null
          membership_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          region: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          full_name?: string | null
          id?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          region?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          business_type?: string | null
          city?: string | null
          full_name?: string | null
          id?: string | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          region?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments_safe: {
        Row: {
          amount: number | null
          created_at: string | null
          due_date: string | null
          id: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          payment_type: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          transaction_reference: string | null
          updated_at: string | null
          user_id: string | null
          webhook_token: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          due_date?: string | null
          id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_reference?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_token?: never
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          due_date?: string | null
          id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_type?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_reference?: string | null
          updated_at?: string | null
          user_id?: string | null
          webhook_token?: never
        }
        Relationships: []
      }
      public_portfolios: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          business_type: string | null
          city: string | null
          full_name: string | null
          headline: string | null
          id: string | null
          is_featured: boolean | null
          portfolio_images: string[] | null
          region: string | null
          services: string[] | null
          skills: string[] | null
          slug: string | null
          social_links: Json | null
          website_url: string | null
          years_of_experience: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role_details: {
        Args: { _user_id: string }
        Returns: {
          district: string
          region: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "member"
        | "admin"
        | "super_admin"
        | "regional_coordinator"
        | "district_coordinator"
      membership_status: "active" | "pending" | "suspended" | "expired"
      payment_status: "pending" | "completed" | "failed" | "refunded"
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
      app_role: [
        "member",
        "admin",
        "super_admin",
        "regional_coordinator",
        "district_coordinator",
      ],
      membership_status: ["active", "pending", "suspended", "expired"],
      payment_status: ["pending", "completed", "failed", "refunded"],
    },
  },
} as const
