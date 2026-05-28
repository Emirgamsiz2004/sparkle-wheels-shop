import CityLandingPage from "./CityLandingPage";

const OccasionsZoetermeer = () => (
  <CityLandingPage
    city="Zoetermeer"
    metaTitle="Occasions Kopen Zoetermeer | Platin Automotive"
    metaDescription="Op zoek naar een occasion vanuit Zoetermeer? Platin Automotive staat op 30 minuten. Familiebedrijf, BOVAG garantie, eerlijk advies."
    canonical="https://platinautomotive.nl/occasions-zoetermeer"
    heading="Occasions kopen vanuit Zoetermeer"
    intro={`Vanuit Zoetermeer rijdt u in ongeveer 30 minuten naar Platin Automotive in Roelofarendsveen. Voor de juiste auto is dat een kleine moeite.\n\nWij zijn een erkend familiebedrijf met een bewust klein, kwalitatief aanbod. Geen grote showroom met honderden auto's — maar een persoonlijke aanpak waarbij u direct met de eigenaar in gesprek gaat. Wij kennen elke auto in ons aanbod van binnen en van buiten.`}
    bulletHeading="Wat u kunt verwachten:"
    bullets={[
      "Goed uitgeruste occasions, geen basismodellen",
      "AutoTrust garantie via BOVAG",
      "Financieringsmogelijkheden via FinancialLease.nl",
      "Inkoop van uw huidige voertuig",
      "Eerlijk advies zonder verkoopdruk",
    ]}
    driveMinutes={25}
    routeDescription="Vanuit Zoetermeer rijdt u in ca. 25 minuten via de N206 en A4 naar Roelofarendsveen. Een vlotte route, grotendeels via de snelweg."
  />
);

export default OccasionsZoetermeer;
