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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      donor_eyes: {
        Row: {
          assigned_date: string | null
          assigned_to_patient_id: string | null
          created_at: string
          donor_id: string
          eye_number: string
          eye_side: Database["public"]["Enums"]["eye_type"]
          id: string
          is_assigned: boolean | null
        }
        Insert: {
          assigned_date?: string | null
          assigned_to_patient_id?: string | null
          created_at?: string
          donor_id: string
          eye_number: string
          eye_side: Database["public"]["Enums"]["eye_type"]
          id?: string
          is_assigned?: boolean | null
        }
        Update: {
          assigned_date?: string | null
          assigned_to_patient_id?: string | null
          created_at?: string
          donor_id?: string
          eye_number?: string
          eye_side?: Database["public"]["Enums"]["eye_type"]
          id?: string
          is_assigned?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_eyes_assigned_to_patient_id_fkey"
            columns: ["assigned_to_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_eyes_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          address: string | null
          age: number
          cause_of_death: string | null
          created_at: string
          created_by: string | null
          death_to_retrieval_hours: number | null
          death_to_retrieval_minutes: number | null
          donor_name: string
          eye_number_left: string
          eye_number_right: string
          id: string
          retrieval_date: string
          serial_number: number
          sex: Database["public"]["Enums"]["sex_type"]
          source_of_awareness: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          age: number
          cause_of_death?: string | null
          created_at?: string
          created_by?: string | null
          death_to_retrieval_hours?: number | null
          death_to_retrieval_minutes?: number | null
          donor_name: string
          eye_number_left: string
          eye_number_right: string
          id?: string
          retrieval_date?: string
          serial_number?: number
          sex: Database["public"]["Enums"]["sex_type"]
          source_of_awareness?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          age?: number
          cause_of_death?: string | null
          created_at?: string
          created_by?: string | null
          death_to_retrieval_hours?: number | null
          death_to_retrieval_minutes?: number | null
          donor_name?: string
          eye_number_left?: string
          eye_number_right?: string
          id?: string
          retrieval_date?: string
          serial_number?: number
          sex?: Database["public"]["Enums"]["sex_type"]
          source_of_awareness?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eye_bank_settings: {
        Row: {
          bank_name: string | null
          bank_start_date: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          bank_name?: string | null
          bank_start_date?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          bank_name?: string | null
          bank_start_date?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          age: number
          contact_numbers: string[] | null
          created_at: string
          created_by: string | null
          date_of_registration: string
          diagnosis: string | null
          diagnosis_eye: Database["public"]["Enums"]["eye_type"] | null
          diagnosis_eye_left: Database["public"]["Enums"]["eye_type"] | null
          diagnosis_left: string | null
          donor_eye_id: string | null
          eb_number: string | null
          id: string
          iol_option: Database["public"]["Enums"]["iol_option"] | null
          is_operated: boolean | null
          operation_date: string | null
          patient_name: string
          remarks: string | null
          sex: Database["public"]["Enums"]["sex_type"]
          surgeon_name: string | null
          surgery_custom: string | null
          surgery_eye: Database["public"]["Enums"]["eye_type"] | null
          surgery_type: Database["public"]["Enums"]["surgery_type"] | null
          updated_at: string
          wl_number: number
        }
        Insert: {
          address?: string | null
          age: number
          contact_numbers?: string[] | null
          created_at?: string
          created_by?: string | null
          date_of_registration?: string
          diagnosis?: string | null
          diagnosis_eye?: Database["public"]["Enums"]["eye_type"] | null
          diagnosis_eye_left?: Database["public"]["Enums"]["eye_type"] | null
          diagnosis_left?: string | null
          donor_eye_id?: string | null
          eb_number?: string | null
          id?: string
          iol_option?: Database["public"]["Enums"]["iol_option"] | null
          is_operated?: boolean | null
          operation_date?: string | null
          patient_name: string
          remarks?: string | null
          sex: Database["public"]["Enums"]["sex_type"]
          surgeon_name?: string | null
          surgery_custom?: string | null
          surgery_eye?: Database["public"]["Enums"]["eye_type"] | null
          surgery_type?: Database["public"]["Enums"]["surgery_type"] | null
          updated_at?: string
          wl_number?: number
        }
        Update: {
          address?: string | null
          age?: number
          contact_numbers?: string[] | null
          created_at?: string
          created_by?: string | null
          date_of_registration?: string
          diagnosis?: string | null
          diagnosis_eye?: Database["public"]["Enums"]["eye_type"] | null
          diagnosis_eye_left?: Database["public"]["Enums"]["eye_type"] | null
          diagnosis_left?: string | null
          donor_eye_id?: string | null
          eb_number?: string | null
          id?: string
          iol_option?: Database["public"]["Enums"]["iol_option"] | null
          is_operated?: boolean | null
          operation_date?: string | null
          patient_name?: string
          remarks?: string | null
          sex?: Database["public"]["Enums"]["sex_type"]
          surgeon_name?: string | null
          surgery_custom?: string | null
          surgery_eye?: Database["public"]["Enums"]["eye_type"] | null
          surgery_type?: Database["public"]["Enums"]["surgery_type"] | null
          updated_at?: string
          wl_number?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
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
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "surgeon" | "data_entry" | "viewer"
      eye_type: "RE" | "LE"
      iol_option: "with IOL" | "without IOL" | "±IOL"
      sex_type: "Male" | "Female" | "Other"
      surgery_type:
        | "PK"
        | "Tectonic PK"
        | "TPK"
        | "DSAEK"
        | "DALK"
        | "DMEK"
        | "Others"
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
      app_role: ["admin", "surgeon", "data_entry", "viewer"],
      eye_type: ["RE", "LE"],
      iol_option: ["with IOL", "without IOL", "±IOL"],
      sex_type: ["Male", "Female", "Other"],
      surgery_type: [
        "PK",
        "Tectonic PK",
        "TPK",
        "DSAEK",
        "DALK",
        "DMEK",
        "Others",
      ],
    },
  },
} as const
