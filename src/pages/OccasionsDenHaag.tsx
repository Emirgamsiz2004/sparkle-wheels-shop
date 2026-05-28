import CityLandingPage from "./CityLandingPage";

const OccasionsDenHaag = () => (
  <CityLandingPage
    city="Den Haag"
    metaTitle="Garage & Occasions bij Den Haag | Platin Automotive"
    metaDescription="Op zoek naar een garage, auto detailing of occasion bij Den Haag? Platin Automotive in Roelofarendsveen is op 30 minuten rijden. RDW-erkend, persoonlijke service."
    canonical="https://platinautomotive.nl/occasions-den-haag"
    heading="Garage & Occasions bij Den Haag"
    intro={`Vanuit Den Haag rijdt u in circa 30 minuten naar Platin Automotive in Roelofarendsveen. Veel klanten uit de regio Den Haag maken die rit bewust — omdat ze op zoek zijn naar een dealer waar ze écht mee kunnen praten.

Wij zijn geen anoniem verkoopbedrijf. Platin Automotive is een familiebedrijf, gerund door twee mensen met een oprechte passie voor auto's. Dat betekent persoonlijke aandacht, eerlijk advies en auto's waar we zelf achter staan.`}
    bulletHeading="Waarom de rit waard:"
    bullets={[
      "Erkend autobedrijf met RDW-erkenning",
      "Officiële AutoTrust garantie (BOVAG dochteronderneming)",
      "Financiering via FinancialLease.nl",
      "Inkoop van uw huidige auto",
      "Geen verkoopdruk — u beslist zelf",
    ]}
    outro="Wilt u een auto komen bekijken? Laat het ons even weten dan staat hij klaar voor u."
    driveMinutes={30}
    routeDescription="Vanuit Den Haag rijdt u via de A4 en N11 naar Roelofarendsveen, circa 30 minuten. Adres: Cilinderweg 99, 2371 DZ Roelofarendsveen."
    detailingSection={{
      title: "Auto detailing bij Den Haag",
      text: `Vanuit Den Haag is Platin Automotive op 30 minuten bereikbaar.

Voor een professionele poetsbeurt, polijstbeurt of lakbescherming rijden klanten uit Den Haag en omgeving graag naar ons toe in Roelofarendsveen.`,
    }}
    onderhoudSection={{
      title: "Onderhoud & reparatie bij Den Haag",
      text: `Een eerlijke garage bij Den Haag? Wij verzorgen onderhoud en reparaties voor alle merken op 30 minuten van Den Haag.

RDW-erkend, vaste prijzen, persoonlijk contact met de eigenaar.`,
    }}
    occasionsSection={{
      title: "Occasions kopen bij Den Haag",
      text: `Platin Automotive levert occasions aan klanten uit heel de regio, inclusief Den Haag.

Thuisbezorging op aanvraag mogelijk. Garantie en financiering altijd bespreekbaar.`,
    }}
    appointmentSection={{
      title: "Maak een afspraak",
      text: `Bel of WhatsApp 071-781 25 25 of boek direct online via onze website.`,
    }}
  />
);

export default OccasionsDenHaag;
