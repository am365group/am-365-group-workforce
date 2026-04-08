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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          after_values: Json | null
          before_values: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          notes: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          after_values?: Json | null
          before_values?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          notes?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          after_values?: Json | null
          before_values?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          notes?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          api_credentials_vault_id: string | null
          api_type: string | null
          contact_email: string | null
          created_at: string
          created_by: string | null
          finance_email: string | null
          id: string
          is_active: boolean | null
          name: string
          org_number: string | null
          phone: string | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          api_credentials_vault_id?: string | null
          api_type?: string | null
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          finance_email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_number?: string | null
          phone?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          api_credentials_vault_id?: string | null
          api_type?: string | null
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          finance_email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_number?: string | null
          phone?: string | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_partner_links: {
        Row: {
          id: string
          customer_id: string
          partner_application_id: string
          external_employee_id: string | null
          am365_employee_id: string | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          partner_application_id: string
          external_employee_id?: string | null
          am365_employee_id?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          partner_application_id?: string
          external_employee_id?: string | null
          am365_employee_id?: string | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_partner_links_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_partner_links_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          }
        ]
      }
      gdpr_requests: {
        Row: {
          created_at: string
          export_file_path: string | null
          id: string
          notes: string | null
          partner_application_id: string | null
          processed_at: string | null
          processed_by: string | null
          request_type: Database["public"]["Enums"]["gdpr_request_type"]
          requested_by: string | null
          status: Database["public"]["Enums"]["gdpr_request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          export_file_path?: string | null
          id?: string
          notes?: string | null
          partner_application_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type: Database["public"]["Enums"]["gdpr_request_type"]
          requested_by?: string | null
          status?: Database["public"]["Enums"]["gdpr_request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          export_file_path?: string | null
          id?: string
          notes?: string | null
          partner_application_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          request_type?: Database["public"]["Enums"]["gdpr_request_type"]
          requested_by?: string | null
          status?: Database["public"]["Enums"]["gdpr_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gdpr_requests_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gdpr_requests_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string
          deliveries: number | null
          delivery_rate: number | null
          description: string
          hours: number | null
          id: string
          invoice_id: string
          line_total: number
          partner_application_id: string | null
          unit_rate: number
        }
        Insert: {
          created_at?: string
          deliveries?: number | null
          delivery_rate?: number | null
          description: string
          hours?: number | null
          id?: string
          invoice_id: string
          line_total: number
          partner_application_id?: string | null
          unit_rate: number
        }
        Update: {
          created_at?: string
          deliveries?: number | null
          delivery_rate?: number | null
          description?: string
          hours?: number | null
          id?: string
          invoice_id?: string
          line_total?: number
          partner_application_id?: string | null
          unit_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          due_date: string | null
          fortnox_id: string | null
          id: string
          invoice_number: string
          notes: string | null
          paid_at: string | null
          pdf_storage_path: string | null
          period_month: number
          period_year: number
          platform_margin: number | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total_amount: number
          total_deliveries: number | null
          total_hours: number | null
          updated_at: string
          vat_amount: number
          vat_rate: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          fortnox_id?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          paid_at?: string | null
          pdf_storage_path?: string | null
          period_month: number
          period_year: number
          platform_margin?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          total_amount: number
          total_deliveries?: number | null
          total_hours?: number | null
          updated_at?: string
          vat_amount: number
          vat_rate?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          due_date?: string | null
          fortnox_id?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          pdf_storage_path?: string | null
          period_month?: number
          period_year?: number
          platform_margin?: number | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          total_amount?: number
          total_deliveries?: number | null
          total_hours?: number | null
          updated_at?: string
          vat_amount?: number
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      onboarding_events: {
        Row: {
          application_id: string
          created_at: string
          event_type: string
          id: string
          notes: string | null
          performed_by: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          event_type: string
          id?: string
          notes?: string | null
          performed_by?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          event_type?: string
          id?: string
          notes?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          activation_email_sent_at: string | null
          address_verified: boolean | null
          apartment: string | null
          bank_account_number: string | null
          bank_clearing_number: string | null
          bank_details_verified: boolean | null
          bankid_session_id: string | null
          city: string
          country: string | null
          created_at: string
          date_of_birth: string | null
          delivery_bonus: number | null
          documents_submitted_at: string | null
          documents_verified: boolean | null
          documents_verified_at: string | null
          email: string
          first_name: string
          hourly_rate: number | null
          id: string
          id_verified: boolean | null
          last_name: string
          nationality: string | null
          personal_number: string
          personal_number_encrypted: string | null
          phone: string
          post_code: string
          reg_path: Database["public"]["Enums"]["registration_path"] | null
          review_notes: string | null
          reviewed_by: string | null
          skatt_id_verified: boolean | null
          status: Database["public"]["Enums"]["application_status"]
          street_address: string
          transport: Database["public"]["Enums"]["transport_type"]
          updated_at: string
          user_id: string | null
          verification_code: string | null
          verification_expires_at: string | null
          verified_at: string | null
          verify_attempts: number | null
          verify_locked_until: string | null
          wolt_partner_email: string | null
          wolt_partner_id: string | null
        }
        Insert: {
          activation_email_sent_at?: string | null
          address_verified?: boolean | null
          apartment?: string | null
          bank_account_number?: string | null
          bank_clearing_number?: string | null
          bank_details_verified?: boolean | null
          bankid_session_id?: string | null
          city: string
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          delivery_bonus?: number | null
          documents_submitted_at?: string | null
          documents_verified?: boolean | null
          documents_verified_at?: string | null
          email: string
          first_name: string
          hourly_rate?: number | null
          id?: string
          id_verified?: boolean | null
          last_name: string
          nationality?: string | null
          personal_number: string
          personal_number_encrypted?: string | null
          phone: string
          post_code: string
          reg_path?: Database["public"]["Enums"]["registration_path"] | null
          review_notes?: string | null
          reviewed_by?: string | null
          skatt_id_verified?: boolean | null
          status?: Database["public"]["Enums"]["application_status"]
          street_address: string
          transport: Database["public"]["Enums"]["transport_type"]
          updated_at?: string
          user_id?: string | null
          verification_code?: string | null
          verification_expires_at?: string | null
          verified_at?: string | null
          verify_attempts?: number | null
          verify_locked_until?: string | null
          wolt_partner_email?: string | null
          wolt_partner_id?: string | null
        }
        Update: {
          activation_email_sent_at?: string | null
          address_verified?: boolean | null
          apartment?: string | null
          bank_account_number?: string | null
          bank_clearing_number?: string | null
          bank_details_verified?: boolean | null
          bankid_session_id?: string | null
          city?: string
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          delivery_bonus?: number | null
          documents_submitted_at?: string | null
          documents_verified?: boolean | null
          documents_verified_at?: string | null
          email?: string
          first_name?: string
          hourly_rate?: number | null
          id?: string
          id_verified?: boolean | null
          last_name?: string
          nationality?: string | null
          personal_number?: string
          personal_number_encrypted?: string | null
          phone?: string
          post_code?: string
          reg_path?: Database["public"]["Enums"]["registration_path"] | null
          review_notes?: string | null
          reviewed_by?: string | null
          skatt_id_verified?: boolean | null
          status?: Database["public"]["Enums"]["application_status"]
          street_address?: string
          transport?: Database["public"]["Enums"]["transport_type"]
          updated_at?: string
          user_id?: string | null
          verification_code?: string | null
          verification_expires_at?: string | null
          verified_at?: string | null
          verify_attempts?: number | null
          verify_locked_until?: string | null
          wolt_partner_email?: string | null
          wolt_partner_id?: string | null
        }
        Relationships: []
      }
      partner_contracts: {
        Row: {
          application_id: string
          contract_content: string | null
          created_at: string
          created_by: string | null
          id: string
          partner_user_id: string | null
          sent_at: string | null
          signed_at: string | null
          signing_link: string | null
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          application_id: string
          contract_content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          partner_user_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signing_link?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          application_id?: string
          contract_content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          partner_user_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signing_link?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_contracts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_contracts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_documents: {
        Row: {
          application_id: string
          created_at: string | null
          document_type: string
          expiry_date: string | null
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          rejection_reason: string | null
          side: string | null
          status: string | null
          storage_path: string | null
          updated_at: string | null
          uploaded_at: string | null
          verified_at: string | null
          verified_by: string | null
          verifier_notes: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          document_type: string
          expiry_date?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          rejection_reason?: string | null
          side?: string | null
          status?: string | null
          storage_path?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verifier_notes?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          document_type?: string
          expiry_date?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          rejection_reason?: string | null
          side?: string | null
          status?: string | null
          storage_path?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          verifier_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications_admin"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_entries: {
        Row: {
          adjustment_amount: number | null
          adjustment_reason: string | null
          created_at: string
          deliveries: number
          delivery_bonus: number
          employer_fee: number
          employer_fee_rate: number | null
          gross_salary: number
          hourly_rate: number
          hours_worked: number
          id: string
          net_salary: number
          notes: string | null
          partner_application_id: string
          payroll_run_id: string
          tax_amount: number
          tax_table_used: string | null
        }
        Insert: {
          adjustment_amount?: number | null
          adjustment_reason?: string | null
          created_at?: string
          deliveries?: number
          delivery_bonus?: number
          employer_fee: number
          employer_fee_rate?: number | null
          gross_salary: number
          hourly_rate: number
          hours_worked?: number
          id?: string
          net_salary: number
          notes?: string | null
          partner_application_id: string
          payroll_run_id: string
          tax_amount: number
          tax_table_used?: string | null
        }
        Update: {
          adjustment_amount?: number | null
          adjustment_reason?: string | null
          created_at?: string
          deliveries?: number
          delivery_bonus?: number
          employer_fee?: number
          employer_fee_rate?: number | null
          gross_salary?: number
          hourly_rate?: number
          hours_worked?: number
          id?: string
          net_salary?: number
          notes?: string | null
          partner_application_id?: string
          payroll_run_id?: string
          tax_amount?: number
          tax_table_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bgmax_file_url: string | null
          created_at: string
          created_by: string | null
          id: string
          locked_at: string | null
          notes: string | null
          period_month: number
          period_year: number
          status: Database["public"]["Enums"]["payroll_status"]
          total_employer_fee: number | null
          total_gross: number | null
          total_net: number | null
          total_tax: number | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bgmax_file_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          locked_at?: string | null
          notes?: string | null
          period_month: number
          period_year: number
          status?: Database["public"]["Enums"]["payroll_status"]
          total_employer_fee?: number | null
          total_gross?: number | null
          total_net?: number | null
          total_tax?: number | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bgmax_file_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          locked_at?: string | null
          notes?: string | null
          period_month?: number
          period_year?: number
          status?: Database["public"]["Enums"]["payroll_status"]
          total_employer_fee?: number | null
          total_gross?: number | null
          total_net?: number | null
          total_tax?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      payslips: {
        Row: {
          created_at: string
          emailed_at: string | null
          id: string
          partner_application_id: string
          payroll_entry_id: string
          pdf_storage_path: string | null
          period_month: number
          period_year: number
          sms_sent_at: string | null
        }
        Insert: {
          created_at?: string
          emailed_at?: string | null
          id?: string
          partner_application_id: string
          payroll_entry_id: string
          pdf_storage_path?: string | null
          period_month: number
          period_year: number
          sms_sent_at?: string | null
        }
        Update: {
          created_at?: string
          emailed_at?: string | null
          id?: string
          partner_application_id?: string
          payroll_entry_id?: string
          pdf_storage_path?: string | null
          period_month?: number
          period_year?: number
          sms_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payslips_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_payroll_entry_id_fkey"
            columns: ["payroll_entry_id"]
            isOneToOne: false
            referencedRelation: "payroll_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          user_type?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      schedule_assignments: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          partner_application_id: string
          responded_at: string | null
          schedule_id: string
          status: Database["public"]["Enums"]["schedule_assignment_status"]
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          partner_application_id: string
          responded_at?: string | null
          schedule_id: string
          status?: Database["public"]["Enums"]["schedule_assignment_status"]
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          partner_application_id?: string
          responded_at?: string | null
          schedule_id?: string
          status?: Database["public"]["Enums"]["schedule_assignment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "schedule_assignments_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications_admin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          end_datetime: string
          id: string
          location: string | null
          max_partners: number | null
          notes: string | null
          start_datetime: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          end_datetime: string
          id?: string
          location?: string | null
          max_partners?: number | null
          notes?: string | null
          start_datetime: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          end_datetime?: string
          id?: string
          location?: string | null
          max_partners?: number | null
          notes?: string | null
          start_datetime?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
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
      wolt_delivery_data: {
        Row: {
          corrected_by: string | null
          correction_notes: string | null
          created_at: string
          data_source: Database["public"]["Enums"]["data_source_type"]
          deliveries_completed: number
          flag_reason: string | null
          hours_worked: number
          id: string
          is_flagged: boolean | null
          is_locked: boolean | null
          partner_application_id: string
          payroll_run_id: string | null
          updated_at: string
          work_date: string
        }
        Insert: {
          corrected_by?: string | null
          correction_notes?: string | null
          created_at?: string
          data_source?: Database["public"]["Enums"]["data_source_type"]
          deliveries_completed?: number
          flag_reason?: string | null
          hours_worked?: number
          id?: string
          is_flagged?: boolean | null
          is_locked?: boolean | null
          partner_application_id: string
          payroll_run_id?: string | null
          updated_at?: string
          work_date: string
        }
        Update: {
          corrected_by?: string | null
          correction_notes?: string | null
          created_at?: string
          data_source?: Database["public"]["Enums"]["data_source_type"]
          deliveries_completed?: number
          flag_reason?: string | null
          hours_worked?: number
          id?: string
          is_flagged?: boolean | null
          is_locked?: boolean | null
          partner_application_id?: string
          payroll_run_id?: string | null
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wolt_data_payroll_run"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolt_delivery_data_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wolt_delivery_data_partner_application_id_fkey"
            columns: ["partner_application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications_admin"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      partner_applications_admin: {
        Row: {
          activation_email_sent_at: string | null
          address_verified: boolean | null
          apartment: string | null
          bank_account_number: string | null
          bank_clearing_number: string | null
          bank_details_verified: boolean | null
          bankid_session_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          delivery_bonus: number | null
          documents_submitted_at: string | null
          documents_verified: boolean | null
          documents_verified_at: string | null
          email: string | null
          first_name: string | null
          hourly_rate: number | null
          id: string | null
          id_verified: boolean | null
          last_name: string | null
          nationality: string | null
          personal_number: string | null
          personal_number_decrypted: string | null
          personal_number_encrypted: string | null
          phone: string | null
          post_code: string | null
          reg_path: Database["public"]["Enums"]["registration_path"] | null
          review_notes: string | null
          reviewed_by: string | null
          skatt_id_verified: boolean | null
          status: Database["public"]["Enums"]["application_status"] | null
          street_address: string | null
          transport: Database["public"]["Enums"]["transport_type"] | null
          updated_at: string | null
          user_id: string | null
          verification_code: string | null
          verification_expires_at: string | null
          verified_at: string | null
          verify_attempts: number | null
          verify_locked_until: string | null
          wolt_partner_email: string | null
          wolt_partner_id: string | null
        }
        Insert: {
          activation_email_sent_at?: string | null
          address_verified?: boolean | null
          apartment?: string | null
          bank_account_number?: string | null
          bank_clearing_number?: string | null
          bank_details_verified?: boolean | null
          bankid_session_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          delivery_bonus?: number | null
          documents_submitted_at?: string | null
          documents_verified?: boolean | null
          documents_verified_at?: string | null
          email?: string | null
          first_name?: string | null
          hourly_rate?: number | null
          id?: string | null
          id_verified?: boolean | null
          last_name?: string | null
          nationality?: string | null
          personal_number?: string | null
          personal_number_decrypted?: never
          personal_number_encrypted?: string | null
          phone?: string | null
          post_code?: string | null
          reg_path?: Database["public"]["Enums"]["registration_path"] | null
          review_notes?: string | null
          reviewed_by?: string | null
          skatt_id_verified?: boolean | null
          status?: Database["public"]["Enums"]["application_status"] | null
          street_address?: string | null
          transport?: Database["public"]["Enums"]["transport_type"] | null
          updated_at?: string | null
          user_id?: string | null
          verification_code?: string | null
          verification_expires_at?: string | null
          verified_at?: string | null
          verify_attempts?: number | null
          verify_locked_until?: string | null
          wolt_partner_email?: string | null
          wolt_partner_id?: string | null
        }
        Update: {
          activation_email_sent_at?: string | null
          address_verified?: boolean | null
          apartment?: string | null
          bank_account_number?: string | null
          bank_clearing_number?: string | null
          bank_details_verified?: boolean | null
          bankid_session_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          delivery_bonus?: number | null
          documents_submitted_at?: string | null
          documents_verified?: boolean | null
          documents_verified_at?: string | null
          email?: string | null
          first_name?: string | null
          hourly_rate?: number | null
          id?: string | null
          id_verified?: boolean | null
          last_name?: string | null
          nationality?: string | null
          personal_number?: string | null
          personal_number_decrypted?: never
          personal_number_encrypted?: string | null
          phone?: string | null
          post_code?: string | null
          reg_path?: Database["public"]["Enums"]["registration_path"] | null
          review_notes?: string | null
          reviewed_by?: string | null
          skatt_id_verified?: boolean | null
          status?: Database["public"]["Enums"]["application_status"] | null
          street_address?: string | null
          transport?: Database["public"]["Enums"]["transport_type"] | null
          updated_at?: string | null
          user_id?: string | null
          verification_code?: string | null
          verification_expires_at?: string | null
          verified_at?: string | null
          verify_attempts?: number | null
          verify_locked_until?: string | null
          wolt_partner_email?: string | null
          wolt_partner_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      decrypt_pii: { Args: { cipher_text: string }; Returns: string }
      encrypt_pii: { Args: { plain_text: string }; Returns: string }
      get_expiring_documents: {
        Args: { days_ahead?: number }
        Returns: {
          application_id: string
          days_until_expiry: number
          document_id: string
          document_type: string
          expiry_date: string
          partner_email: string
          partner_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: Database["public"]["Enums"]["audit_action"]
          p_after?: Json
          p_before?: Json
          p_entity_id?: string
          p_entity_type: string
          p_ip?: string
          p_notes?: string
          p_user_id: string
        }
        Returns: string
      }
      verify_partner_application: {
        Args: { app_id: string; code: string }
        Returns: {
          activation_email_sent_at: string | null
          address_verified: boolean | null
          apartment: string | null
          bank_account_number: string | null
          bank_clearing_number: string | null
          bank_details_verified: boolean | null
          bankid_session_id: string | null
          city: string
          country: string | null
          created_at: string
          date_of_birth: string | null
          delivery_bonus: number | null
          documents_submitted_at: string | null
          documents_verified: boolean | null
          documents_verified_at: string | null
          email: string
          first_name: string
          hourly_rate: number | null
          id: string
          id_verified: boolean | null
          last_name: string
          nationality: string | null
          personal_number: string
          personal_number_encrypted: string | null
          phone: string
          post_code: string
          reg_path: Database["public"]["Enums"]["registration_path"] | null
          review_notes: string | null
          reviewed_by: string | null
          skatt_id_verified: boolean | null
          status: Database["public"]["Enums"]["application_status"]
          street_address: string
          transport: Database["public"]["Enums"]["transport_type"]
          updated_at: string
          user_id: string | null
          verification_code: string | null
          verification_expires_at: string | null
          verified_at: string | null
          verify_attempts: number | null
          verify_locked_until: string | null
          wolt_partner_email: string | null
          wolt_partner_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "partner_applications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      app_role: "admin" | "controller" | "verifier"
      application_status:
        | "pending"
        | "email_verified"
        | "under_review"
        | "verified"
        | "contract_sent"
        | "contract_signed"
        | "active"
        | "rejected"
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "approve"
        | "reject"
        | "export"
        | "upload"
        | "download"
        | "send"
      contract_status: "draft" | "sent" | "signed" | "expired"
      data_source_type: "wolt_api" | "csv_upload" | "manual"
      gdpr_request_status: "pending" | "processing" | "completed" | "denied"
      gdpr_request_type: "access" | "erasure"
      invoice_status: "draft" | "sent" | "paid" | "overdue"
      notification_type: "info" | "warning" | "success" | "error"
      payroll_status: "draft" | "locked" | "approved" | "paid"
      registration_path: "bankid" | "manual"
      schedule_assignment_status:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
      transport_type: "bicycle" | "moped" | "car"
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
      app_role: ["admin", "controller", "verifier"],
      application_status: [
        "pending",
        "email_verified",
        "under_review",
        "verified",
        "contract_sent",
        "contract_signed",
        "active",
        "rejected",
      ],
      audit_action: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "approve",
        "reject",
        "export",
        "upload",
        "download",
        "send",
      ],
      contract_status: ["draft", "sent", "signed", "expired"],
      data_source_type: ["wolt_api", "csv_upload", "manual"],
      gdpr_request_status: ["pending", "processing", "completed", "denied"],
      gdpr_request_type: ["access", "erasure"],
      invoice_status: ["draft", "sent", "paid", "overdue"],
      notification_type: ["info", "warning", "success", "error"],
      payroll_status: ["draft", "locked", "approved", "paid"],
      registration_path: ["bankid", "manual"],
      schedule_assignment_status: [
        "pending",
        "accepted",
        "declined",
        "cancelled",
      ],
      transport_type: ["bicycle", "moped", "car"],
    },
  },
} as const
