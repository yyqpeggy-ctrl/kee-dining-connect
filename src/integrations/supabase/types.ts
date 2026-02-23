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
      asset_depreciation_records: {
        Row: {
          accumulated_total: number
          asset_id: string
          created_at: string
          depreciation_amount: number
          id: string
          net_value_after: number
          period: string
        }
        Insert: {
          accumulated_total?: number
          asset_id: string
          created_at?: string
          depreciation_amount?: number
          id?: string
          net_value_after?: number
          period: string
        }
        Update: {
          accumulated_total?: number
          asset_id?: string
          created_at?: string
          depreciation_amount?: number
          id?: string
          net_value_after?: number
          period?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_depreciation_records_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
        ]
      }
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
      finance_transactions: {
        Row: {
          amount: number
          category: string
          compliance_status: string
          created_at: string
          created_by: string | null
          credit_account: string
          currency: string
          debit_account: string
          description_en: string
          description_zh: string
          id: string
          linked_asset_id: string | null
          linked_depreciation_id: string | null
          linked_order_id: string | null
          linked_procurement_id: string | null
          notes: string | null
          payment_method: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          store_id: string
          store_name_en: string
          store_name_zh: string
          transaction_number: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          compliance_status?: string
          created_at?: string
          created_by?: string | null
          credit_account?: string
          currency?: string
          debit_account?: string
          description_en?: string
          description_zh?: string
          id?: string
          linked_asset_id?: string | null
          linked_depreciation_id?: string | null
          linked_order_id?: string | null
          linked_procurement_id?: string | null
          notes?: string | null
          payment_method?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          store_id?: string
          store_name_en?: string
          store_name_zh?: string
          transaction_number?: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          compliance_status?: string
          created_at?: string
          created_by?: string | null
          credit_account?: string
          currency?: string
          debit_account?: string
          description_en?: string
          description_zh?: string
          id?: string
          linked_asset_id?: string | null
          linked_depreciation_id?: string | null
          linked_order_id?: string | null
          linked_procurement_id?: string | null
          notes?: string | null
          payment_method?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          store_id?: string
          store_name_en?: string
          store_name_zh?: string
          transaction_number?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_linked_asset_id_fkey"
            columns: ["linked_asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_linked_depreciation_id_fkey"
            columns: ["linked_depreciation_id"]
            isOneToOne: false
            referencedRelation: "asset_depreciation_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_linked_order_id_fkey"
            columns: ["linked_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_linked_procurement_id_fkey"
            columns: ["linked_procurement_id"]
            isOneToOne: false
            referencedRelation: "procurement_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_assets: {
        Row: {
          accumulated_depreciation: number
          category: string
          created_at: string
          created_by: string | null
          depreciation_method: string
          disposed_at: string | null
          disposed_reason: string | null
          disposed_value: number | null
          id: string
          location: string | null
          name_en: string
          name_zh: string
          net_value: number
          notes: string | null
          original_value: number
          purchase_date: string
          salvage_value: number
          serial_number: string | null
          status: string
          store_id: string
          store_name_en: string
          store_name_zh: string
          supplier: string | null
          updated_at: string
          useful_life_years: number
          warranty_expiry: string | null
        }
        Insert: {
          accumulated_depreciation?: number
          category?: string
          created_at?: string
          created_by?: string | null
          depreciation_method?: string
          disposed_at?: string | null
          disposed_reason?: string | null
          disposed_value?: number | null
          id?: string
          location?: string | null
          name_en?: string
          name_zh: string
          net_value?: number
          notes?: string | null
          original_value?: number
          purchase_date?: string
          salvage_value?: number
          serial_number?: string | null
          status?: string
          store_id?: string
          store_name_en?: string
          store_name_zh?: string
          supplier?: string | null
          updated_at?: string
          useful_life_years?: number
          warranty_expiry?: string | null
        }
        Update: {
          accumulated_depreciation?: number
          category?: string
          created_at?: string
          created_by?: string | null
          depreciation_method?: string
          disposed_at?: string | null
          disposed_reason?: string | null
          disposed_value?: number | null
          id?: string
          location?: string | null
          name_en?: string
          name_zh?: string
          net_value?: number
          notes?: string | null
          original_value?: number
          purchase_date?: string
          salvage_value?: number
          serial_number?: string | null
          status?: string
          store_id?: string
          store_name_en?: string
          store_name_zh?: string
          supplier?: string | null
          updated_at?: string
          useful_life_years?: number
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      inventory_deductions: {
        Row: {
          created_at: string
          deducted_by: string | null
          id: string
          inventory_item_id: string | null
          inventory_item_name: string
          menu_item_name: string | null
          order_id: string | null
          quantity: number
          reason: string
          unit: string
        }
        Insert: {
          created_at?: string
          deducted_by?: string | null
          id?: string
          inventory_item_id?: string | null
          inventory_item_name: string
          menu_item_name?: string | null
          order_id?: string | null
          quantity: number
          reason?: string
          unit?: string
        }
        Update: {
          created_at?: string
          deducted_by?: string | null
          id?: string
          inventory_item_id?: string | null
          inventory_item_name?: string
          menu_item_name?: string | null
          order_id?: string | null
          quantity?: number
          reason?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_deductions_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category_en: string
          category_zh: string
          created_at: string
          id: string
          min_stock: number
          name_en: string
          name_zh: string
          pour_cost: number
          status: string
          stock: number
          target_cost: number
          unit: string
          updated_at: string
          usage_7d: number
        }
        Insert: {
          category_en?: string
          category_zh?: string
          created_at?: string
          id?: string
          min_stock?: number
          name_en: string
          name_zh: string
          pour_cost?: number
          status?: string
          stock?: number
          target_cost?: number
          unit?: string
          updated_at?: string
          usage_7d?: number
        }
        Update: {
          category_en?: string
          category_zh?: string
          created_at?: string
          id?: string
          min_stock?: number
          name_en?: string
          name_zh?: string
          pour_cost?: number
          status?: string
          stock?: number
          target_cost?: number
          unit?: string
          updated_at?: string
          usage_7d?: number
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string
          cost_price: number | null
          created_at: string
          description_en: string | null
          description_zh: string | null
          id: string
          image_url: string | null
          ingredients: Json | null
          is_available: boolean
          is_featured: boolean
          max_participants: number | null
          name_en: string
          name_zh: string
          price: number
          schedule_days: string[] | null
          schedule_time: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          cost_price?: number | null
          created_at?: string
          description_en?: string | null
          description_zh?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          is_available?: boolean
          is_featured?: boolean
          max_participants?: number | null
          name_en: string
          name_zh: string
          price?: number
          schedule_days?: string[] | null
          schedule_time?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          cost_price?: number | null
          created_at?: string
          description_en?: string | null
          description_zh?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          is_available?: boolean
          is_featured?: boolean
          max_participants?: number | null
          name_en?: string
          name_zh?: string
          price?: number
          schedule_days?: string[] | null
          schedule_time?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string | null
          name_en: string
          name_zh: string
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name_en?: string
          name_zh: string
          order_id: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name_en?: string
          name_zh?: string
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_number: string
          status: string
          table_name: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: string
          table_name?: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: string
          table_name?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      procurement_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          compliance_checked: boolean
          compliance_notes: string | null
          contract_number: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          items: Json
          linked_asset_id: string | null
          linked_inventory_item_id: string | null
          notes: string | null
          order_number: string
          paid_amount: number
          paid_at: string | null
          payment_due_date: string | null
          payment_method: string | null
          status: string
          store_id: string
          store_name_en: string
          store_name_zh: string
          supplier_contact: string | null
          supplier_id: string | null
          supplier_name: string
          total_amount: number
          type: string
          updated_at: string
          warranty_months: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          compliance_checked?: boolean
          compliance_notes?: string | null
          contract_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          items?: Json
          linked_asset_id?: string | null
          linked_inventory_item_id?: string | null
          notes?: string | null
          order_number?: string
          paid_amount?: number
          paid_at?: string | null
          payment_due_date?: string | null
          payment_method?: string | null
          status?: string
          store_id?: string
          store_name_en?: string
          store_name_zh?: string
          supplier_contact?: string | null
          supplier_id?: string | null
          supplier_name?: string
          total_amount?: number
          type?: string
          updated_at?: string
          warranty_months?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          compliance_checked?: boolean
          compliance_notes?: string | null
          contract_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          items?: Json
          linked_asset_id?: string | null
          linked_inventory_item_id?: string | null
          notes?: string | null
          order_number?: string
          paid_amount?: number
          paid_at?: string | null
          payment_due_date?: string | null
          payment_method?: string | null
          status?: string
          store_id?: string
          store_name_en?: string
          store_name_zh?: string
          supplier_contact?: string | null
          supplier_id?: string | null
          supplier_name?: string
          total_amount?: number
          type?: string
          updated_at?: string
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "procurement_orders_linked_asset_id_fkey"
            columns: ["linked_asset_id"]
            isOneToOne: false
            referencedRelation: "fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurement_orders_linked_inventory_item_id_fkey"
            columns: ["linked_inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procurement_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_receipts: {
        Row: {
          created_at: string
          created_by: string | null
          extracted_date: string | null
          extracted_items: Json | null
          extracted_supplier: string | null
          extracted_total: number | null
          file_type: string
          file_url: string
          id: string
          match_details: Json | null
          match_status: string
          notes: string | null
          ocr_result: Json | null
          ocr_status: string
          payment_request_status: string
          payment_requested_at: string | null
          payment_requested_by: string | null
          procurement_order_id: string | null
          signature_confidence: number | null
          signature_detected: boolean | null
          signature_notes: string | null
          store_id: string
          store_name_en: string
          store_name_zh: string
          supplier_invoice_ocr: Json | null
          supplier_invoice_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          extracted_date?: string | null
          extracted_items?: Json | null
          extracted_supplier?: string | null
          extracted_total?: number | null
          file_type?: string
          file_url?: string
          id?: string
          match_details?: Json | null
          match_status?: string
          notes?: string | null
          ocr_result?: Json | null
          ocr_status?: string
          payment_request_status?: string
          payment_requested_at?: string | null
          payment_requested_by?: string | null
          procurement_order_id?: string | null
          signature_confidence?: number | null
          signature_detected?: boolean | null
          signature_notes?: string | null
          store_id?: string
          store_name_en?: string
          store_name_zh?: string
          supplier_invoice_ocr?: Json | null
          supplier_invoice_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          extracted_date?: string | null
          extracted_items?: Json | null
          extracted_supplier?: string | null
          extracted_total?: number | null
          file_type?: string
          file_url?: string
          id?: string
          match_details?: Json | null
          match_status?: string
          notes?: string | null
          ocr_result?: Json | null
          ocr_status?: string
          payment_request_status?: string
          payment_requested_at?: string | null
          payment_requested_by?: string | null
          procurement_order_id?: string | null
          signature_confidence?: number | null
          signature_detected?: boolean | null
          signature_notes?: string | null
          store_id?: string
          store_name_en?: string
          store_name_zh?: string
          supplier_invoice_ocr?: Json | null
          supplier_invoice_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_receipts_procurement_order_id_fkey"
            columns: ["procurement_order_id"]
            isOneToOne: false
            referencedRelation: "procurement_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      renovation_projects: {
        Row: {
          budget: number
          contractor: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          manager_en: string
          manager_zh: string
          notes: string | null
          phase_en: string
          phase_zh: string
          progress: number
          spent: number
          start_date: string
          status: string
          store_id: string
          store_name_en: string
          store_name_zh: string
          updated_at: string
        }
        Insert: {
          budget?: number
          contractor?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          manager_en?: string
          manager_zh?: string
          notes?: string | null
          phase_en?: string
          phase_zh?: string
          progress?: number
          spent?: number
          start_date?: string
          status?: string
          store_id?: string
          store_name_en?: string
          store_name_zh?: string
          updated_at?: string
        }
        Update: {
          budget?: number
          contractor?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          manager_en?: string
          manager_zh?: string
          notes?: string | null
          phase_en?: string
          phase_zh?: string
          progress?: number
          spent?: number
          start_date?: string
          status?: string
          store_id?: string
          store_name_en?: string
          store_name_zh?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_contracts: {
        Row: {
          contract_number: string
          created_at: string
          created_by: string | null
          currency: string | null
          end_date: string | null
          extracted_bank_account: string | null
          extracted_bank_account_name: string | null
          extracted_bank_name: string | null
          extracted_invoice_info: Json | null
          extracted_tax_id: string | null
          file_type: string | null
          file_url: string | null
          id: string
          notes: string | null
          ocr_extracted_data: Json | null
          ocr_status: string | null
          payment_terms: string | null
          start_date: string | null
          status: string
          supplier_id: string
          title: string
          updated_at: string
        }
        Insert: {
          contract_number?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          end_date?: string | null
          extracted_bank_account?: string | null
          extracted_bank_account_name?: string | null
          extracted_bank_name?: string | null
          extracted_invoice_info?: Json | null
          extracted_tax_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          ocr_extracted_data?: Json | null
          ocr_status?: string | null
          payment_terms?: string | null
          start_date?: string | null
          status?: string
          supplier_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          contract_number?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          end_date?: string | null
          extracted_bank_account?: string | null
          extracted_bank_account_name?: string | null
          extracted_bank_name?: string | null
          extracted_invoice_info?: Json | null
          extracted_tax_id?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          ocr_extracted_data?: Json | null
          ocr_status?: string | null
          payment_terms?: string | null
          start_date?: string | null
          status?: string
          supplier_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_account_name: string | null
          bank_branch: string | null
          bank_name: string | null
          blacklist_reason: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          invoice_address: string | null
          invoice_bank_account: string | null
          invoice_bank_name: string | null
          invoice_phone: string | null
          invoice_type: string | null
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          short_name: string | null
          status: string
          tags: string[] | null
          tax_id: string | null
          updated_at: string
          wechat_openid: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_account_name?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          blacklist_reason?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          invoice_address?: string | null
          invoice_bank_account?: string | null
          invoice_bank_name?: string | null
          invoice_phone?: string | null
          invoice_type?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          short_name?: string | null
          status?: string
          tags?: string[] | null
          tax_id?: string | null
          updated_at?: string
          wechat_openid?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_account_name?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          blacklist_reason?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          invoice_address?: string | null
          invoice_bank_account?: string | null
          invoice_bank_name?: string | null
          invoice_phone?: string | null
          invoice_type?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          short_name?: string | null
          status?: string
          tags?: string[] | null
          tax_id?: string | null
          updated_at?: string
          wechat_openid?: string | null
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
      deduct_inventory_for_menu_item: {
        Args: {
          p_menu_item_id: string
          p_order_id?: string
          p_quantity?: number
          p_reason?: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      manual_deduct_inventory: {
        Args: {
          p_inventory_item_id: string
          p_quantity: number
          p_reason?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
