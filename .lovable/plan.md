# Actieknoppen en inruilaanvraag op voertuigdetail

## Nieuwe indeling
- De twee grote knoppen **Bellen** en **WhatsApp** vervangen door:
  1. **Afspraak plannen** — opent de bestaande afspraakflow met de bekeken auto al ingevuld.
  2. **Inruilvoorstel aanvragen** — opent een nieuw, compact formulier.
- Bellen en WhatsApp blijven beschikbaar als kleinere contactlinks onder de hoofdacties.
- Dezelfde indeling toepassen op mobiel en desktop.

## Kort inruilformulier
- Bovenaan tonen voor welke voorraad-auto de klant interesse heeft.
- Alleen vragen om:
  - kenteken van de inruilauto;
  - kilometerstand;
  - gewenste prijs;
  - naam, telefoonnummer en e-mailadres;
  - maximaal zes optionele foto’s.
- Kenteken automatisch netjes opmaken en de bekende voertuiggegevens ophalen, zodat de klant zo min mogelijk hoeft in te vullen.
- Foto’s vóór verzending tonen met mogelijkheid om een verkeerde foto te verwijderen.
- Bestandstype en bestandsgrootte controleren en tijdens verzending duidelijke voortgang tonen.

## Ontvangst en opvolging
- De aanvraag veilig opslaan, inclusief de gekozen voorraad-auto en de foto’s van de inruilauto.
- De aanvraag ook doorsturen naar het gekoppelde leadsysteem met alle gegevens en fotolinks.
- Een e-mailmelding naar Platin Automotive sturen, zodat geen aanvraag wordt gemist.
- Na verzending bevestigen: **“Bedankt. U ontvangt binnen 24 uur een vrijblijvend inruilvoorstel.”**
- Als het externe leadsysteem tijdelijk niet bereikbaar is, blijft de aanvraag opgeslagen en krijgt de klant geen fout door die externe storing.

## Technische details
- Een aparte tabel voor inruilaanvragen gebruiken, met openbare inzending maar alleen inzage voor medewerkers.
- Foto’s in een aparte opslaglocatie bewaren; alleen geschikte afbeeldingsformaten toestaan.
- De bestaande AutoRM-doorsturing en afspraakmodule hergebruiken.
- De actieve detailpagina `/voorraad/:id` aanpassen; de oude ongebruikte detailpagina niet wijzigen.

## Controle
- De twee hoofdacties testen op desktop en mobiel.
- Een afspraak openen en controleren dat de juiste auto is ingevuld.
- Een inruilaanvraag met en zonder foto’s testen.
- Controleren dat de aanvraag opgeslagen is, in AutoRM aankomt en de 24-uursbevestiging zichtbaar is.