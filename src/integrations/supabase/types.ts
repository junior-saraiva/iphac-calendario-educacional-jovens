export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alunos_raw_import_json: {
        Row: {
          id: string
          imported_at: string
          payload: Json
        }
        Insert: {
          id?: string
          imported_at?: string
          payload: Json
        }
        Update: {
          id?: string
          imported_at?: string
          payload?: Json
        }
        Relationships: []
      }
      alunos_view_cache: {
        Row: {
          ch: number | null
          cidade: string | null
          codturma: string | null
          cpf: string | null
          created_at: string
          curso: string | null
          disciplina: string | null
          dtfim: string | null
          dtinicio: string | null
          id: string
          nome: string
          ra: string
          resfinanceiro: string | null
          updated_at: string
        }
        Insert: {
          ch?: number | null
          cidade?: string | null
          codturma?: string | null
          cpf?: string | null
          created_at?: string
          curso?: string | null
          disciplina?: string | null
          dtfim?: string | null
          dtinicio?: string | null
          id?: string
          nome: string
          ra: string
          resfinanceiro?: string | null
          updated_at?: string
        }
        Update: {
          ch?: number | null
          cidade?: string | null
          codturma?: string | null
          cpf?: string | null
          created_at?: string
          curso?: string | null
          disciplina?: string | null
          dtfim?: string | null
          dtinicio?: string | null
          id?: string
          nome?: string
          ra?: string
          resfinanceiro?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      VW_DADOS_ALUNOS_DISCIPLINAS_ATIVOS: {
        Row: {
          CH: number | null
          CIDADE: string | null
          CODTURMA: string | null
          CPF: string | null
          CURSO: string | null
          DISCIPLINA: string | null
          DTFIM: string | null
          DTINICIO: string | null
          NOME: string | null
          RA: string | null
          RESFINCEIRO: string | null
        }
        Insert: {
          CH?: number | null
          CIDADE?: string | null
          CODTURMA?: string | null
          CPF?: string | null
          CURSO?: string | null
          DISCIPLINA?: string | null
          DTFIM?: string | null
          DTINICIO?: string | null
          NOME?: string | null
          RA?: string | null
          RESFINCEIRO?: string | null
        }
        Update: {
          CH?: number | null
          CIDADE?: string | null
          CODTURMA?: string | null
          CPF?: string | null
          CURSO?: string | null
          DISCIPLINA?: string | null
          DTFIM?: string | null
          DTINICIO?: string | null
          NOME?: string | null
          RA?: string | null
          RESFINCEIRO?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      parse_date_safe: {
        Args: { _s: string }
        Returns: string
      }
      parse_int_safe: {
        Args: { _s: string }
        Returns: number
      }
      refresh_alunos_cache_from_raw_json: {
        Args: { full_refresh?: boolean }
        Returns: number
      }
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
