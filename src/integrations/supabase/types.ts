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
      automation_results: {
        Row: {
          afbeelding_url: string | null
          ai_analyse: Json | null
          ai_analyzed: boolean | null
          bouwjaar: number | null
          bpm_bedrag: number | null
          brandstof: string | null
          contact_email: string | null
          contact_naam: string | null
          contact_status: string | null
          contact_telefoon: string | null
          created_at: string
          deal_score: number | null
          externe_id: string | null
          externe_url: string | null
          geschatte_inkoopprijs: number | null
          geschatte_marktwaarde: number | null
          geschatte_winstmarge: number | null
          id: string
          is_import: boolean | null
          kenteken: string | null
          kilometerstand: number | null
          kleur: string | null
          laatste_contact: string | null
          merk: string
          model: string
          opmerkingen: string | null
          platform: string
          rdw_checked: boolean | null
          rdw_data: Json | null
          search_id: string | null
          status: string | null
          transmissie: string | null
          vraagprijs: number | null
        }
        Insert: {
          afbeelding_url?: string | null
          ai_analyse?: Json | null
          ai_analyzed?: boolean | null
          bouwjaar?: number | null
          bpm_bedrag?: number | null
          brandstof?: string | null
          contact_email?: string | null
          contact_naam?: string | null
          contact_status?: string | null
          contact_telefoon?: string | null
          created_at?: string
          deal_score?: number | null
          externe_id?: string | null
          externe_url?: string | null
          geschatte_inkoopprijs?: number | null
          geschatte_marktwaarde?: number | null
          geschatte_winstmarge?: number | null
          id?: string
          is_import?: boolean | null
          kenteken?: string | null
          kilometerstand?: number | null
          kleur?: string | null
          laatste_contact?: string | null
          merk: string
          model: string
          opmerkingen?: string | null
          platform?: string
          rdw_checked?: boolean | null
          rdw_data?: Json | null
          search_id?: string | null
          status?: string | null
          transmissie?: string | null
          vraagprijs?: number | null
        }
        Update: {
          afbeelding_url?: string | null
          ai_analyse?: Json | null
          ai_analyzed?: boolean | null
          bouwjaar?: number | null
          bpm_bedrag?: number | null
          brandstof?: string | null
          contact_email?: string | null
          contact_naam?: string | null
          contact_status?: string | null
          contact_telefoon?: string | null
          created_at?: string
          deal_score?: number | null
          externe_id?: string | null
          externe_url?: string | null
          geschatte_inkoopprijs?: number | null
          geschatte_marktwaarde?: number | null
          geschatte_winstmarge?: number | null
          id?: string
          is_import?: boolean | null
          kenteken?: string | null
          kilometerstand?: number | null
          kleur?: string | null
          laatste_contact?: string | null
          merk?: string
          model?: string
          opmerkingen?: string | null
          platform?: string
          rdw_checked?: boolean | null
          rdw_data?: Json | null
          search_id?: string | null
          status?: string | null
          transmissie?: string | null
          vraagprijs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_results_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "automation_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_searches: {
        Row: {
          actief: boolean | null
          bouwjaar_tot: number | null
          bouwjaar_van: number | null
          brandstof: string[] | null
          created_at: string
          id: string
          interval_uren: number | null
          kleuren: string[] | null
          km_max: number | null
          laatst_gedraaid: string | null
          landen: string[] | null
          merken: string[] | null
          modellen: string[] | null
          naam: string
          platforms: string[] | null
          prijs_max: number | null
          schade_acceptabel: boolean | null
          transmissie: string[] | null
          user_id: string | null
        }
        Insert: {
          actief?: boolean | null
          bouwjaar_tot?: number | null
          bouwjaar_van?: number | null
          brandstof?: string[] | null
          created_at?: string
          id?: string
          interval_uren?: number | null
          kleuren?: string[] | null
          km_max?: number | null
          laatst_gedraaid?: string | null
          landen?: string[] | null
          merken?: string[] | null
          modellen?: string[] | null
          naam: string
          platforms?: string[] | null
          prijs_max?: number | null
          schade_acceptabel?: boolean | null
          transmissie?: string[] | null
          user_id?: string | null
        }
        Update: {
          actief?: boolean | null
          bouwjaar_tot?: number | null
          bouwjaar_van?: number | null
          brandstof?: string[] | null
          created_at?: string
          id?: string
          interval_uren?: number | null
          kleuren?: string[] | null
          km_max?: number | null
          laatst_gedraaid?: string | null
          landen?: string[] | null
          merken?: string[] | null
          modellen?: string[] | null
          naam?: string
          platforms?: string[] | null
          prijs_max?: number | null
          schade_acceptabel?: boolean | null
          transmissie?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_templates: {
        Row: {
          created_at: string
          id: string
          inhoud: string
          is_default: boolean | null
          naam: string
          onderwerp: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inhoud?: string
          is_default?: boolean | null
          naam: string
          onderwerp?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inhoud?: string
          is_default?: boolean | null
          naam?: string
          onderwerp?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      inkoop_candidates: {
        Row: {
          bouwjaar: number
          brandstof: string | null
          bron: string
          bron_link: string | null
          created_at: string
          datum_toegevoegd: string | null
          geschatte_inkoopprijs: number | null
          geschatte_kosten: number | null
          geschatte_verkoopprijs: number | null
          id: string
          interesse_status: string | null
          kenteken: string | null
          kilometerstand: number | null
          kleur: string | null
          merk: string
          model: string
          opmerkingen: string | null
          transmissie: string | null
          user_id: string | null
          vraagprijs: number | null
        }
        Insert: {
          bouwjaar?: number
          brandstof?: string | null
          bron?: string
          bron_link?: string | null
          created_at?: string
          datum_toegevoegd?: string | null
          geschatte_inkoopprijs?: number | null
          geschatte_kosten?: number | null
          geschatte_verkoopprijs?: number | null
          id?: string
          interesse_status?: string | null
          kenteken?: string | null
          kilometerstand?: number | null
          kleur?: string | null
          merk: string
          model: string
          opmerkingen?: string | null
          transmissie?: string | null
          user_id?: string | null
          vraagprijs?: number | null
        }
        Update: {
          bouwjaar?: number
          brandstof?: string | null
          bron?: string
          bron_link?: string | null
          created_at?: string
          datum_toegevoegd?: string | null
          geschatte_inkoopprijs?: number | null
          geschatte_kosten?: number | null
          geschatte_verkoopprijs?: number | null
          id?: string
          interesse_status?: string | null
          kenteken?: string | null
          kilometerstand?: number | null
          kleur?: string | null
          merk?: string
          model?: string
          opmerkingen?: string | null
          transmissie?: string | null
          user_id?: string | null
          vraagprijs?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_costs: {
        Row: {
          amount: number
          btw_percentage: number | null
          category: string | null
          created_at: string
          date: string | null
          description: string
          id: string
          invoice_ref: string | null
          vehicle_id: string
        }
        Insert: {
          amount: number
          btw_percentage?: number | null
          category?: string | null
          created_at?: string
          date?: string | null
          description: string
          id?: string
          invoice_ref?: string | null
          vehicle_id: string
        }
        Update: {
          amount?: number
          btw_percentage?: number | null
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string
          id?: string
          invoice_ref?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_costs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_documents: {
        Row: {
          created_at: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          naam: string
          type: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          naam: string
          type?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          naam?: string
          type?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_photos: {
        Row: {
          created_at: string
          file_path: string
          id: string
          is_hoofdfoto: boolean | null
          vehicle_id: string
          volgorde: number | null
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          is_hoofdfoto?: boolean | null
          vehicle_id: string
          volgorde?: number | null
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          is_hoofdfoto?: boolean | null
          vehicle_id?: string
          volgorde?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_photos_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          bouwjaar: number | null
          brandstof: string | null
          created_at: string
          id: string
          inkoop_datum: string | null
          inkoopprijs: number | null
          kenteken: string | null
          kilometerstand: number | null
          kleur: string | null
          koper_email: string | null
          koper_naam: string | null
          koper_telefoon: string | null
          merk: string
          model: string
          opmerkingen: string | null
          status: string | null
          user_id: string | null
          verkoop_datum: string | null
          verkoopprijs: number | null
        }
        Insert: {
          bouwjaar?: number | null
          brandstof?: string | null
          created_at?: string
          id?: string
          inkoop_datum?: string | null
          inkoopprijs?: number | null
          kenteken?: string | null
          kilometerstand?: number | null
          kleur?: string | null
          koper_email?: string | null
          koper_naam?: string | null
          koper_telefoon?: string | null
          merk: string
          model: string
          opmerkingen?: string | null
          status?: string | null
          user_id?: string | null
          verkoop_datum?: string | null
          verkoopprijs?: number | null
        }
        Update: {
          bouwjaar?: number | null
          brandstof?: string | null
          created_at?: string
          id?: string
          inkoop_datum?: string | null
          inkoopprijs?: number | null
          kenteken?: string | null
          kilometerstand?: number | null
          kleur?: string | null
          koper_email?: string | null
          koper_naam?: string | null
          koper_telefoon?: string | null
          merk?: string
          model?: string
          opmerkingen?: string | null
          status?: string | null
          user_id?: string | null
          verkoop_datum?: string | null
          verkoopprijs?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "medewerker"
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
      app_role: ["admin", "medewerker"],
    },
  },
} as const
