# Platin CRM — Migratie-bundel

Deze map bevat alles wat de agent in **Sleek Dealer Hub** nodig heeft om het admin-gedeelte van **Platin Automotive** (`a07eb15b-5bf0-4dee-a27d-6af2bde03954`) over te zetten naar een **standalone CRM**.

> ⚠️ **Belangrijk**: In het huidige project (Platin Automotive) blijft alles intact. De admin-routes (`/admin/*`) blijven gewoon werken zoals nu. Deze map is alleen een blauwdruk voor het nieuwe project.

---

## 1. Doel

Een aparte CRM-app (Sleek Dealer Hub) die:
- **Dezelfde Supabase-database** gebruikt als Platin Automotive (zodat voorraad/leads/klanten automatisch synchroon zijn).
- **Alleen** admin-functionaliteit bevat — geen publieke website.
- Hetzelfde donkere industriële design behoudt (3px radius, Poppins/DM Sans, silver accents).

---

## 2. Stappen voor de agent in Sleek Dealer Hub

### Stap A — Verbind met dezelfde Supabase-database
1. Activeer **Lovable Cloud** in het nieuwe project.
2. Koppel handmatig aan de bestaande Supabase project ref: **`leykexzdvatuyitkxdxs`**
   - URL: `https://leykexzdvatuyitkxdxs.supabase.co`
   - Anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxleWtleHpkdmF0dXlpdGt4ZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MDQxNTUsImV4cCI6MjA4ODI4MDE1NX0.tKJL97ilFC7drzEQw8Gj6-7IS3ig_52jzLoZEoZO4pw`

> Als Lovable Cloud automatisch een **nieuwe** Supabase aanmaakt, koppel die niet — vraag of de bestaande gekoppeld kan worden, of gebruik environment-variabelen.

### Stap B — Installeer dependencies
Zie `package-deps.json` in deze map. Voeg alle dependencies toe via `bun add`.

### Stap C — Kopieer bestanden vanuit Platin Automotive
Gebruik `cross_project--read_project_file` met `project: "a07eb15b-5bf0-4dee-a27d-6af2bde03954"` voor elk bestand in `FILES_TO_COPY.md`. Kopieer naar exact hetzelfde pad in het nieuwe project.

### Stap D — Vervang App.tsx en main.tsx
Gebruik de versies uit deze map (`App.tsx`, `main.tsx`) — die bevatten alleen de admin-routes.

### Stap E — Vervang index.html
Pas titel/meta aan naar `Platin CRM`. Verwijder Meta Pixel en publieke SEO-tags.

### Stap F — Edge functions
**Niet kopiëren.** Alle edge functions draaien al server-side in dezelfde Supabase en zijn dus automatisch beschikbaar. Het nieuwe project roept ze aan via `supabase.functions.invoke(...)`.

### Stap G — Storage buckets
**Niet aanmaken.** Buckets bestaan al in de gedeelde Supabase (`vehicle-photos`, `vehicle-documents`, `consignatie-fotos`, `test-drive-files`, `signatures`).

### Stap H — Database migraties
**Niet uitvoeren.** Het schema bestaat al. De agent moet `supabase/migrations/` overslaan.

---

## 3. Login & rollen

- Login draait via `/admin/login` → wordt root `/login` in CRM (zie `App.tsx`).
- Gebruikt bestaande `user_roles` tabel + `has_role()` functie.
- Bestaande admin-accounts werken direct.

---

## 4. Wat NIET meekomt (bewust weggelaten)

- Publieke pagina's (`Index`, `Voorraad`, `Blog`, `Contact`, etc.)
- Publieke componenten (`HeroSection`, `Navbar`, `Footer`, `CookieBanner`, etc.)
- City landing pages
- SEO meta-files (`sitemap.xml`, `llms.txt`, `robots.txt`)
- Publieke assets (logo's marktplaats/autoscout/etc.) — alleen `logo.svg` blijft

---

## 5. Branding in CRM

Pas `index.html` aan:
```html
<title>Platin CRM</title>
<meta name="description" content="Interne CRM voor Platin Automotive" />
```

Houd `src/index.css` en `tailwind.config.ts` 1-op-1 hetzelfde — de admin styling werkt dan direct.
