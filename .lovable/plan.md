# Rustiger homepagina + duidelijkere sitestructuur

Doel: minder drukte, duidelijke hiërarchie. Drie kerndiensten voorop — **Occasions**, **Detailing**, **Financiering**. De rest wordt ondersteunend.

## 1. Menu (Navbar)

Nu: Home, Voorraad, Diensten (dropdown met 6 items), Garantie, Financiering, Over Ons, Contact — 7 items plus dropdown.

Nieuw: 5 items, kern voorop.

```text
Voorraad   Detailing   Financiering   Diensten ▾   Over ons ▾        [Bel ons]
                                      - In- & Verkoop     - Over ons
                                      - Onderhoud         - Garantie
                                      - Customizing       - Contact
                                      - Auto op aanvraag
                                      - Consignatie
```

- Logo blijft de link naar Home (aparte "Home"-link vervalt).
- Detailing en Financiering krijgen een eigen toplevel-plek.
- Overige diensten blijven bereikbaar onder "Diensten"; Garantie/Contact/Over ons onder één groep.
- Mobiel: dezelfde volgorde, uitklapbare groepen zoals nu.

## 2. Homepagina

Nu 9 secties na elkaar (hero, voorraad, detailing, over ons, financiering, garantie, alle diensten, reviews, contact). Dat is de bron van de drukte — vooral de volledige 6-kaarts dienstengrid plus losse detailing-, financierings- en garantiesecties die elkaar overlappen.

Nieuwe volgorde:

```text
1. Hero (ongewijzigd, 1 duidelijke CTA naar voorraad)
2. Voorraad — uitgelichte occasions + "Bekijk alle auto's"
3. Drie kerndiensten — 3 gelijke blokken: Occasions / Detailing / Financiering
4. Financiering — compact blok met rekenvoorbeeld-CTA
5. Detailing — één beeldsterke CTA-sectie (huidige DetailingCTASection, ingekort)
6. Waarom Platin — over ons + garantie/RDW/NAP samengevoegd tot één vertrouwensblok
7. Reviews (max 5, ongewijzigd)
8. Contact + openingstijden
9. Footer (blijft de plek voor alle overige diensten en stadspagina's)
```

Wat verdwijnt van de homepagina:
- De volledige 6-kaarts dienstengrid → vervangen door de 3 kernblokken; volledige lijst leeft op `/diensten` en in de footer.
- De losse garantiesectie → opgenomen in het vertrouwensblok.
- De losse consignatie-strook (staat al in footer/diensten).

Verder: meer witruimte tussen secties, hooguit één primaire CTA per sectie, koppen korter.

## 3. Daarna per pagina

Na akkoord op menu + homepagina pakken we in volgorde: `/voorraad`, `/diensten/auto-detailing`, `/financiering`, daarna de kleinere dienstenpagina's.

## Technisch

- `src/components/Navbar.tsx`: nieuwe link-/dropdownstructuur (desktop + mobiel), geen routewijzigingen nodig.
- `src/pages/Index.tsx`: secties herordenen, `ServicesSection` en `GarantieSection` van de homepagina halen.
- Nieuw `src/components/CoreServicesSection.tsx`: 3 kernblokken.
- `src/components/HomeAboutSection.tsx`: garantie-/vertrouwenselementen toevoegen.
- `src/components/DetailingCTASection.tsx` en `FinancieringSection.tsx`: inkorten, één CTA.
- `ServicesSection` blijft bestaan voor de dienstenpagina; niets wordt verwijderd, alleen anders ingedeeld.
- Design tokens, fonts (Orbitron/DM Sans) en dark industrial stijl blijven ongewijzigd.
