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
      consignatie_aanmeldingen: {
        Row: {
          apk_geldig: boolean | null
          bouwjaar: string
          brandstof: string | null
          created_at: string
          eerste_eigenaar: boolean | null
          email: string
          financiering: boolean | null
          foto_urls: string[] | null
          id: string
          kenteken: string | null
          kleur: string | null
          km_stand: string
          merk: string
          model: string
          naam: string
          onderhoudsboekje: boolean | null
          opmerkingen: string | null
          recente_reparaties: boolean | null
          rookvrij: boolean | null
          schadevrij: boolean | null
          staat: string | null
          telefoon: string
          transmissie: string | null
        }
        Insert: {
          apk_geldig?: boolean | null
          bouwjaar: string
          brandstof?: string | null
          created_at?: string
          eerste_eigenaar?: boolean | null
          email: string
          financiering?: boolean | null
          foto_urls?: string[] | null
          id?: string
          kenteken?: string | null
          kleur?: string | null
          km_stand: string
          merk: string
          model: string
          naam: string
          onderhoudsboekje?: boolean | null
          opmerkingen?: string | null
          recente_reparaties?: boolean | null
          rookvrij?: boolean | null
          schadevrij?: boolean | null
          staat?: string | null
          telefoon: string
          transmissie?: string | null
        }
        Update: {
          apk_geldig?: boolean | null
          bouwjaar?: string
          brandstof?: string | null
          created_at?: string
          eerste_eigenaar?: boolean | null
          email?: string
          financiering?: boolean | null
          foto_urls?: string[] | null
          id?: string
          kenteken?: string | null
          kleur?: string | null
          km_stand?: string
          merk?: string
          model?: string
          naam?: string
          onderhoudsboekje?: boolean | null
          opmerkingen?: string | null
          recente_reparaties?: boolean | null
          rookvrij?: boolean | null
          schadevrij?: boolean | null
          staat?: string | null
          telefoon?: string
          transmissie?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          aantal_eigenaren: string | null
          aantal_vergelijkbaar: number | null
          ai_advies: string | null
          apk_status: string | null
          bouwjaar: string | null
          brandstof: string | null
          carrosserie: string | null
          created_at: string
          deal_score: number | null
          eerdere_advertenties: Json | null
          gemiddelde_marktprijs: number | null
          geschatte_standtijd: string | null
          geschatte_verkoopprijs: number | null
          hoogste_marktprijs: number | null
          id: string
          inkoopprijs_klant: number | null
          kenteken: string
          kleur: string | null
          km_stand: string | null
          laagste_marktprijs: number | null
          markt_analyse_tekst: string | null
          markt_bronnen: Json | null
          markt_listings: Json | null
          merk: string | null
          model: string | null
          opties_populariteit: Json | null
          schade_historie: Json | null
          score_factoren: Json | null
          transmissie: string | null
          vermogen: string | null
          vin: string | null
          voertuig_opties: Json | null
          vwe_handelsprijs: number | null
          vwe_inkoopwaarde: number | null
          vwe_nieuwprijs: number | null
          vwe_verkoopwaarde: number | null
        }
        Insert: {
          aantal_eigenaren?: string | null
          aantal_vergelijkbaar?: number | null
          ai_advies?: string | null
          apk_status?: string | null
          bouwjaar?: string | null
          brandstof?: string | null
          carrosserie?: string | null
          created_at?: string
          deal_score?: number | null
          eerdere_advertenties?: Json | null
          gemiddelde_marktprijs?: number | null
          geschatte_standtijd?: string | null
          geschatte_verkoopprijs?: number | null
          hoogste_marktprijs?: number | null
          id?: string
          inkoopprijs_klant?: number | null
          kenteken: string
          kleur?: string | null
          km_stand?: string | null
          laagste_marktprijs?: number | null
          markt_analyse_tekst?: string | null
          markt_bronnen?: Json | null
          markt_listings?: Json | null
          merk?: string | null
          model?: string | null
          opties_populariteit?: Json | null
          schade_historie?: Json | null
          score_factoren?: Json | null
          transmissie?: string | null
          vermogen?: string | null
          vin?: string | null
          voertuig_opties?: Json | null
          vwe_handelsprijs?: number | null
          vwe_inkoopwaarde?: number | null
          vwe_nieuwprijs?: number | null
          vwe_verkoopwaarde?: number | null
        }
        Update: {
          aantal_eigenaren?: string | null
          aantal_vergelijkbaar?: number | null
          ai_advies?: string | null
          apk_status?: string | null
          bouwjaar?: string | null
          brandstof?: string | null
          carrosserie?: string | null
          created_at?: string
          deal_score?: number | null
          eerdere_advertenties?: Json | null
          gemiddelde_marktprijs?: number | null
          geschatte_standtijd?: string | null
          geschatte_verkoopprijs?: number | null
          hoogste_marktprijs?: number | null
          id?: string
          inkoopprijs_klant?: number | null
          kenteken?: string
          kleur?: string | null
          km_stand?: string | null
          laagste_marktprijs?: number | null
          markt_analyse_tekst?: string | null
          markt_bronnen?: Json | null
          markt_listings?: Json | null
          merk?: string | null
          model?: string | null
          opties_populariteit?: Json | null
          schade_historie?: Json | null
          score_factoren?: Json | null
          transmissie?: string | null
          vermogen?: string | null
          vin?: string | null
          voertuig_opties?: Json | null
          vwe_handelsprijs?: number | null
          vwe_inkoopwaarde?: number | null
          vwe_nieuwprijs?: number | null
          vwe_verkoopwaarde?: number | null
        }
        Relationships: []
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
