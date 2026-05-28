import CityLandingPage from "./CityLandingPage";

const OccasionsZoetermeer = () => (
  <CityLandingPage
    city="Zoetermeer"
    metaTitle="Garage & Occasions bij Zoetermeer | Platin Automotive"
    metaDescription="Op zoek naar een garage, auto detailing of occasion vanuit Zoetermeer? Platin Automotive in Roelofarendsveen is op 25 minuten. Familiebedrijf, BOVAG garantie, eerlijk advies."
    canonical="https://platinautomotive.nl/occasions-zoetermeer"
    heading="Garage & Occasions bij Zoetermeer"
    intro={`Vanuit Zoetermeer rijdt u in ongeveer 25 minuten naar Platin Automotive in Roelofarendsveen. Voor de juiste auto is dat een kleine moeite.

Wij zijn een erkend familiebedrijf met een bewust klein, kwalitatief aanbod. Geen grote showroom met honderden auto's — maar een persoonlijke aanpak waarbij u direct met de eigenaar in gesprek gaat. Wij kennen elke auto in ons aanbod van binnen en van buiten.`}
    bulletHeading="Wat u kunt verwachten:"
    bullets={[
      "Goed uitgeruste occasions, geen basismodellen",
      "AutoTrust garantie via BOVAG",
      "Financieringsmogelijkheden via FinancialLease.nl",
      "Inkoop van uw huidige voertuig",
      "Eerlijk advies zonder verkoopdruk",
    ]}
    driveMinutes={25}
    routeDescription="Vanuit Zoetermeer rijdt u via de N209 en N11 naar Roelofarendsveen. Circa 25 minuten rijden. Adres: Cilinderweg 99, 2371 DZ Roelofarendsveen."
    detailingSection={{
      title: "Auto detailing bij Zoetermeer",
      text: `Vanuit Zoetermeer ben je op 25 minuten bij Platin Automotive in Roelofarendsveen. Professionele autodetailing, polijsten en lakbescherming voor elk voertuig.

De rit is het waard.`,
    }}
    onderhoudSection={{
      title: "Onderhoud & reparatie bij Zoetermeer",
      text: `Op zoek naar een eerlijke garage bij Zoetermeer? Wij bieden onderhoud en reparaties voor alle merken, RDW-erkend en zonder verborgen kosten.

Op 25 minuten van Zoetermeer via de N209.`,
    }}
    occasionsSection={{
      title: "Occasions kopen bij Zoetermeer",
      text: `Vanuit Zoetermeer bedienen wij regelmatig klanten die op zoek zijn naar een betrouwbare occasion met garantie. Kom langs voor een proefrit — wij staan altijd voor je klaar.

Nieuwere, goed uitgeruste occasions met AutoTrust garantie en financieringsmogelijkheden.`,
    }}
    appointmentSection={{
      title: "Maak een afspraak",
      text: `Bel of WhatsApp 071-781 25 25 of maak online een afspraak.`,
    }}
  />
);

export default OccasionsZoetermeer;
