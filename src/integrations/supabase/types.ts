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
          betaald_op: string | null
          bewijs_pdf_path: string | null
          bron: string
          created_at: string
          datum: string
          geannuleerd_op: string | null
          id: string
          klant_achternaam: string
          klant_adres: string | null
          klant_email: string
          klant_postcode: string | null
          klant_telefoon: string | null
          klant_voornaam: string
          klant_woonplaats: string | null
          moneybird_contact_id: string | null
          moneybird_credit_invoice_id: string | null
          moneybird_invoice_id: string | null
          notities: string | null
          pdf_path: string | null
          plaats: string
          restbedrag: number
          status: string
          uiterlijke_datum: string | null
          user_id: string | null
          vehicle_id: string
          verkoopprijs: number
          voertuig_bouwjaar: number | null
          voertuig_kenteken: string | null
          voertuig_kilometerstand: number | null
          voertuig_merk: string | null
          voertuig_model: string | null
          voertuig_vin: string | null
        }
        Insert: {
          aanbetalingsbedrag?: number
          betaald_op?: string | null
          bewijs_pdf_path?: string | null
          bron?: string
          created_at?: string
          datum?: string
          geannuleerd_op?: string | null
          id?: string
          klant_achternaam: string
          klant_adres?: string | null
          klant_email: string
          klant_postcode?: string | null
          klant_telefoon?: string | null
          klant_voornaam: string
          klant_woonplaats?: string | null
          moneybird_contact_id?: string | null
          moneybird_credit_invoice_id?: string | null
          moneybird_invoice_id?: string | null
          notities?: string | null
          pdf_path?: string | null
          plaats?: string
          restbedrag?: number
          status?: string
          uiterlijke_datum?: string | null
          user_id?: string | null
          vehicle_id: string
          verkoopprijs?: number
          voertuig_bouwjaar?: number | null
          voertuig_kenteken?: string | null
          voertuig_kilometerstand?: number | null
          voertuig_merk?: string | null
          voertuig_model?: string | null
          voertuig_vin?: string | null
        }
        Update: {
          aanbetalingsbedrag?: number
          betaald_op?: string | null
          bewijs_pdf_path?: string | null
          bron?: string
          created_at?: string
          datum?: string
          geannuleerd_op?: string | null
          id?: string
          klant_achternaam?: string
          klant_adres?: string | null
          klant_email?: string
          klant_postcode?: string | null
          klant_telefoon?: string | null
          klant_voornaam?: string
          klant_woonplaats?: string | null
          moneybird_contact_id?: string | null
          moneybird_credit_invoice_id?: string | null
          moneybird_invoice_id?: string | null
          notities?: string | null
          pdf_path?: string | null
          plaats?: string
          restbedrag?: number
          status?: string
          uiterlijke_datum?: string | null
          user_id?: string | null
          vehicle_id?: string
          verkoopprijs?: number
          voertuig_bouwjaar?: number | null
          voertuig_kenteken?: string | null
          voertuig_kilometerstand?: number | null
          voertuig_merk?: string | null
          voertuig_model?: string | null
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
      appointments: {
        Row: {
          aanvraag_omschrijving: string | null
          aanvrager_achternaam: string | null
          aanvrager_email: string | null
          aanvrager_kenteken: string | null
          aanvrager_telefoon: string | null
          aanvrager_voornaam: string | null
          betalingsstatus: string | null
          bevestigingsmail_verstuurd: boolean
          bevestigingsmail_verstuurd_op: string | null
          bron: string | null
          created_at: string
          customer_id: string | null
          datum_tijd: string
          diensten: string[] | null
          diensten_notitie: string | null
          duur_minuten: number | null
          eind_datum_tijd: string | null
          geschatte_duur_minuten: number | null
          google_event_id: string | null
          id: string
          is_aanvraag: boolean
          klant_email: string | null
          klant_email_los: string | null
          klant_naam_los: string | null
          klant_telefoon_los: string | null
          medewerker: string | null
          notities: string | null
          onderwerp: string | null
          status: string
          type: string
          updated_at: string
          vehicle_id: string | null
          voertuig_klaargemaakt: boolean
          voertuig_klant_kenteken: string | null
          voertuig_klant_omschrijving: string | null
          voorkeursdatum: string | null
          werkzaamheden_omschrijving: string | null
        }
        Insert: {
          aanvraag_omschrijving?: string | null
          aanvrager_achternaam?: string | null
          aanvrager_email?: string | null
          aanvrager_kenteken?: string | null
          aanvrager_telefoon?: string | null
          aanvrager_voornaam?: string | null
          betalingsstatus?: string | null
          bevestigingsmail_verstuurd?: boolean
          bevestigingsmail_verstuurd_op?: string | null
          bron?: string | null
          created_at?: string
          customer_id?: string | null
          datum_tijd: string
          diensten?: string[] | null
          diensten_notitie?: string | null
          duur_minuten?: number | null
          eind_datum_tijd?: string | null
          geschatte_duur_minuten?: number | null
          google_event_id?: string | null
          id?: string
          is_aanvraag?: boolean
          klant_email?: string | null
          klant_email_los?: string | null
          klant_naam_los?: string | null
          klant_telefoon_los?: string | null
          medewerker?: string | null
          notities?: string | null
          onderwerp?: string | null
          status?: string
          type: string
          updated_at?: string
          vehicle_id?: string | null
          voertuig_klaargemaakt?: boolean
          voertuig_klant_kenteken?: string | null
          voertuig_klant_omschrijving?: string | null
          voorkeursdatum?: string | null
          werkzaamheden_omschrijving?: string | null
        }
        Update: {
          aanvraag_omschrijving?: string | null
          aanvrager_achternaam?: string | null
          aanvrager_email?: string | null
          aanvrager_kenteken?: string | null
          aanvrager_telefoon?: string | null
          aanvrager_voornaam?: string | null
          betalingsstatus?: string | null
          bevestigingsmail_verstuurd?: boolean
          bevestigingsmail_verstuurd_op?: string | null
          bron?: string | null
          created_at?: string
          customer_id?: string | null
          datum_tijd?: string
          diensten?: string[] | null
          diensten_notitie?: string | null
          duur_minuten?: number | null
          eind_datum_tijd?: string | null
          geschatte_duur_minuten?: number | null
          google_event_id?: string | null
          id?: string
          is_aanvraag?: boolean
          klant_email?: string | null
          klant_email_los?: string | null
          klant_naam_los?: string | null
          klant_telefoon_los?: string | null
          medewerker?: string | null
          notities?: string | null
          onderwerp?: string | null
          status?: string
          type?: string
          updated_at?: string
          vehicle_id?: string | null
          voertuig_klaargemaakt?: boolean
          voertuig_klant_kenteken?: string | null
          voertuig_klant_omschrijving?: string | null
          voorkeursdatum?: string | null
          werkzaamheden_omschrijving?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      contact_aanmeldingen: {
        Row: {
          bericht: string
          created_at: string
          email: string
          id: string
          naam: string
          status: string
          telefoon: string | null
        }
        Insert: {
          bericht: string
          created_at?: string
          email: string
          id?: string
          naam: string
          status?: string
          telefoon?: string | null
        }
        Update: {
          bericht?: string
          created_at?: string
          email?: string
          id?: string
          naam?: string
          status?: string
          telefoon?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          achternaam: string
          adres: string | null
          bedrijfsnaam: string | null
          btw_nummer: string | null
          created_at: string
          email: string
          geboortedatum: string | null
          id: string
          is_zakelijk: boolean | null
          kvk_nummer: string | null
          laatste_contact: string | null
          land: string | null
          moneybird_contact_id: string | null
          notities: string | null
          plaats: string | null
          postcode: string | null
          status: string
          telefoon: string
          updated_at: string
          voornaam: string
          woonplaats: string | null
        }
        Insert: {
          achternaam: string
          adres?: string | null
          bedrijfsnaam?: string | null
          btw_nummer?: string | null
          created_at?: string
          email: string
          geboortedatum?: string | null
          id?: string
          is_zakelijk?: boolean | null
          kvk_nummer?: string | null
          laatste_contact?: string | null
          land?: string | null
          moneybird_contact_id?: string | null
          notities?: string | null
          plaats?: string | null
          postcode?: string | null
          status?: string
          telefoon?: string
          updated_at?: string
          voornaam: string
          woonplaats?: string | null
        }
        Update: {
          achternaam?: string
          adres?: string | null
          bedrijfsnaam?: string | null
          btw_nummer?: string | null
          created_at?: string
          email?: string
          geboortedatum?: string | null
          id?: string
          is_zakelijk?: boolean | null
          kvk_nummer?: string | null
          laatste_contact?: string | null
          land?: string | null
          moneybird_contact_id?: string | null
          notities?: string | null
          plaats?: string | null
          postcode?: string | null
          status?: string
          telefoon?: string
          updated_at?: string
          voornaam?: string
          woonplaats?: string | null
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
      diensten: {
        Row: {
          actief: boolean
          categorie: string
          created_at: string
          duur_minuten: number
          id: string
          naam: string
          updated_at: string
          volgorde: number
        }
        Insert: {
          actief?: boolean
          categorie?: string
          created_at?: string
          duur_minuten?: number
          id?: string
          naam: string
          updated_at?: string
          volgorde?: number
        }
        Update: {
          actief?: boolean
          categorie?: string
          created_at?: string
          duur_minuten?: number
          id?: string
          naam?: string
          updated_at?: string
          volgorde?: number
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
      email_templates: {
        Row: {
          created_at: string
          html_body: string
          id: string
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_body?: string
          id?: string
          subject?: string
          template_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_body?: string
          id?: string
          subject?: string
          template_key?: string
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
      inkoopverklaringen: {
        Row: {
          bouwjaar: number | null
          chassisnummer: string | null
          created_at: string
          datum: string
          document_naam: string
          handtekening_data: string | null
          id: string
          inkoopprijs: number
          kenteken: string | null
          kilometerstand: number | null
          legitimatie_nummer: string
          legitimatie_type: string
          merk: string
          model: string
          moneybird_receipt_id: string | null
          moneybird_synced_at: string | null
          pdf_path: string | null
          status: string
          user_id: string | null
          vehicle_id: string | null
          verkoper_adres: string
          verkoper_email: string | null
          verkoper_naam: string
          verkoper_telefoon: string
          verkoper_woonplaats: string
        }
        Insert: {
          bouwjaar?: number | null
          chassisnummer?: string | null
          created_at?: string
          datum?: string
          document_naam: string
          handtekening_data?: string | null
          id?: string
          inkoopprijs?: number
          kenteken?: string | null
          kilometerstand?: number | null
          legitimatie_nummer: string
          legitimatie_type: string
          merk: string
          model: string
          moneybird_receipt_id?: string | null
          moneybird_synced_at?: string | null
          pdf_path?: string | null
          status?: string
          user_id?: string | null
          vehicle_id?: string | null
          verkoper_adres: string
          verkoper_email?: string | null
          verkoper_naam: string
          verkoper_telefoon: string
          verkoper_woonplaats: string
        }
        Update: {
          bouwjaar?: number | null
          chassisnummer?: string | null
          created_at?: string
          datum?: string
          document_naam?: string
          handtekening_data?: string | null
          id?: string
          inkoopprijs?: number
          kenteken?: string | null
          kilometerstand?: number | null
          legitimatie_nummer?: string
          legitimatie_type?: string
          merk?: string
          model?: string
          moneybird_receipt_id?: string | null
          moneybird_synced_at?: string | null
          pdf_path?: string | null
          status?: string
          user_id?: string | null
          vehicle_id?: string | null
          verkoper_adres?: string
          verkoper_email?: string | null
          verkoper_naam?: string
          verkoper_telefoon?: string
          verkoper_woonplaats?: string
        }
        Relationships: [
          {
            foreignKeyName: "inkoopverklaringen_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      kosten: {
        Row: {
          actief: boolean
          bedrag: number
          categorie: string
          categorie_id: string | null
          created_at: string
          datum: string
          frequentie: string
          id: string
          leverancier: string | null
          naam: string
          notities: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actief?: boolean
          bedrag?: number
          categorie?: string
          categorie_id?: string | null
          created_at?: string
          datum?: string
          frequentie?: string
          id?: string
          leverancier?: string | null
          naam: string
          notities?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actief?: boolean
          bedrag?: number
          categorie?: string
          categorie_id?: string | null
          created_at?: string
          datum?: string
          frequentie?: string
          id?: string
          leverancier?: string | null
          naam?: string
          notities?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kosten_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "kosten_categorieen"
            referencedColumns: ["id"]
          },
        ]
      }
      kosten_categorieen: {
        Row: {
          aangemaakt_op: string
          id: string
          moneybird_contact_ids: string[]
          naam: string
        }
        Insert: {
          aangemaakt_op?: string
          id?: string
          moneybird_contact_ids?: string[]
          naam: string
        }
        Update: {
          aangemaakt_op?: string
          id?: string
          moneybird_contact_ids?: string[]
          naam?: string
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
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          notification_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          notification_type?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          appointment_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          link: string | null
          metadata: Json | null
          read: boolean
          task_id: string | null
          title: string
          type: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          link?: string | null
          metadata?: Json | null
          read?: boolean
          task_id?: string | null
          title: string
          type: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          link?: string | null
          metadata?: Json | null
          read?: boolean
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointment_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "vehicle_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
          signature_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          signature_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          signature_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      slack_notification_log: {
        Row: {
          created_at: string
          entity_id: string | null
          id: string
          message: string | null
          notification_key: string
          notification_type: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          id?: string
          message?: string | null
          notification_key: string
          notification_type: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          id?: string
          message?: string | null
          notification_key?: string
          notification_type?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "slack_notification_log_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
      time_entries: {
        Row: {
          category: string
          created_at: string
          customer_id: string | null
          description: string
          duration_minutes: number | null
          end_note: string | null
          end_time: string | null
          hourly_rate: number | null
          id: string
          start_time: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          customer_id?: string | null
          description: string
          duration_minutes?: number | null
          end_note?: string | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          start_time?: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          customer_id?: string | null
          description?: string
          duration_minutes?: number | null
          end_note?: string | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          start_time?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_vehicle_id_fkey"
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
      vehicle_sales: {
        Row: {
          aanbetaling_actief: boolean
          aanbetaling_datum: string | null
          aanbetalingsbedrag: number | null
          afleverdatum: string | null
          betaalwijze: string
          betaalwijze_details: Json
          contant_bedrag: number | null
          created_at: string
          customer_id: string | null
          factuur_email: string | null
          factuur_verstuurd: boolean
          financiering: boolean
          financiering_maatschappij: string | null
          garantie_betaler: string | null
          garantie_kosten: number | null
          garantie_maanden: number | null
          garantie_type: string
          id: string
          lead_source: string | null
          lead_source_anders: string | null
          moneybird_factuur_id: string | null
          overboeking_bedrag: number | null
          overeenkomst_ondertekend: boolean
          restbedrag: number | null
          status: string
          updated_at: string
          vehicle_id: string
          verkoop_datum: string | null
          verkoopprijs: number
          wizard_data: Json | null
          wizard_stap: number
          wwft_bevestigd: boolean
        }
        Insert: {
          aanbetaling_actief?: boolean
          aanbetaling_datum?: string | null
          aanbetalingsbedrag?: number | null
          afleverdatum?: string | null
          betaalwijze?: string
          betaalwijze_details?: Json
          contant_bedrag?: number | null
          created_at?: string
          customer_id?: string | null
          factuur_email?: string | null
          factuur_verstuurd?: boolean
          financiering?: boolean
          financiering_maatschappij?: string | null
          garantie_betaler?: string | null
          garantie_kosten?: number | null
          garantie_maanden?: number | null
          garantie_type?: string
          id?: string
          lead_source?: string | null
          lead_source_anders?: string | null
          moneybird_factuur_id?: string | null
          overboeking_bedrag?: number | null
          overeenkomst_ondertekend?: boolean
          restbedrag?: number | null
          status?: string
          updated_at?: string
          vehicle_id: string
          verkoop_datum?: string | null
          verkoopprijs?: number
          wizard_data?: Json | null
          wizard_stap?: number
          wwft_bevestigd?: boolean
        }
        Update: {
          aanbetaling_actief?: boolean
          aanbetaling_datum?: string | null
          aanbetalingsbedrag?: number | null
          afleverdatum?: string | null
          betaalwijze?: string
          betaalwijze_details?: Json
          contant_bedrag?: number | null
          created_at?: string
          customer_id?: string | null
          factuur_email?: string | null
          factuur_verstuurd?: boolean
          financiering?: boolean
          financiering_maatschappij?: string | null
          garantie_betaler?: string | null
          garantie_kosten?: number | null
          garantie_maanden?: number | null
          garantie_type?: string
          id?: string
          lead_source?: string | null
          lead_source_anders?: string | null
          moneybird_factuur_id?: string | null
          overboeking_bedrag?: number | null
          overeenkomst_ondertekend?: boolean
          restbedrag?: number | null
          status?: string
          updated_at?: string
          vehicle_id?: string
          verkoop_datum?: string | null
          verkoopprijs?: number
          wizard_data?: Json | null
          wizard_stap?: number
          wwft_bevestigd?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_sales_vehicle_id_fkey"
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
          aanbetalingsbedrag: number | null
          afleverkosten: number | null
          apk_vervaldatum: string | null
          betaalmethode: string | null
          bouwjaar: number | null
          brandstof: string | null
          btw_marge_type: string
          chassis_nummer: string | null
          consignatie_commissie_perc: number | null
          consignatie_eigenaar_email: string | null
          consignatie_eigenaar_naam: string | null
          consignatie_eigenaar_telefoon: string | null
          contant_bedrag: number | null
          created_at: string
          customer_id: string | null
          datum_deel_1: string | null
          feed_id: string | null
          feed_kilometerstand: number | null
          feed_verkoopprijs: number | null
          financiering_actief: boolean | null
          financiering_bedrag: number | null
          gewicht: number | null
          google_drive_folder_id: string | null
          google_drive_folder_url: string | null
          google_drive_synced: boolean | null
          heeft_aanbetaling: boolean
          id: string
          inkoop_datum: string | null
          inkoopprijs: number | null
          inruil_kenteken: string | null
          inruil_merk: string | null
          inruil_model: string | null
          inruil_waarde: number | null
          kenteken: string | null
          kilometerstand: number | null
          kleur: string | null
          koper_email: string | null
          koper_naam: string | null
          koper_telefoon: string | null
          kostprijs: number | null
          leges: number | null
          marktplaats_url: string | null
          merk: string
          model: string
          nap: boolean | null
          opmerkingen: string | null
          overboeking_bedrag: number | null
          status: string | null
          totale_kosten: number | null
          uitvoering: string | null
          user_id: string | null
          vehicle_type: string | null
          verkoop_datum: string | null
          verkoop_type: string | null
          verkoopprijs: number | null
          verwijderingsbijdrage: number | null
        }
        Insert: {
          aanbetalingsbedrag?: number | null
          afleverkosten?: number | null
          apk_vervaldatum?: string | null
          betaalmethode?: string | null
          bouwjaar?: number | null
          brandstof?: string | null
          btw_marge_type?: string
          chassis_nummer?: string | null
          consignatie_commissie_perc?: number | null
          consignatie_eigenaar_email?: string | null
          consignatie_eigenaar_naam?: string | null
          consignatie_eigenaar_telefoon?: string | null
          contant_bedrag?: number | null
          created_at?: string
          customer_id?: string | null
          datum_deel_1?: string | null
          feed_id?: string | null
          feed_kilometerstand?: number | null
          feed_verkoopprijs?: number | null
          financiering_actief?: boolean | null
          financiering_bedrag?: number | null
          gewicht?: number | null
          google_drive_folder_id?: string | null
          google_drive_folder_url?: string | null
          google_drive_synced?: boolean | null
          heeft_aanbetaling?: boolean
          id?: string
          inkoop_datum?: string | null
          inkoopprijs?: number | null
          inruil_kenteken?: string | null
          inruil_merk?: string | null
          inruil_model?: string | null
          inruil_waarde?: number | null
          kenteken?: string | null
          kilometerstand?: number | null
          kleur?: string | null
          koper_email?: string | null
          koper_naam?: string | null
          koper_telefoon?: string | null
          kostprijs?: number | null
          leges?: number | null
          marktplaats_url?: string | null
          merk: string
          model: string
          nap?: boolean | null
          opmerkingen?: string | null
          overboeking_bedrag?: number | null
          status?: string | null
          totale_kosten?: number | null
          uitvoering?: string | null
          user_id?: string | null
          vehicle_type?: string | null
          verkoop_datum?: string | null
          verkoop_type?: string | null
          verkoopprijs?: number | null
          verwijderingsbijdrage?: number | null
        }
        Update: {
          aanbetalingsbedrag?: number | null
          afleverkosten?: number | null
          apk_vervaldatum?: string | null
          betaalmethode?: string | null
          bouwjaar?: number | null
          brandstof?: string | null
          btw_marge_type?: string
          chassis_nummer?: string | null
          consignatie_commissie_perc?: number | null
          consignatie_eigenaar_email?: string | null
          consignatie_eigenaar_naam?: string | null
          consignatie_eigenaar_telefoon?: string | null
          contant_bedrag?: number | null
          created_at?: string
          customer_id?: string | null
          datum_deel_1?: string | null
          feed_id?: string | null
          feed_kilometerstand?: number | null
          feed_verkoopprijs?: number | null
          financiering_actief?: boolean | null
          financiering_bedrag?: number | null
          gewicht?: number | null
          google_drive_folder_id?: string | null
          google_drive_folder_url?: string | null
          google_drive_synced?: boolean | null
          heeft_aanbetaling?: boolean
          id?: string
          inkoop_datum?: string | null
          inkoopprijs?: number | null
          inruil_kenteken?: string | null
          inruil_merk?: string | null
          inruil_model?: string | null
          inruil_waarde?: number | null
          kenteken?: string | null
          kilometerstand?: number | null
          kleur?: string | null
          koper_email?: string | null
          koper_naam?: string | null
          koper_telefoon?: string | null
          kostprijs?: number | null
          leges?: number | null
          marktplaats_url?: string | null
          merk?: string
          model?: string
          nap?: boolean | null
          opmerkingen?: string | null
          overboeking_bedrag?: number | null
          status?: string | null
          totale_kosten?: number | null
          uitvoering?: string | null
          user_id?: string | null
          vehicle_type?: string | null
          verkoop_datum?: string | null
          verkoop_type?: string | null
          verkoopprijs?: number | null
          verwijderingsbijdrage?: number | null
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
      verkoop_documenten: {
        Row: {
          aangemaakt_op: string | null
          id: string
          pdf_url: string | null
          type: string | null
          verkoop_id: string | null
        }
        Insert: {
          aangemaakt_op?: string | null
          id?: string
          pdf_url?: string | null
          type?: string | null
          verkoop_id?: string | null
        }
        Update: {
          aangemaakt_op?: string | null
          id?: string
          pdf_url?: string | null
          type?: string | null
          verkoop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verkoop_documenten_verkoop_id_fkey"
            columns: ["verkoop_id"]
            isOneToOne: false
            referencedRelation: "verkopen"
            referencedColumns: ["id"]
          },
        ]
      }
      verkopen: {
        Row: {
          aanbetaling_bankrekening: string | null
          aanbetaling_bedrag: number | null
          aanbetaling_betaalwijze: string | null
          aanbetaling_datum: string | null
          aanbetaling_ontvangen: boolean | null
          afleveradres: string | null
          afleverkosten: number | null
          afleverwijze: string | null
          apk_gecommuniceerd: boolean
          auto_schoongemaakt: boolean
          bedankbericht_gestuurd: boolean | null
          betaalwijze: string | null
          betaalwijze_details: Json | null
          betaling_datum: string | null
          betaling_ontvangen: boolean | null
          betaling_opmerking: string | null
          contract_getekend: boolean | null
          contract_getekend_datum: string | null
          created_at: string | null
          customer_id: string | null
          factuur_betaald: boolean | null
          factuur_email: string | null
          factuur_email_verzonden_op: string | null
          factuur_referentie: string | null
          factuur_verstuurd: boolean
          factuurdatum: string | null
          financiering: boolean | null
          financiering_maatschappij: string | null
          garantie_looptijd: number | null
          garantie_pakket: string | null
          garantie_prijs: number | null
          garantie_type: string | null
          gebreken_besproken: boolean
          gebreken_omschrijving: string | null
          id: string
          inruil: boolean | null
          inruil_bedrijfsnaam: string | null
          inruil_betaalwijze: string | null
          inruil_bouwjaar: number | null
          inruil_btw: string | null
          inruil_chassis: string | null
          inruil_contactpersoon: string | null
          inruil_inkoopverklaring_id: string | null
          inruil_kenteken: string | null
          inruil_kleur: string | null
          inruil_km: number | null
          inruil_kvk: string | null
          inruil_merk: string | null
          inruil_model: string | null
          inruil_op_naam: boolean | null
          inruil_op_naam_at: string | null
          inruil_type: string | null
          inruil_uitvoering: string | null
          inruil_verkoper_achternaam: string | null
          inruil_verkoper_adres: string | null
          inruil_verkoper_geboortedatum: string | null
          inruil_verkoper_postcode: string | null
          inruil_verkoper_telefoon: string | null
          inruil_verkoper_voornaam: string | null
          inruil_verkoper_woonplaats: string | null
          inruil_waarde: number | null
          klant_type: string | null
          later_ophalen: boolean | null
          lead_source: string | null
          lead_source_anders: string | null
          leges: number | null
          leverdatum: string | null
          machtiging_datum: string | null
          machtiging_ontvangen: boolean
          machtigingsnummer: string | null
          moneybird_factuur_id: string | null
          moneybird_factuur_nummer: string | null
          moneybird_factuur_url: string | null
          moneybird_payment_id: string | null
          opmerkingen: string | null
          overboeking_bedrag: number | null
          overeenkomstnummer: string | null
          rdw_check_gedaan: boolean | null
          restbedrag_later: boolean
          restbedrag_verwachte_datum: string | null
          review_gevraagd: boolean | null
          sleutels_aantal: number | null
          sleutels_overhandigd: boolean
          stap1_afgerond: boolean | null
          stap10_afgerond: boolean | null
          stap11_afgerond: boolean | null
          stap12_afgerond: boolean | null
          stap2_afgerond: boolean | null
          stap3_afgerond: boolean | null
          stap4_afgerond: boolean | null
          stap5_afgerond: boolean | null
          stap6_afgerond: boolean | null
          stap7_afgerond: boolean | null
          stap8_afgerond: boolean | null
          stap9_afgerond: boolean | null
          tenaamstelling_bevestigd: boolean
          tenaamstelling_datum: string | null
          tenaamstellingsbewijs_klaargelegd: boolean
          tenaamstellingsbewijs_meegegeven: boolean
          uitlevering_datum: string | null
          uitlevering_foto: boolean | null
          uitlevering_fotos: string[]
          uitlevering_voltooid: boolean
          updated_at: string | null
          vehicle_id: string | null
          verkoop_type: string | null
          verkoopprijs: number | null
          verwijderingsbijdrage: number | null
          vrijwaring_aangevraagd: boolean | null
          vrijwaring_bevestigd: boolean | null
          vrijwaring_datum: string | null
          vrijwaring_tijdstip: string | null
          wizard_stap: number | null
          wizard_status: string | null
        }
        Insert: {
          aanbetaling_bankrekening?: string | null
          aanbetaling_bedrag?: number | null
          aanbetaling_betaalwijze?: string | null
          aanbetaling_datum?: string | null
          aanbetaling_ontvangen?: boolean | null
          afleveradres?: string | null
          afleverkosten?: number | null
          afleverwijze?: string | null
          apk_gecommuniceerd?: boolean
          auto_schoongemaakt?: boolean
          bedankbericht_gestuurd?: boolean | null
          betaalwijze?: string | null
          betaalwijze_details?: Json | null
          betaling_datum?: string | null
          betaling_ontvangen?: boolean | null
          betaling_opmerking?: string | null
          contract_getekend?: boolean | null
          contract_getekend_datum?: string | null
          created_at?: string | null
          customer_id?: string | null
          factuur_betaald?: boolean | null
          factuur_email?: string | null
          factuur_email_verzonden_op?: string | null
          factuur_referentie?: string | null
          factuur_verstuurd?: boolean
          factuurdatum?: string | null
          financiering?: boolean | null
          financiering_maatschappij?: string | null
          garantie_looptijd?: number | null
          garantie_pakket?: string | null
          garantie_prijs?: number | null
          garantie_type?: string | null
          gebreken_besproken?: boolean
          gebreken_omschrijving?: string | null
          id?: string
          inruil?: boolean | null
          inruil_bedrijfsnaam?: string | null
          inruil_betaalwijze?: string | null
          inruil_bouwjaar?: number | null
          inruil_btw?: string | null
          inruil_chassis?: string | null
          inruil_contactpersoon?: string | null
          inruil_inkoopverklaring_id?: string | null
          inruil_kenteken?: string | null
          inruil_kleur?: string | null
          inruil_km?: number | null
          inruil_kvk?: string | null
          inruil_merk?: string | null
          inruil_model?: string | null
          inruil_op_naam?: boolean | null
          inruil_op_naam_at?: string | null
          inruil_type?: string | null
          inruil_uitvoering?: string | null
          inruil_verkoper_achternaam?: string | null
          inruil_verkoper_adres?: string | null
          inruil_verkoper_geboortedatum?: string | null
          inruil_verkoper_postcode?: string | null
          inruil_verkoper_telefoon?: string | null
          inruil_verkoper_voornaam?: string | null
          inruil_verkoper_woonplaats?: string | null
          inruil_waarde?: number | null
          klant_type?: string | null
          later_ophalen?: boolean | null
          lead_source?: string | null
          lead_source_anders?: string | null
          leges?: number | null
          leverdatum?: string | null
          machtiging_datum?: string | null
          machtiging_ontvangen?: boolean
          machtigingsnummer?: string | null
          moneybird_factuur_id?: string | null
          moneybird_factuur_nummer?: string | null
          moneybird_factuur_url?: string | null
          moneybird_payment_id?: string | null
          opmerkingen?: string | null
          overboeking_bedrag?: number | null
          overeenkomstnummer?: string | null
          rdw_check_gedaan?: boolean | null
          restbedrag_later?: boolean
          restbedrag_verwachte_datum?: string | null
          review_gevraagd?: boolean | null
          sleutels_aantal?: number | null
          sleutels_overhandigd?: boolean
          stap1_afgerond?: boolean | null
          stap10_afgerond?: boolean | null
          stap11_afgerond?: boolean | null
          stap12_afgerond?: boolean | null
          stap2_afgerond?: boolean | null
          stap3_afgerond?: boolean | null
          stap4_afgerond?: boolean | null
          stap5_afgerond?: boolean | null
          stap6_afgerond?: boolean | null
          stap7_afgerond?: boolean | null
          stap8_afgerond?: boolean | null
          stap9_afgerond?: boolean | null
          tenaamstelling_bevestigd?: boolean
          tenaamstelling_datum?: string | null
          tenaamstellingsbewijs_klaargelegd?: boolean
          tenaamstellingsbewijs_meegegeven?: boolean
          uitlevering_datum?: string | null
          uitlevering_foto?: boolean | null
          uitlevering_fotos?: string[]
          uitlevering_voltooid?: boolean
          updated_at?: string | null
          vehicle_id?: string | null
          verkoop_type?: string | null
          verkoopprijs?: number | null
          verwijderingsbijdrage?: number | null
          vrijwaring_aangevraagd?: boolean | null
          vrijwaring_bevestigd?: boolean | null
          vrijwaring_datum?: string | null
          vrijwaring_tijdstip?: string | null
          wizard_stap?: number | null
          wizard_status?: string | null
        }
        Update: {
          aanbetaling_bankrekening?: string | null
          aanbetaling_bedrag?: number | null
          aanbetaling_betaalwijze?: string | null
          aanbetaling_datum?: string | null
          aanbetaling_ontvangen?: boolean | null
          afleveradres?: string | null
          afleverkosten?: number | null
          afleverwijze?: string | null
          apk_gecommuniceerd?: boolean
          auto_schoongemaakt?: boolean
          bedankbericht_gestuurd?: boolean | null
          betaalwijze?: string | null
          betaalwijze_details?: Json | null
          betaling_datum?: string | null
          betaling_ontvangen?: boolean | null
          betaling_opmerking?: string | null
          contract_getekend?: boolean | null
          contract_getekend_datum?: string | null
          created_at?: string | null
          customer_id?: string | null
          factuur_betaald?: boolean | null
          factuur_email?: string | null
          factuur_email_verzonden_op?: string | null
          factuur_referentie?: string | null
          factuur_verstuurd?: boolean
          factuurdatum?: string | null
          financiering?: boolean | null
          financiering_maatschappij?: string | null
          garantie_looptijd?: number | null
          garantie_pakket?: string | null
          garantie_prijs?: number | null
          garantie_type?: string | null
          gebreken_besproken?: boolean
          gebreken_omschrijving?: string | null
          id?: string
          inruil?: boolean | null
          inruil_bedrijfsnaam?: string | null
          inruil_betaalwijze?: string | null
          inruil_bouwjaar?: number | null
          inruil_btw?: string | null
          inruil_chassis?: string | null
          inruil_contactpersoon?: string | null
          inruil_inkoopverklaring_id?: string | null
          inruil_kenteken?: string | null
          inruil_kleur?: string | null
          inruil_km?: number | null
          inruil_kvk?: string | null
          inruil_merk?: string | null
          inruil_model?: string | null
          inruil_op_naam?: boolean | null
          inruil_op_naam_at?: string | null
          inruil_type?: string | null
          inruil_uitvoering?: string | null
          inruil_verkoper_achternaam?: string | null
          inruil_verkoper_adres?: string | null
          inruil_verkoper_geboortedatum?: string | null
          inruil_verkoper_postcode?: string | null
          inruil_verkoper_telefoon?: string | null
          inruil_verkoper_voornaam?: string | null
          inruil_verkoper_woonplaats?: string | null
          inruil_waarde?: number | null
          klant_type?: string | null
          later_ophalen?: boolean | null
          lead_source?: string | null
          lead_source_anders?: string | null
          leges?: number | null
          leverdatum?: string | null
          machtiging_datum?: string | null
          machtiging_ontvangen?: boolean
          machtigingsnummer?: string | null
          moneybird_factuur_id?: string | null
          moneybird_factuur_nummer?: string | null
          moneybird_factuur_url?: string | null
          moneybird_payment_id?: string | null
          opmerkingen?: string | null
          overboeking_bedrag?: number | null
          overeenkomstnummer?: string | null
          rdw_check_gedaan?: boolean | null
          restbedrag_later?: boolean
          restbedrag_verwachte_datum?: string | null
          review_gevraagd?: boolean | null
          sleutels_aantal?: number | null
          sleutels_overhandigd?: boolean
          stap1_afgerond?: boolean | null
          stap10_afgerond?: boolean | null
          stap11_afgerond?: boolean | null
          stap12_afgerond?: boolean | null
          stap2_afgerond?: boolean | null
          stap3_afgerond?: boolean | null
          stap4_afgerond?: boolean | null
          stap5_afgerond?: boolean | null
          stap6_afgerond?: boolean | null
          stap7_afgerond?: boolean | null
          stap8_afgerond?: boolean | null
          stap9_afgerond?: boolean | null
          tenaamstelling_bevestigd?: boolean
          tenaamstelling_datum?: string | null
          tenaamstellingsbewijs_klaargelegd?: boolean
          tenaamstellingsbewijs_meegegeven?: boolean
          uitlevering_datum?: string | null
          uitlevering_foto?: boolean | null
          uitlevering_fotos?: string[]
          uitlevering_voltooid?: boolean
          updated_at?: string | null
          vehicle_id?: string | null
          verkoop_type?: string | null
          verkoopprijs?: number | null
          verwijderingsbijdrage?: number | null
          vrijwaring_aangevraagd?: boolean | null
          vrijwaring_bevestigd?: boolean | null
          vrijwaring_datum?: string | null
          vrijwaring_tijdstip?: string | null
          wizard_stap?: number | null
          wizard_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verkopen_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verkopen_inruil_inkoopverklaring_id_fkey"
            columns: ["inruil_inkoopverklaring_id"]
            isOneToOne: false
            referencedRelation: "inkoopverklaringen"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verkopen_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      appointment_slots: {
        Row: {
          datum_tijd: string | null
          eind_datum_tijd: string | null
          id: string | null
          status: string | null
          type: string | null
          vehicle_id: string | null
        }
        Insert: {
          datum_tijd?: string | null
          eind_datum_tijd?: string | null
          id?: string | null
          status?: string | null
          type?: string | null
          vehicle_id?: string | null
        }
        Update: {
          datum_tijd?: string | null
          eind_datum_tijd?: string | null
          id?: string | null
          status?: string | null
          type?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
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
