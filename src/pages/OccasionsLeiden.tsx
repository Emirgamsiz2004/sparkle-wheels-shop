import CityLandingPage from "./CityLandingPage";

const OccasionsLeiden = () => (
  <CityLandingPage
    city="Leiden"
    metaTitle="Garage & Occasions bij Leiden | Platin Automotive"
    metaDescription="Op zoek naar een garage, auto detailing of occasion bij Leiden? Platin Automotive in Roelofarendsveen is slechts 15 minuten rijden. RDW-erkend, persoonlijke service."
    canonical="https://platinautomotive.nl/occasions-leiden"
    heading="Garage & Occasions bij Leiden"
    intro={`Vanuit Leiden bent u in slechts 15 minuten bij Platin Automotive in Roelofarendsveen. Een korte rit die het waard is — want wij bieden iets wat je in de stad zelden vindt: een klein, erkend familiebedrijf waar u direct met de eigenaar praat.

Ons aanbod bestaat uit nieuwere, goed uitgeruste occasions. Auto's met uitstraling, met opties, in goede staat. We selecteren bewust — liever tien goede auto's dan een grote parkeerplaats vol middelmatige.`}
    bulletHeading="Wat wij bieden voor klanten uit Leiden:"
    bullets={[
      "RDW-erkend autobedrijf",
      "AutoTrust garantiepakketten (BOVAG)",
      "Financiering via FinancialLease.nl",
      "Auto inkoop — ook als u uw huidige auto wilt verkopen",
      "Onderhoud en reparaties",
    ]}
    outro="Kom gerust langs tijdens onze openingstijden. Wilt u een specifieke auto bekijken? Laat het ons even weten zodat we hem voor u klaar zetten."
    driveMinutes={15}
    routeDescription="Vanuit Leiden rijdt u via de N11 richting Alphen aan den Rijn, afslag Roelofarendsveen. Totale rijduur circa 15 minuten. U vindt ons op Cilinderweg 99 — gratis parkeren aanwezig."
    detailingSection={{
      title: "Auto detailing bij Leiden",
      text: `Woon je in Leiden en wil je je auto professioneel laten poetsen of polijsten? Platin Automotive is op 15 minuten rijden van Leiden.

Van een grondige handwas tot volledige lakbescherming — wij behandelen je auto als de onze.`,
    }}
    onderhoudSection={{
      title: "Onderhoud & reparatie bij Leiden",
      text: `Een betrouwbare garage bij Leiden is dichterbij dan je denkt. In Roelofarendsveen, op 15 minuten van Leiden, verzorgen wij onderhoud en reparaties voor alle merken.

RDW-erkend, transparante prijzen.`,
    }}
    occasionsSection={{
      title: "Occasions kopen bij Leiden",
      text: `Klanten uit Leiden en omgeving zijn van harte welkom bij Platin Automotive. Nieuwere, goed uitgeruste occasions met garantie en financieringsmogelijkheden.

Op slechts 15 minuten via de N11.`,
    }}
    appointmentSection={{
      title: "Maak een afspraak",
      text: `Bel of WhatsApp ons op 071-781 25 25 of boek direct online.`,
    }}
  />
);

export default OccasionsLeiden;
