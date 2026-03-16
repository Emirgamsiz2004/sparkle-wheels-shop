import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Helmet } from "react-helmet-async";

const AlgemeneVoorwaarden = () => (
  <>
    <Helmet>
      <title>Algemene Voorwaarden | Platin Automotive</title>
      <meta name="description" content="Lees de algemene voorwaarden van Platin Automotive voor de aan- en verkoop van voertuigen." />
    </Helmet>
    <Navbar />
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8">Algemene Voorwaarden</h1>
        <p className="text-xs text-muted-foreground mb-8">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Artikel 1 — Definities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Platin Automotive:</strong> de eenmanszaak gevestigd aan de Cilinderweg 99, 2371 DZ Roelofarendsveen.</li>
              <li><strong className="text-foreground">Koper:</strong> de natuurlijke of rechtspersoon die een koopovereenkomst met Platin Automotive aangaat.</li>
              <li><strong className="text-foreground">Voertuig:</strong> het motorvoertuig dat onderwerp is van de overeenkomst.</li>
              <li><strong className="text-foreground">Consignatie:</strong> het in bewaring geven van een voertuig aan Platin Automotive met als doel verkoop namens de eigenaar.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Artikel 2 — Toepasselijkheid</h2>
            <p>Deze algemene voorwaarden zijn van toepassing op alle aanbiedingen, overeenkomsten en leveringen van Platin Automotive. Afwijkingen zijn alleen geldig indien schriftelijk overeengekomen.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Artikel 3 — Aanbiedingen en prijzen</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Alle prijzen op de website en in advertenties zijn onder voorbehoud van tussentijdse wijzigingen en typefouten.</li>
              <li>Een aanbieding is vrijblijvend totdat een schriftelijke koopovereenkomst is ondertekend.</li>
              <li>Prijzen zijn inclusief BTW tenzij anders vermeld (margeregeling).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Artikel 4 — Koopovereenkomst</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>De koopovereenkomst komt tot stand na ondertekening door beide partijen.</li>
              <li>Bij aankoop ontvangt de koper een schriftelijke koopovereenkomst met daarin de voertuiggegevens, prijs en eventuele afspraken.</li>
              <li>Het voertuig wordt geleverd in de staat waarin het zich bevindt op het moment van verkoop, tenzij schriftelijk anders overeengekomen.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Artikel 5 — Betaling</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Betaling geschiedt vóór of bij levering van het voertuig, tenzij schriftelijk anders overeengekomen.</li>
              <li>Betaling kan plaatsvinden per bankoverschrijving of contant (met inachtneming van wettelijke limieten).</li>
              <li>Bij niet-tijdige betaling behoudt Platin Automotive zich het recht voor de overeenkomst te ontbinden.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Artikel 6 — Levering en risico</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Het risico gaat over op de koper bij aflevering van het voertuig.</li>
              <li>Levering vindt plaats op de vestiging van Platin Automotive, tenzij anders overeengekomen.</li>
              <li>De koper is verantwoordelijk voor het afsluiten van een geldige verzekering vóór het ophalen van het voertuig.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Artikel 7 — Garantie</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Op gebruikte voertuigen wordt geen standaard garantie gegeven, tenzij schriftelijk anders overeengekomen.</li>
              <li>Eventuele garantieafspraken worden vastgelegd in de koopovereenkomst.</li>
              <li>Garantie geldt niet voor slijtageonderdelen, onjuist gebruik of wijzigingen aangebracht door derden.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Artikel 8 — Consignatie</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Bij consignatieverkoop blijft het voertuig eigendom van de consignatiegever totdat het is verkocht.</li>
              <li>Platin Automotive stelt in overleg een vraagprijs vast en spant zich in het voertuig te verkopen.</li>
              <li>Bij verkoop ontvangt de consignatiegever het overeengekomen bedrag minus de afgesproken commissie.</li>
              <li>De consignatiegever garandeert dat het voertuig vrij is van schulden, beslagen en financieringen.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Artikel 9 — Aansprakelijkheid</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Platin Automotive is niet aansprakelijk voor schade die na levering ontstaat door gebruik, slijtage of gebreken die niet bij levering bekend waren.</li>
              <li>De aansprakelijkheid is in alle gevallen beperkt tot het factuurbedrag van het betreffende voertuig.</li>
              <li>Platin Automotive is niet aansprakelijk voor gevolgschade.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Artikel 10 — Klachten</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Klachten dienen binnen 3 werkdagen na ontdekking schriftelijk te worden gemeld aan Platin Automotive.</li>
              <li>Wij streven ernaar klachten binnen 14 dagen te behandelen.</li>
              <li>Het indienen van een klacht schort de betalingsverplichting niet op.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Artikel 11 — Toepasselijk recht</h2>
            <p>Op alle overeenkomsten is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in het arrondissement Den Haag.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Artikel 12 — Contact</h2>
            <p>
              Platin Automotive<br />
              Cilinderweg 99, 2371 DZ Roelofarendsveen<br />
              E-mail: <a href="mailto:info@platinautomotive.nl" className="text-primary hover:underline">info@platinautomotive.nl</a><br />
              Telefoon: 06-12693825
            </p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
  </>
);

export default AlgemeneVoorwaarden;
