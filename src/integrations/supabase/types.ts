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
      feriado: {
        Row: {
          ano: number | null
          created_at: string
          data: string
          descricao: string | null
          ibge_code: string | null
          id: string
          nome: string | null
          tipo: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          ano?: number | null
          created_at?: string
          data: string
          descricao?: string | null
          ibge_code?: string | null
          id?: string
          nome?: string | null
          tipo: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number | null
          created_at?: string
          data?: string
          descricao?: string | null
          ibge_code?: string | null
          id?: string
          nome?: string | null
          tipo?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      import_run: {
        Row: {
          created_at: string
          ibge_code: string | null
          id: string
          metrics: Json | null
          payload: Json | null
          scope: string
          status: string
          uf: string | null
          updated_at: string
          user_id: string | null
          years: number[]
        }
        Insert: {
          created_at?: string
          ibge_code?: string | null
          id?: string
          metrics?: Json | null
          payload?: Json | null
          scope: string
          status?: string
          uf?: string | null
          updated_at?: string
          user_id?: string | null
          years: number[]
        }
        Update: {
          created_at?: string
          ibge_code?: string | null
          id?: string
          metrics?: Json | null
          payload?: Json | null
          scope?: string
          status?: string
          uf?: string | null
          updated_at?: string
          user_id?: string | null
          years?: number[]
        }
        Relationships: []
      }
      municipio: {
        Row: {
          created_at: string
          ibge_code: string
          mesorregiao: string | null
          microrregiao: string | null
          nome: string
          nome_uf: string | null
          uf: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ibge_code: string
          mesorregiao?: string | null
          microrregiao?: string | null
          nome: string
          nome_uf?: string | null
          uf: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ibge_code?: string
          mesorregiao?: string | null
          microrregiao?: string | null
          nome?: string
          nome_uf?: string | null
          uf?: string
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
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
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
      search_alunos: {
        Args: { term: string }
        Returns: {
          ra: string
          cpf: string
          nome: string
          dtinicio: string
          dtfim: string
          cidade: string
          resfinanceiro: string
          curso: string
          codturma: string
          disciplina: string
          ch: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "operador" | "consulta"
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
      app_role: ["admin", "operador", "consulta"],
    },
  },
} as const
