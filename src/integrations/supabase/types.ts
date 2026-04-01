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
      aanbetalingen: {
        Row: {
          aanbetalingsbedrag: number
          created_at: string
          datum: string
          id: string
          klant_achternaam: string
          klant_adres: string
          klant_email: string
          klant_postcode: string
          klant_telefoon: string
          klant_voornaam: string
          klant_woonplaats: string
          pdf_path: string | null
          plaats: string
          restbedrag: number
          uiterlijke_datum: string | null
          user_id: string | null
          vehicle_id: string
          verkoopprijs: number
          voertuig_bouwjaar: number | null
          voertuig_kenteken: string | null
          voertuig_kilometerstand: number | null
          voertuig_merk: string
          voertuig_model: string
          voertuig_vin: string | null
        }
        Insert: {
          aanbetalingsbedrag?: number
          created_at?: string
          datum?: string
          id?: string
          klant_achternaam: string
          klant_adres: string
          klant_email: string
          klant_postcode: string
          klant_telefoon: string
          klant_voornaam: string
          klant_woonplaats: string
          pdf_path?: string | null
          plaats?: string
          restbedrag?: number
          uiterlijke_datum?: string | null
          user_id?: string | null
          vehicle_id: string
          verkoopprijs?: number
          voertuig_bouwjaar?: number | null
          voertuig_kenteken?: string | null
          voertuig_kilometerstand?: number | null
          voertuig_merk: string
          voertuig_model: string
          voertuig_vin?: string | null
        }
        Update: {
          aanbetalingsbedrag?: number
          created_at?: string
          datum?: string
          id?: string
          klant_achternaam?: string
          klant_adres?: string
          klant_email?: string
          klant_postcode?: string
          klant_telefoon?: string
          klant_voornaam?: string
          klant_woonplaats?: string
          pdf_path?: string | null
          plaats?: string
          restbedrag?: number
          uiterlijke_datum?: string | null
          user_id?: string | null
          vehicle_id?: string
          verkoopprijs?: number
          voertuig_bouwjaar?: number | null
          voertuig_kenteken?: string | null
          voertuig_kilometerstand?: number | null
          voertuig_merk?: string
          voertuig_model?: string
          voertuig_vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aanbetalingen_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
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
      blog_posts: {
        Row: {
          car_id: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          focus_keyword: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published: boolean
          slug: string
          title: string
        }
        Insert: {
          car_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          focus_keyword?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          slug: string
          title: string
        }
        Update: {
          car_id?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          focus_keyword?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published?: boolean
          slug?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      consignatie_overeenkomsten: {
        Row: {
          aangepast_commissie_percentage: number | null
          advertentiekosten: number | null
          commissie_percentage: number
          created_at: string
          datum: string
          eigenaar_achternaam: string
          eigenaar_adres: string
          eigenaar_email: string
          eigenaar_iban: string
          eigenaar_postcode: string
          eigenaar_telefoon: string
          eigenaar_voornaam: string
          eigenaar_woonplaats: string
          garantie: string
          id: string
          minimumprijs: number
          overige_kosten: number | null
          pdf_path: string | null
          plaats: string
          poetskosten: number | null
          user_id: string | null
          vehicle_id: string
          voertuig_apk_tot: string | null
          voertuig_bouwjaar: number | null
          voertuig_kenteken: string | null
          voertuig_kilometerstand: number | null
          voertuig_kleur: string | null
          voertuig_merk: string
          voertuig_model: string
          voertuig_vin: string | null
          vraagprijs: number
        }
        Insert: {
          aangepast_commissie_percentage?: number | null
          advertentiekosten?: number | null
          commissie_percentage?: number
          created_at?: string
          datum?: string
          eigenaar_achternaam: string
          eigenaar_adres: string
          eigenaar_email: string
          eigenaar_iban: string
          eigenaar_postcode: string
          eigenaar_telefoon: string
          eigenaar_voornaam: string
          eigenaar_woonplaats: string
          garantie?: string
          id?: string
          minimumprijs?: number
          overige_kosten?: number | null
          pdf_path?: string | null
          plaats?: string
          poetskosten?: number | null
          user_id?: string | null
          vehicle_id: string
          voertuig_apk_tot?: string | null
          voertuig_bouwjaar?: number | null
          voertuig_kenteken?: string | null
          voertuig_kilometerstand?: number | null
          voertuig_kleur?: string | null
          voertuig_merk: string
          voertuig_model: string
          voertuig_vin?: string | null
          vraagprijs?: number
        }
        Update: {
          aangepast_commissie_percentage?: number | null
          advertentiekosten?: number | null
          commissie_percentage?: number
          created_at?: string
          datum?: string
          eigenaar_achternaam?: string
          eigenaar_adres?: string
          eigenaar_email?: string
          eigenaar_iban?: string
          eigenaar_postcode?: string
          eigenaar_telefoon?: string
          eigenaar_voornaam?: string
          eigenaar_woonplaats?: string
          garantie?: string
          id?: string
          minimumprijs?: number
          overige_kosten?: number | null
          pdf_path?: string | null
          plaats?: string
          poetskosten?: number | null
          user_id?: string | null
          vehicle_id?: string
          voertuig_apk_tot?: string | null
          voertuig_bouwjaar?: number | null
          voertuig_kenteken?: string | null
          voertuig_kilometerstand?: number | null
          voertuig_kleur?: string | null
          voertuig_merk?: string
          voertuig_model?: string
          voertuig_vin?: string | null
          vraagprijs?: number
        }
        Relationships: [
          {
            foreignKeyName: "consignatie_overeenkomsten_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          achternaam: string
          adres: string | null
          created_at: string
          email: string
          geboortedatum: string | null
          id: string
          laatste_contact: string | null
          notities: string | null
          plaats: string | null
          postcode: string | null
          status: string
          telefoon: string
          updated_at: string
          voornaam: string
        }
        Insert: {
          achternaam: string
          adres?: string | null
          created_at?: string
          email: string
          geboortedatum?: string | null
          id?: string
          laatste_contact?: string | null
          notities?: string | null
          plaats?: string | null
          postcode?: string | null
          status?: string
          telefoon?: string
          updated_at?: string
          voornaam: string
        }
        Update: {
          achternaam?: string
          adres?: string | null
          created_at?: string
          email?: string
          geboortedatum?: string | null
          id?: string
          laatste_contact?: string | null
          notities?: string | null
          plaats?: string | null
          postcode?: string | null
          status?: string
          telefoon?: string
          updated_at?: string
          voornaam?: string
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
      document_archive: {
        Row: {
          consignatie_overeenkomst_id: string | null
          created_at: string
          document_type: string
          file_path: string | null
          id: string
          kenteken: string | null
          klant_naam: string | null
          metadata: Json | null
          storage_bucket: string | null
          test_drive_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          consignatie_overeenkomst_id?: string | null
          created_at?: string
          document_type: string
          file_path?: string | null
          id?: string
          kenteken?: string | null
          klant_naam?: string | null
          metadata?: Json | null
          storage_bucket?: string | null
          test_drive_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          consignatie_overeenkomst_id?: string | null
          created_at?: string
          document_type?: string
          file_path?: string | null
          id?: string
          kenteken?: string | null
          klant_naam?: string | null
          metadata?: Json | null
          storage_bucket?: string | null
          test_drive_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_archive_consignatie_overeenkomst_id_fkey"
            columns: ["consignatie_overeenkomst_id"]
            isOneToOne: false
            referencedRelation: "consignatie_overeenkomsten"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_archive_test_drive_id_fkey"
            columns: ["test_drive_id"]
            isOneToOne: false
            referencedRelation: "test_drives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_archive_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_checklist_items: {
        Row: {
          document_id: string | null
          id: string
          naam: string
          vehicle_id: string
          verplicht: boolean | null
          voltooid: boolean | null
          voltooid_op: string | null
        }
        Insert: {
          document_id?: string | null
          id?: string
          naam: string
          vehicle_id: string
          verplicht?: boolean | null
          voltooid?: boolean | null
          voltooid_op?: string | null
        }
        Update: {
          document_id?: string | null
          id?: string
          naam?: string
          vehicle_id?: string
          verplicht?: boolean | null
          voltooid?: boolean | null
          voltooid_op?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_checklist_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "vehicle_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_checklist_items_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
      lead_history: {
        Row: {
          beschrijving: string
          created_at: string
          id: string
          lead_id: string
          nieuwe_status: string | null
          oude_status: string | null
        }
        Insert: {
          beschrijving: string
          created_at?: string
          id?: string
          lead_id: string
          nieuwe_status?: string | null
          oude_status?: string | null
        }
        Update: {
          beschrijving?: string
          created_at?: string
          id?: string
          lead_id?: string
          nieuwe_status?: string | null
          oude_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          bron: string
          created_at: string
          customer_id: string
          id: string
          laatste_activiteit: string | null
          notities_log: Json
          status: string
          updated_at: string
          vehicle_id: string | null
          verloren_reden: string | null
          volgende_actie: string | null
          volgende_actie_datum: string | null
        }
        Insert: {
          bron?: string
          created_at?: string
          customer_id: string
          id?: string
          laatste_activiteit?: string | null
          notities_log?: Json
          status?: string
          updated_at?: string
          vehicle_id?: string | null
          verloren_reden?: string | null
          volgende_actie?: string | null
          volgende_actie_datum?: string | null
        }
        Update: {
          bron?: string
          created_at?: string
          customer_id?: string
          id?: string
          laatste_activiteit?: string | null
          notities_log?: Json
          status?: string
          updated_at?: string
          vehicle_id?: string | null
          verloren_reden?: string | null
          volgende_actie?: string | null
          volgende_actie_datum?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      make_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
        }
        Relationships: []
      }
      proefrit_pdf_logs: {
        Row: {
          actie: string
          created_at: string
          id: string
          test_drive_id: string
          user_id: string
        }
        Insert: {
          actie?: string
          created_at?: string
          id?: string
          test_drive_id: string
          user_id: string
        }
        Update: {
          actie?: string
          created_at?: string
          id?: string
          test_drive_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proefrit_pdf_logs_test_drive_id_fkey"
            columns: ["test_drive_id"]
            isOneToOne: false
            referencedRelation: "test_drives"
            referencedColumns: ["id"]
          },
        ]
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      test_drive_customers: {
        Row: {
          achternaam: string
          adres: string | null
          created_at: string
          email: string
          geboortedatum: string | null
          id: string
          plaats: string | null
          postcode: string | null
          rijbewijs_foto_path: string | null
          rijbewijscategorie: string | null
          rijbewijsnummer: string | null
          telefoon: string
          voornaam: string
        }
        Insert: {
          achternaam: string
          adres?: string | null
          created_at?: string
          email: string
          geboortedatum?: string | null
          id?: string
          plaats?: string | null
          postcode?: string | null
          rijbewijs_foto_path?: string | null
          rijbewijscategorie?: string | null
          rijbewijsnummer?: string | null
          telefoon: string
          voornaam: string
        }
        Update: {
          achternaam?: string
          adres?: string | null
          created_at?: string
          email?: string
          geboortedatum?: string | null
          id?: string
          plaats?: string | null
          postcode?: string | null
          rijbewijs_foto_path?: string | null
          rijbewijscategorie?: string | null
          rijbewijsnummer?: string | null
          telefoon?: string
          voornaam?: string
        }
        Relationships: []
      }
      test_drives: {
        Row: {
          begeleidende_medewerker: string | null
          created_at: string
          customer_id: string | null
          document_nummer: string | null
          eind_tijd: string | null
          email_verzonden_op: string | null
          formulier_ingevuld_op: string | null
          handtekening_data: string | null
          id: string
          ip_adres: string | null
          km_na: number | null
          km_voor: number
          opmerkingen_na: string | null
          opmerkingen_voor: string | null
          pdf_definitief_path: string | null
          pdf_path: string | null
          schade_fotos: string[] | null
          start_tijd: string
          status: string
          token: string
          vehicle_id: string | null
          voertuig_bouwjaar: number | null
          voertuig_kenteken: string | null
          voertuig_merk: string | null
          voertuig_model: string | null
        }
        Insert: {
          begeleidende_medewerker?: string | null
          created_at?: string
          customer_id?: string | null
          document_nummer?: string | null
          eind_tijd?: string | null
          email_verzonden_op?: string | null
          formulier_ingevuld_op?: string | null
          handtekening_data?: string | null
          id?: string
          ip_adres?: string | null
          km_na?: number | null
          km_voor: number
          opmerkingen_na?: string | null
          opmerkingen_voor?: string | null
          pdf_definitief_path?: string | null
          pdf_path?: string | null
          schade_fotos?: string[] | null
          start_tijd?: string
          status?: string
          token: string
          vehicle_id?: string | null
          voertuig_bouwjaar?: number | null
          voertuig_kenteken?: string | null
          voertuig_merk?: string | null
          voertuig_model?: string | null
        }
        Update: {
          begeleidende_medewerker?: string | null
          created_at?: string
          customer_id?: string | null
          document_nummer?: string | null
          eind_tijd?: string | null
          email_verzonden_op?: string | null
          formulier_ingevuld_op?: string | null
          handtekening_data?: string | null
          id?: string
          ip_adres?: string | null
          km_na?: number | null
          km_voor?: number
          opmerkingen_na?: string | null
          opmerkingen_voor?: string | null
          pdf_definitief_path?: string | null
          pdf_path?: string | null
          schade_fotos?: string[] | null
          start_tijd?: string
          status?: string
          token?: string
          vehicle_id?: string | null
          voertuig_bouwjaar?: number | null
          voertuig_kenteken?: string | null
          voertuig_merk?: string | null
          voertuig_model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_drives_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "test_drive_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_drives_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      vehicle_activity_log: {
        Row: {
          actie_type: string
          beschrijving: string
          created_at: string
          id: string
          metadata: Json | null
          vehicle_id: string
        }
        Insert: {
          actie_type: string
          beschrijving: string
          created_at?: string
          id?: string
          metadata?: Json | null
          vehicle_id: string
        }
        Update: {
          actie_type?: string
          beschrijving?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_activity_log_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_costs: {
        Row: {
          amount: number
          btw_percentage: number | null
          category: string | null
          created_at: string
          date: string | null
          description: string
          file_name: string | null
          file_path: string | null
          id: string
          invoice_ref: string | null
          leverancier: string | null
          moneybird_id: string | null
          moneybird_synced_at: string | null
          vehicle_id: string
        }
        Insert: {
          amount: number
          btw_percentage?: number | null
          category?: string | null
          created_at?: string
          date?: string | null
          description: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          invoice_ref?: string | null
          leverancier?: string | null
          moneybird_id?: string | null
          moneybird_synced_at?: string | null
          vehicle_id: string
        }
        Update: {
          amount?: number
          btw_percentage?: number | null
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          invoice_ref?: string | null
          leverancier?: string | null
          moneybird_id?: string | null
          moneybird_synced_at?: string | null
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
          google_drive_file_id: string | null
          google_drive_url: string | null
          id: string
          mime_type: string | null
          naam: string
          synced_from_drive: boolean | null
          type: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          file_size?: number | null
          google_drive_file_id?: string | null
          google_drive_url?: string | null
          id?: string
          mime_type?: string | null
          naam: string
          synced_from_drive?: boolean | null
          type?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          file_size?: number | null
          google_drive_file_id?: string | null
          google_drive_url?: string | null
          id?: string
          mime_type?: string | null
          naam?: string
          synced_from_drive?: boolean | null
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
          google_drive_file_id: string | null
          google_drive_url: string | null
          id: string
          is_hoofdfoto: boolean | null
          vehicle_id: string
          volgorde: number | null
        }
        Insert: {
          created_at?: string
          file_path: string
          google_drive_file_id?: string | null
          google_drive_url?: string | null
          id?: string
          is_hoofdfoto?: boolean | null
          vehicle_id: string
          volgorde?: number | null
        }
        Update: {
          created_at?: string
          file_path?: string
          google_drive_file_id?: string | null
          google_drive_url?: string | null
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
      vehicle_tasks: {
        Row: {
          created_at: string
          deadline: string | null
          id: string
          omschrijving: string
          prioriteit: string
          vehicle_id: string
          voltooid: boolean
          voltooid_op: string | null
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          id?: string
          omschrijving: string
          prioriteit?: string
          vehicle_id: string
          voltooid?: boolean
          voltooid_op?: string | null
        }
        Update: {
          created_at?: string
          deadline?: string | null
          id?: string
          omschrijving?: string
          prioriteit?: string
          vehicle_id?: string
          voltooid?: boolean
          voltooid_op?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_tasks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          betaalmethode: string | null
          bouwjaar: number | null
          brandstof: string | null
          consignatie_commissie_perc: number | null
          consignatie_eigenaar_email: string | null
          consignatie_eigenaar_naam: string | null
          consignatie_eigenaar_telefoon: string | null
          created_at: string
          customer_id: string | null
          feed_id: string | null
          google_drive_folder_id: string | null
          google_drive_folder_url: string | null
          google_drive_synced: boolean | null
          id: string
          inkoop_datum: string | null
          inkoopprijs: number | null
          kenteken: string | null
          kilometerstand: number | null
          kleur: string | null
          koper_email: string | null
          koper_naam: string | null
          koper_telefoon: string | null
          kostprijs: number | null
          marktplaats_url: string | null
          merk: string
          model: string
          opmerkingen: string | null
          status: string | null
          totale_kosten: number | null
          user_id: string | null
          verkoop_datum: string | null
          verkoop_type: string | null
          verkoopprijs: number | null
        }
        Insert: {
          betaalmethode?: string | null
          bouwjaar?: number | null
          brandstof?: string | null
          consignatie_commissie_perc?: number | null
          consignatie_eigenaar_email?: string | null
          consignatie_eigenaar_naam?: string | null
          consignatie_eigenaar_telefoon?: string | null
          created_at?: string
          customer_id?: string | null
          feed_id?: string | null
          google_drive_folder_id?: string | null
          google_drive_folder_url?: string | null
          google_drive_synced?: boolean | null
          id?: string
          inkoop_datum?: string | null
          inkoopprijs?: number | null
          kenteken?: string | null
          kilometerstand?: number | null
          kleur?: string | null
          koper_email?: string | null
          koper_naam?: string | null
          koper_telefoon?: string | null
          kostprijs?: number | null
          marktplaats_url?: string | null
          merk: string
          model: string
          opmerkingen?: string | null
          status?: string | null
          totale_kosten?: number | null
          user_id?: string | null
          verkoop_datum?: string | null
          verkoop_type?: string | null
          verkoopprijs?: number | null
        }
        Update: {
          betaalmethode?: string | null
          bouwjaar?: number | null
          brandstof?: string | null
          consignatie_commissie_perc?: number | null
          consignatie_eigenaar_email?: string | null
          consignatie_eigenaar_naam?: string | null
          consignatie_eigenaar_telefoon?: string | null
          created_at?: string
          customer_id?: string | null
          feed_id?: string | null
          google_drive_folder_id?: string | null
          google_drive_folder_url?: string | null
          google_drive_synced?: boolean | null
          id?: string
          inkoop_datum?: string | null
          inkoopprijs?: number | null
          kenteken?: string | null
          kilometerstand?: number | null
          kleur?: string | null
          koper_email?: string | null
          koper_naam?: string | null
          koper_telefoon?: string | null
          kostprijs?: number | null
          marktplaats_url?: string | null
          merk?: string
          model?: string
          opmerkingen?: string | null
          status?: string | null
          totale_kosten?: number | null
          user_id?: string | null
          verkoop_datum?: string | null
          verkoop_type?: string | null
          verkoopprijs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
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
