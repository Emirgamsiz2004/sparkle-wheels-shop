# Te kopiëren bestanden vanuit Platin Automotive

Bron-project ID: `a07eb15b-5bf0-4dee-a27d-6af2bde03954`

Gebruik `cross_project--read_project_file` per bestand en schrijf naar **hetzelfde pad** in het nieuwe project.

> Tip: Loop door deze lijst in volgorde. De bestanden die hier niet staan zijn bewust weggelaten of worden vervangen door versies uit `_crm-export/`.

---

## Config & root

- `tailwind.config.ts`
- `postcss.config.js`
- `components.json`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `vite.config.ts`
- `eslint.config.js`
- `src/index.css`
- `src/App.css`
- `src/vite-env.d.ts`

**Niet kopiëren**: `src/App.tsx`, `src/main.tsx`, `index.html` — gebruik de versies uit `_crm-export/`.

---

## Supabase integratie

- `src/integrations/supabase/client.ts`  ← **wordt na koppelen automatisch overschreven; eerst koppelen, dan deze niet kopiëren**
- `src/integrations/supabase/types.ts`  ← **idem, auto-gegenereerd**

---

## Assets

- `src/assets/logo.svg`

(De marktplaats/autoscout/autotrack logo's zijn niet nodig in de CRM.)

---

## Hooks (allemaal kopiëren)

- `src/hooks/use-keyboard-safe-viewport.ts`
- `src/hooks/use-mobile.tsx`
- `src/hooks/use-toast.ts`
- `src/hooks/useAppointments.ts`
- `src/hooks/useAuth.tsx`
- `src/hooks/useAutomation.ts`
- `src/hooks/useCustomers.ts`
- `src/hooks/useDashboardData.ts`
- `src/hooks/useDiensten.ts`
- `src/hooks/useInkoopCandidates.ts`
- `src/hooks/useInkoopverklaringen.ts`
- `src/hooks/useKosten.ts`
- `src/hooks/useLeads.ts`
- `src/hooks/useMoneybird.ts`
- `src/hooks/useNotifications.ts`
- `src/hooks/useProefritTimer.ts`
- `src/hooks/useSettings.ts`
- `src/hooks/useTestDrives.ts`
- `src/hooks/useTimeEntries.ts`
- `src/hooks/useVehicles.ts`
- `src/hooks/useVoorraadFeed.ts`

---

## Lib (allemaal kopiëren)

- `src/lib/aanbetalingPdf.ts`
- `src/lib/aanbetalingsbewijsPdf.ts`
- `src/lib/apkRecheck.ts`
- `src/lib/capitalize.ts`
- `src/lib/consignatieOvereenkomstPdf.ts`
- `src/lib/customerDelete.ts`
- `src/lib/inkoopfactuurPdf.ts`
- `src/lib/inkoopverklaringPdf.ts`
- `src/lib/kenteken.ts`
- `src/lib/koopovereenkomstPdf.ts`
- `src/lib/lease.ts`
- `src/lib/rdw.ts`
- `src/lib/restbetalingsafspraakPdf.ts`
- `src/lib/scanToPdf.ts`
- `src/lib/sendAppointmentConfirmation.ts`
- `src/lib/userSignature.ts`
- `src/lib/utils.ts`
- `src/lib/verkoopWizardValidation.ts`
- `src/lib/vwePhoto.ts`

---

## Types

- `src/types/vehicle.ts`

---

## Shadcn UI (volledige map `src/components/ui/`)

Kopieer de **hele** map `src/components/ui/` 1-op-1. Lijst voor de zekerheid:

accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input-otp, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle-group, toggle, tooltip, use-toast.ts

---

## Admin componenten (volledige map `src/components/admin/`)

Kopieer de **hele** map `src/components/admin/` inclusief subfolders:
- `customers/`
- `detail/`
- `financien/`
- `inkoop/`
- `instellingen/`
- `planning/`
- `proefrit/`
- `verkoop/`

Plus de losse componenten in de root van `src/components/admin/`:
AanbetalingControl, AanbetalingDialog, AanbetalingMoneybirdDialog, AddressAutocomplete, AdminLayout, ConfirmPopover, ConsignatieOvereenkomstDialog, DashboardAfleveringCard, DashboardAppointmentsCard, DashboardLeadSourcesCard, DashboardLopendeVerkopenCard, DateRangePicker, GeboortedatumInputs, GlobalActiveBar, GlobalSearch, GoogleDriveIcon, KentekenInput, MobilePeriodSheet, MobileSidebar, NotificationBell, SearchSelectPopover, ShopifyPeriodSelector, SidebarQuickActions, SlidingTabs, SocialPostDialog, StatusBadge, StopTimerDialog, VehicleDocumentenTab, VehicleFinancieelTab, VehicleFotosTab, VehicleInfoTab, VehicleKostenTab, VehicleSearchSelect, VerkoopDialog.

---

## Pages — Admin (volledige map `src/pages/admin/`)

- AdminAdvertentiesPage.tsx
- AdminArchiefPage.tsx
- AdminBTWPage.tsx
- AdminBlogPage.tsx
- AdminDashboardPage.tsx
- AdminFinancieelPage.tsx
- AdminInkoopPage.tsx
- AdminInstellingenPage.tsx
- AdminKlantDetailPage.tsx
- AdminKlantenPage.tsx
- AdminLeadDetailPage.tsx
- AdminLeadsPage.tsx
- AdminMoneybirdPage.tsx
- AdminPlanningPage.tsx
- AdminProefrittenPage.tsx
- AdminSocialMediaPage.tsx
- AdminVerkoopDetailPage.tsx
- AdminVerkoopWizardPage.tsx
- AdminVerkopenPage.tsx
- AdminVoertuigDetailPage.tsx
- AdminVoertuigNieuwPage.tsx
- AdminVoertuigenPage.tsx

---

## Pages — Standalone (in `src/pages/`, niet admin-map)

Deze worden ook door admin gebruikt:

- `src/pages/AdminLogin.tsx`
- `src/pages/DealAnalyzer.tsx`  *(gebruikt door /admin/deals route)*
- `src/pages/NotFound.tsx`

---

## Niet kopiëren (publieke kant)

Alle andere bestanden in `src/components/`, `src/pages/`, `src/data/`, `public/`, `supabase/functions/`, `supabase/migrations/` zijn **publieke website / backend** en horen NIET in de CRM.
