
# Plan: Afspraak-flow vereenvoudigen + detailingpagina strakker

## 1. Bezichtiging & proefrit samenvoegen (`src/pages/Afspraak.tsx`)

Nieuw type: één optie **"Bezichtiging & proefrit"** (`bezichtiging_proefrit`). Deze vervangt de twee losse tegels bovenaan stap 1. Tijdens de afspraak zelf bepalen of er ook echt gereden wordt — dat maakt voor de planning niets uit.

- `TYPE_LABELS`: label = "Bezichtiging & proefrit".
- Backend: waarde blijft opgeslagen als `bezichtiging` (zelfde slot-/agenda-logica, geen migratie nodig; alle bestaande admin-filters blijven werken).
- Stap 1 toont dus nog maar één "Direct bevestigd"-kaart + de drie service-kaarten eronder.

## 2. Voertuigkeuze vervangen door vrij invulveld

Stap 2 (nu: lijst uit `vehicles`-tabel) wordt vervangen door een klein formulier:

- **Auto (merk + model)** — verplicht, vrij tekstveld met suggesties uit onze voorraad terwijl je typt (autocomplete, maar niet-verplicht kiezen).
- **Kleur** — optioneel.
- **Kenteken** — optioneel.

Effect: klanten hoeven de auto niet meer uit een lijst te herkennen; ze schrijven gewoon wat ze komen bekijken. Bij het kiezen van een suggestie koppelen we alsnog `vehicle_id` (zodat de admin ziet welk voertuig), anders slaan we de vrije tekst op in `notities` / `aanvraag_omschrijving`.

- Slot-blokkade op vehicle_id vervalt als er geen match is; anders blijft die werken.
- `appointments.insert` krijgt `vehicle_id` alleen als er een match is; anders `null` + de vrije tekst in `notities` (`"Auto: {merk_model} · Kleur: {kleur} · Kenteken: {kenteken}"`).

Stap 3 (datum/tijd) en stap 4 (gegevens) blijven identiek. Totaal stappen blijft 4.

## 3. Detailingpagina strakker (`src/pages/AutoDetailing.tsx` + `DetailingConfigurator.tsx`)

Doel: klanten zien direct wat er is en kunnen zonder scrollmoeras boeken.

- **Boven** de configurator een compacte "prijskaart-strip": 4 tegels (Reiniging / Premium / Signature / Coating) met vanaf-prijs en één regel omschrijving, elk met een "Kies" knop die direct de juiste tab + pakket voorselecteert in de configurator eronder.
- **Configurator zelf**: 
  - Tabs blijven, maar met korte ondertitels ("Reiniging" / "Polijsten" / "Coating" — geen jargon).
  - Per pakket alleen top-3 highlights zichtbaar; overige features achter "Toon alles" (details-toggle) zodat de kaarten korter en scanbaarder worden.
  - Sticky boekbalk onderaan blijft, maar krijgt tekst "Direct boeken — {pakket} · vanaf €X" i.p.v. alleen prijs.
- Behandelingen-grid (`behandelingen` array) wordt ingekort naar 3 items ipv 5 en verplaatst onder de configurator (context, niet keuzestress).

## Technisch

- `Afspraak.tsx`: nieuwe `flowAOptions` met 1 item; typedef `FlowAType = "bezichtiging_proefrit"`; mapping bij insert naar `type: "bezichtiging"`. Stap 2 rewriten (verwijder vehicle-lijst render + `vehicles` query behouden alléén voor autocomplete-suggesties).
- `DetailingConfigurator.tsx`: voeg `expanded` state per pakket toe, splits features in `primary` (max 3) + `rest`.
- `AutoDetailing.tsx`: nieuwe `<QuickPicks />` sectie boven `<DetailingConfigurator />`, klik zet URL-hash zoals `#configurator?tab=coating&pkg=signature` — configurator leest deze bij mount.

## Wat er niet verandert

- Admin-agenda, appointment-tabel, e-mailtemplates, WhatsApp-flow: allemaal ongewijzigd.
- Prijzen en pakketinhoud van detailing blijven zoals nu.
