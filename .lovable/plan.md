# Voorraad toont geen auto's

## Wat er aan de hand is

De voorraadpagina haalt de auto's op bij de externe occasionfeed (autodealers.nl). Die feed geeft op dit moment een lege pagina terug aan onze server, waardoor er nul actuele auto's binnenkomen. Wat je nog wel ziet zijn alleen de verkochte auto's, die uit onze eigen database komen.

Getest en bevestigd:
- De feed opgehaald met een normale browser-identificatie: 14 auto's.
- Dezelfde feed opgehaald zonder browser-identificatie (zoals onze serverfunctie nu doet): 0 auto's, wel een 200-respons.
- De backendfunctie levert daardoor 45 items terug, allemaal met status "verkocht", en 0 beschikbare auto's.

De leverancier blokkeert dus stilzwijgend verzoeken zonder herkenbare browser-identificatie.

## Oplossing

1. In de voorraad-backendfunctie bij elk verzoek naar de externe feed (zowel de lijst als de detailpagina's) een normale browser-`User-Agent` en `Accept`-header meesturen.
2. Een veiligheidscheck toevoegen: als de feed 0 auto's teruggeeft terwijl er wel een geldige respons was, wordt dat als fout gelogd en worden de bestaande statussen niet als "leeg" doorgezet — zo verdwijnt de voorraad niet meer stil.
3. Daarna controleren dat /voorraad weer de beschikbare auto's toont naast het blok "Onlangs verkocht".

## Technisch

- Bestand: `supabase/functions/fetch-voorraad/index.ts` — `fetchList()` en `fetchDetail()` krijgen headers mee (`User-Agent: Mozilla/5.0 ...`, `Accept: text/html`).
- Extra logging bij 0 geparste blokken, zodat een toekomstige blokkade direct zichtbaar is in de functielogs.
- Geen frontendwijzigingen nodig; `useVoorraadFeed`, `Voorraad.tsx` en `InventorySection.tsx` blijven ongewijzigd.
