import CityLandingPage from "./CityLandingPage";

const OccasionsDenHaag = () => (
  <CityLandingPage
    city="Den Haag"
    metaTitle="Occasions Kopen Den Haag | Platin Automotive"
    metaDescription="Occasion kopen vanuit Den Haag? Platin Automotive in Roelofarendsveen is 35 minuten rijden. Erkend, BOVAG garantie, persoonlijk contact."
    canonical="https://platinautomotive.nl/occasions-den-haag"
    heading="Occasions kopen vanuit Den Haag"
    intro={`Vanuit Den Haag rijdt u in circa 35 minuten naar Platin Automotive in Roelofarendsveen. Veel klanten uit de regio Den Haag maken die rit bewust — omdat ze op zoek zijn naar een dealer waar ze écht mee kunnen praten.\n\nWij zijn geen anoniem verkoopbedrijf. Platin Automotive is een familiebedrijf, gerund door twee mensen met een oprechte passie voor auto's. Dat betekent persoonlijke aandacht, eerlijk advies en auto's waar we zelf achter staan.`}
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
    routeDescription="Vanuit Den Haag rijdt u in ca. 30 minuten via de A4 richting Amsterdam, afslag Roelofarendsveen. De route is vrijwel volledig snelweg."
  />
);

export default OccasionsDenHaag;
