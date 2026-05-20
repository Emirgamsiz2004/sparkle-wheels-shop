
## Deel 1 — Proefrit verbeteringen

### 1. Database migratie
Voeg toe aan `test_drives`:
- `vertrek_tijd` (timestamptz, default now() bij status='actief')
- `terugkomst_tijd` (timestamptz)
- `gereden_km` (integer, generated of berekend bij afsluiten)
- `max_duur_minuten` (integer, default 30)

Bij start: `start_tijd` blijft, `vertrek_tijd = now()` wordt gezet wanneer klant het formulier voltooit en status → 'actief'. Bij afsluit: `terugkomst_tijd = now()`, `gereden_km = km_na - km_voor`.

### 2. Tekst "Maximale proefritduur: 30 minuten"
In `StartProefritDialog.tsx` onder de input velden: subtiele grijze tekst met klok icoon.

### 3. Timer hook + context
- Nieuwe hook `useProefritTimer(testDrive)` → berekent restende tijd op basis van `vertrek_tijd + 30min`.
- Centraal: in `useTestDrives` is al alle data. Component `ActieveProefritTimer` toont MM:SS, kleurt groen → oranje <10m → rood <5m.

### 4. Sidebar badge
In `MobileSidebar.tsx` en de desktop sidebar (vinden): bij item "Proefritten" een badge met `mm:ss` van actieve proefrit (eerste actieve). Realtime update via interval.

### 5. Toast bij 00:00
Globale watcher component `ProefritExpiryWatcher` (gemount in admin layout): wanneer een actieve proefrit ≥ 30min loopt, toont `toast.error(..., { duration: Infinity })` met onClick → navigate naar afsluit pagina. Dedupe per test_drive_id via Set in state.

### 6. Verplichte eindkm
`EindProefritDialog` heeft dit al — verbeter: 
- Duidelijke validatie melding inline
- Toon "Gereden: X km" live onder het veld zodra geldig
- Disable submit tot geldig

## Deel 2 — Sidebar snelstart knop

### Component `SidebarQuickActions.tsx`
Ronde + knop boven Instellingen in zowel desktop AdminSidebar als MobileSidebar.

Desktop: Popover (radix) rechts van knop.
Mobiel: Drawer (bottom sheet).

Sectie inhoud:
- **Voertuig & Verkoop**: Voertuig toevoegen, Inkoopverklaring, Verkoop starten, Aanbetaling
- **Klanten & Proefritten**: Nieuwe klant, Proefrit starten, Afspraak plannen
- **Overig**: Document aanmaken, Kenteken opzoeken (inline input → opent deal analyzer of detail)

Navigatie routes:
- Voertuig: `/admin/voertuigen/nieuw`
- Inkoop: `/admin/inkoop` (of bestaande popover)
- Verkoop: `/admin/verkopen` → wizard
- Aanbetaling: `/admin/financieel` of bestaande dialog
- Klant: `/admin/klanten?new=1`
- Proefrit: `/admin/proefriten?new=1`
- Afspraak: `/admin/planning?new=1`
- Document: `/admin/archief`
- Kenteken: input → `/admin/voertuigen?search=KENTEKEN`

Acties die complexe popovers nodig hebben gebruiken querystring triggers naar de bestaande pagina's i.p.v. globale dialogen te dupliceren — pragmatisch en consistent.

## Technische details

**Bestanden te wijzigen/maken:**
- `supabase/migrations/...` — nieuwe kolommen
- `src/hooks/useTestDrives.ts` — vertrek_tijd, terugkomst_tijd, gereden_km toevoegen aan types + update logic
- `src/hooks/useProefritTimer.ts` (nieuw)
- `src/components/admin/proefrit/StartProefritDialog.tsx` — tekstregel
- `src/components/admin/proefrit/EindProefritDialog.tsx` — gereden km live, validatie
- `src/components/admin/proefrit/ProefritTimer.tsx` (nieuw) — grote countdown
- `src/components/admin/proefrit/ProefritExpiryWatcher.tsx` (nieuw) — toast watcher
- `src/components/admin/Sidebar.tsx` (desktop) en `MobileSidebar.tsx` — badge + snelstart knop
- `src/components/admin/SidebarQuickActions.tsx` (nieuw)
- `src/pages/admin/AdminProefrittenPage.tsx` / detail — timer integreren
- Admin layout — `ProefritExpiryWatcher` monten

Geen wijziging in branding/business logica. Alles binnen bestaande dark admin theme.
