## Doel
Planning module functioneler + minimalistischer maken, met inline detailpaneel en 1-klik Moneybird factuur.

## Database (1 migratie)
- `diensten.standaard_prijs_cent` (int, nullable) — vaste prijs per dienst.
- `appointments.prijs_regels` (jsonb, default `[]`) — array `{omschrijving, aantal, prijs_cent, btw_pct}` voor handmatige regels.
- `appointments.totaal_prijs_cent` (int, nullable) — totaalprijs cache (optioneel ingevuld).
- `appointments.moneybird_invoice_id` (text, nullable) + `moneybird_invoice_url` (text, nullable) — voorkomt dubbele facturen.

## Nieuwe layout `/admin/planning`

```text
┌─────────────────────────────────────────────────────────────────┐
│ Planning           [Agenda | Lijst]            [+ Afspraak]     │
├──────────────────────────────────┬──────────────────────────────┤
│  Week-agenda (compacter,         │  Detailpaneel (sticky)       │
│  minder kleur, 1 dot per type)   │  – geselecteerde afspraak    │
│                                  │  – of "Vandaag" samenvatting │
│  Mo Di Wo Do Vr Za Zo            │    als niets geselecteerd    │
│  ...                             │                              │
└──────────────────────────────────┴──────────────────────────────┘
```

- Geen popup meer. Klik op afspraak vult rechterpaneel. Op mobile valt het paneel terug naar een bottom-sheet.
- Agenda zelf: rustiger — neutrale tegels, alleen kleine type-dot + tijd + naam.

## Detailpaneel (rechterzijde, minimalistisch)
Vaste opbouw, weinig knoppen:
1. **Header:** type · tijd · datum.
2. **Klant + voertuig** (1 regel elk, geen iconen-overdaad).
3. **Reparatiepunten / checklist** (inline bewerkbaar, blijft zoals nu).
4. **Diensten / prijsregels** — tabel met per regel: omschrijving · aantal · prijs. Prijs auto-gevuld vanuit `diensten.standaard_prijs_cent`, handmatig te overschrijven. Toon totaal onderaan.
5. **Status segment** (Bevestigd / Afgerond / No-show).
6. **Acties (max 3 knoppen):**
   - `Bellen` / `WhatsApp` (samen 1 rij, compact)
   - **`Factuur in Moneybird`** — alleen zichtbaar bij types `poetsbeurt`, `onderhoud`, `aflevering` en wanneer er prijsregels zijn. Disabled als al gefactureerd; toont dan link naar Moneybird.
7. Footer: Bewerken · Verwijderen.

## Moneybird-knop flow (concept-factuur)
Eén klik → roept `moneybird` edge function aan met action `create_wizard_invoice` (bestaat al):
- `contact_payload` opgebouwd uit klant (CRM-klant of losse klant) + kenteken in `reference`.
- `details_attributes` = prijsregels van de afspraak (omschrijving = dienstnaam, prijs = `prijs_cent/100`, aantal = `aantal`). Werkzaamheden-omschrijving wordt eerste regel als er geen diensten zijn.
- `prices_are_incl_tax: true`, geen `workflow_id`.
- Resultaat → `moneybird_invoice_id` + `moneybird_invoice_url` opslaan op de afspraak; toast met "Concept aangemaakt – open in Moneybird".

Geen automatische verzending — concept blijft in Moneybird ter controle.

## Bestanden
- Migratie (nieuwe kolommen).
- Nieuw `src/components/admin/planning/AppointmentDetailPanel.tsx` (vervangt popover-gebruik op desktop).
- `AdminPlanningPage.tsx`: 2-koloms layout (agenda + paneel), simpelere tegels.
- `AppointmentDetailDialog.tsx`: hergebruikt op mobile als bottom-sheet wrapper rondom het paneel.
- `AppointmentFormDialog.tsx`: prijsregels-sectie toevoegen.
- `useAppointments.ts`: types uitbreiden met `prijs_regels`, `moneybird_invoice_id`, `moneybird_invoice_url`.
- Geen nieuwe edge function nodig — `create_wizard_invoice` bestaat.

## Wat blijft hetzelfde
- Lijstweergave, openstaande aanvragen, agenda-data-source, Google Calendar sync.
- Checklist / reparatiepunten in notities-veld (recent toegevoegd).

Akkoord? Dan start ik met de migratie en bouw daarna stap voor stap.