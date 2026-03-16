 
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
      employee_fingerprints: {
        Row: {
          device_template_id: string | null
          employee_id: string
          enrolled_at: string | null
          enrolled_by: string | null
          finger_index: number
          fingerprint_template: string
          id: string
          is_active: boolean | null
          quality_score: number | null
        }
        Insert: {
          device_template_id?: string | null
          employee_id: string
          enrolled_at?: string | null
          enrolled_by?: string | null
          finger_index: number
          fingerprint_template: string
          id?: string
          is_active?: boolean | null
          quality_score?: number | null
        }
        Update: {
          device_template_id?: string | null
          employee_id?: string
          enrolled_at?: string | null
          enrolled_by?: string | null
          finger_index?: number
          fingerprint_template?: string
          id?: string
          is_active?: boolean | null
          quality_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_fingerprints_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_payroll_balances: {
        Row: {
          balance: number
          employee_id: string
          id: string
          last_updated: string | null
        }
        Insert: {
          balance?: number
          employee_id: string
          id?: string
          last_updated?: string | null
        }
        Update: {
          balance?: number
          employee_id?: string
          id?: string
          last_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_payroll_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          employee_number: string | null
          hourly_rate: number
          id: string
          is_active: boolean | null
          name: string
          phone: string
          position: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          employee_number?: string | null
          hourly_rate: number
          id?: string
          is_active?: boolean | null
          name: string
          phone: string
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          employee_number?: string | null
          hourly_rate?: number
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
          position?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fingerprint_devices: {
        Row: {
          api_key: string | null
          connection_status: string | null
          created_at: string | null
          device_ip: string
          device_model: string | null
          device_name: string
          device_port: number
          device_serial: string | null
          id: string
          is_active: boolean | null
          is_online: boolean | null
          last_sync: string | null
          updated_at: string | null
        }
        Insert: {
          api_key?: string | null
          connection_status?: string | null
          created_at?: string | null
          device_ip: string
          device_model?: string | null
          device_name: string
          device_port?: number
          device_serial?: string | null
          id?: string
          is_active?: boolean | null
          is_online?: boolean | null
          last_sync?: string | null
          updated_at?: string | null
        }
        Update: {
          api_key?: string | null
          connection_status?: string | null
          created_at?: string | null
          device_ip?: string
          device_model?: string | null
          device_name?: string
          device_port?: number
          device_serial?: string | null
          id?: string
          is_active?: boolean | null
          is_online?: boolean | null
          last_sync?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fingerprint_punch_logs: {
        Row: {
          created_at: string | null
          device_id: string | null
          employee_id: string | null
          failure_reason: string | null
          fingerprint_id: string | null
          id: string
          match_score: number | null
          punch_time: string
          punch_type: string
          success: boolean | null
          time_entry_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          employee_id?: string | null
          failure_reason?: string | null
          fingerprint_id?: string | null
          id?: string
          match_score?: number | null
          punch_time?: string
          punch_type: string
          success?: boolean | null
          time_entry_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          employee_id?: string | null
          failure_reason?: string | null
          fingerprint_id?: string | null
          id?: string
          match_score?: number | null
          punch_time?: string
          punch_type?: string
          success?: boolean | null
          time_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fingerprint_punch_logs_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "fingerprint_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fingerprint_punch_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fingerprint_punch_logs_fingerprint_id_fkey"
            columns: ["fingerprint_id"]
            isOneToOne: false
            referencedRelation: "employee_fingerprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fingerprint_punch_logs_time_entry_id_fkey"
            columns: ["time_entry_id"]
            isOneToOne: false
            referencedRelation: "time_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_adjustments: {
        Row: {
          adjustment_type: string
          amount: number
          clock_in: string | null
          clock_out: string | null
          created_at: string | null
          date: string
          employee_id: string
          hours: number | null
          id: string
          paid: boolean | null
          reason: string
        }
        Insert: {
          adjustment_type: string
          amount: number
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date?: string
          employee_id: string
          hours?: number | null
          id?: string
          paid?: boolean | null
          reason: string
        }
        Update: {
          adjustment_type?: string
          amount?: number
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          hours?: number | null
          id?: string
          paid?: boolean | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_adjustments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          check_number: string | null
          created_at: string | null
          custom_payment_amount: number | null
          employee_id: string
          gross_pay: number
          id: string
          paid_at: string | null
          payroll_period_id: string
          status: string | null
          total_hours: number
        }
        Insert: {
          check_number?: string | null
          created_at?: string | null
          custom_payment_amount?: number | null
          employee_id: string
          gross_pay: number
          id?: string
          paid_at?: string | null
          payroll_period_id: string
          status?: string | null
          total_hours: number
        }
        Update: {
          check_number?: string | null
          created_at?: string | null
          custom_payment_amount?: number | null
          employee_id?: string
          gross_pay?: number
          id?: string
          paid_at?: string | null
          payroll_period_id?: string
          status?: string | null
          total_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          created_at: string | null
          custom_payment_amount: number | null
          end_date: string
          id: string
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string | null
          custom_payment_amount?: number | null
          end_date: string
          id?: string
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string | null
          custom_payment_amount?: number | null
          end_date?: string
          id?: string
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      payroll_transactions: {
        Row: {
          amount_earned: number
          amount_paid: number
          balance_after: number
          balance_before: number
          created_at: string | null
          date_range_end: string
          date_range_start: string
          employee_id: string
          hours_worked: number | null
          id: string
          notes: string | null
          payment_reference: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount_earned?: number
          amount_paid?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          date_range_end: string
          date_range_start: string
          employee_id: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          payment_reference?: string | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount_earned?: number
          amount_paid?: number
          balance_after?: number
          balance_before?: number
          created_at?: string | null
          date_range_end?: string
          date_range_start?: string
          employee_id?: string
          hours_worked?: number | null
          id?: string
          notes?: string | null
          payment_reference?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string | null
          earnings: number | null
          employee_id: string
          hours_worked: number | null
          id: string
          paid: boolean | null
        }
        Insert: {
          clock_in: string
          clock_out?: string | null
          created_at?: string | null
          earnings?: number | null
          employee_id: string
          hours_worked?: number | null
          id?: string
          paid?: boolean | null
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          earnings?: number | null
          employee_id?: string
          hours_worked?: number | null
          id?: string
          paid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
