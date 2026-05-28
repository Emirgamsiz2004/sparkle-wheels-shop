import CityLandingPage from "./CityLandingPage";

const OccasionsAlphen = () => (
  <CityLandingPage
    city="Alphen aan den Rijn"
    metaTitle="Garage & Occasions bij Alphen aan den Rijn | Platin Automotive"
    metaDescription="Op zoek naar een betrouwbare garage of occasion in de buurt van Alphen aan den Rijn? Platin Automotive in Roelofarendsveen is slechts 10 minuten rijden. Auto detailing, onderhoud, reparatie en occasions."
    canonical="https://platinautomotive.nl/occasions-alphen-aan-den-rijn"
    heading="Garage & Occasions bij Alphen aan den Rijn"
    intro={`Bent u op zoek naar een kwalitatieve occasion in de omgeving van Alphen aan den Rijn? Platin Automotive in Roelofarendsveen ligt op slechts 10 minuten rijden — een kleine omweg voor een grote zekerheid.\n\nWij zijn een erkend familiebedrijf gespecialiseerd in goed uitgeruste occasions, auto detailing en onderhoud. Geen instapmodellen, maar auto's met een mooie specificatie waar u trots op rijdt. Elke auto in ons aanbod is bewust geselecteerd — wij verkopen alleen auto's die we zelf ook zouden kopen.`}
    bulletHeading="Waarom klanten uit Alphen aan den Rijn bij ons kopen:"
    bullets={[
      "Officiële AutoTrust garantie via BOVAG",
      "Financiering mogelijk via FinancialLease.nl",
      "Persoonlijk contact, direct met de eigenaar",
      "Inkoop van uw huidige auto mogelijk",
      "Altijd welkom zonder afspraak",
    ]}
    outro="Roelofarendsveen ligt direct aan de N11 vanuit Alphen aan den Rijn. U bent er zo."
    driveMinutes={10}
    routeDescription="Vanuit Alphen aan den Rijn centrum rijdt u via de N11 richting Roelofarendsveen. Na circa 10 minuten vindt u ons op Cilinderweg 99, 2371 DZ Roelofarendsveen. Gratis parkeren voor de deur."
    detailingSection={{
      title: "Auto detailing bij Alphen aan den Rijn",
      text: `Op zoek naar een professionele poetsbeurt of detailing bij Alphen aan den Rijn? Platin Automotive zit op slechts 10 minuten rijden in Roelofarendsveen.

Wij bieden handwas, foamwash, interieur dieptereiniging, polijsten en lakbescherming. Zowel voor particulieren als bedrijfswagens.`,
    }}
    onderhoudSection={{
      title: "Onderhoud & reparatie bij Alphen aan den Rijn",
      text: `Zoek je een betrouwbare garage in de buurt van Alphen aan den Rijn? Wij verzorgen olieverversing, remmen, banden, airco-service en algemene reparaties voor alle merken.

RDW-erkend, eerlijke prijzen en geen verrassingen achteraf.`,
    }}
    occasionsSection={{
      title: "Occasions kopen bij Alphen aan den Rijn",
      text: `Wij zijn dé occasiondealer voor klanten uit Alphen aan den Rijn en omgeving. Persoonlijk advies, AutoTrust garantie en financiering mogelijk.

Op slechts 10 minuten via de N11.`,
    }}
    appointmentSection={{
      title: "Maak een afspraak",
      text: `Bel of WhatsApp ons op 071-781 25 25 of maak direct online een afspraak.`,
    }}
  />
);

export default OccasionsAlphen;
