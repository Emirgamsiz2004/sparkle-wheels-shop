import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Helmet } from "react-helmet-async";

const PrivacyPolicy = () => (
  <>
    <Helmet>
      <title>Privacybeleid | Platin Automotive</title>
      <meta name="description" content="Lees het privacybeleid van Platin Automotive. Wij respecteren uw privacy en gaan zorgvuldig om met uw persoonsgegevens." />
      <link rel="canonical" href="https://platinautomotive.nl/privacybeleid" />
      <meta name="robots" content="index, follow" />
    </Helmet>
    <Navbar />
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8">Privacybeleid</h1>
        <p className="text-xs text-muted-foreground mb-8">Laatst bijgewerkt: {new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</p>

        <div className="prose-legal space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Wie zijn wij?</h2>
            <p>Platin Automotive is gevestigd aan de Cilinderweg 99, 2371 DZ Roelofarendsveen. Voor vragen over dit privacybeleid kunt u contact opnemen via <a href="mailto:info@platinautomotive.nl" className="text-primary hover:underline">info@platinautomotive.nl</a> of telefonisch via 06-12693825.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Welke gegevens verzamelen wij?</h2>
            <p>Wij kunnen de volgende persoonsgegevens verzamelen en verwerken:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Voor- en achternaam</li>
              <li>E-mailadres</li>
              <li>Telefoonnummer</li>
              <li>Gegevens over uw voertuig (kenteken, merk, model)</li>
              <li>IP-adres en browserinformatie (via cookies)</li>
              <li>Communicatiegeschiedenis (berichten, e-mails)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Waarom verzamelen wij deze gegevens?</h2>
            <p>Wij verwerken uw persoonsgegevens voor de volgende doeleinden:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Het afhandelen van uw aan- of verkoop van een voertuig</li>
              <li>Het beantwoorden van uw vragen en verzoeken</li>
              <li>Het versturen van relevante informatie over uw voertuig of onze diensten</li>
              <li>Het voldoen aan wettelijke verplichtingen (bijv. belastingwetgeving)</li>
              <li>Het verbeteren van onze website en dienstverlening</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Rechtsgrond</h2>
            <p>Wij verwerken uw gegevens op basis van:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-foreground">Uitvoering van een overeenkomst</strong> — wanneer u een voertuig koopt of verkoopt</li>
              <li><strong className="text-foreground">Gerechtvaardigd belang</strong> — voor klantenservice en verbetering van onze diensten</li>
              <li><strong className="text-foreground">Toestemming</strong> — voor het plaatsen van niet-essentiële cookies</li>
              <li><strong className="text-foreground">Wettelijke verplichting</strong> — voor fiscale en administratieve doeleinden</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Bewaartermijn</h2>
            <p>Wij bewaren uw persoonsgegevens niet langer dan noodzakelijk voor de doeleinden waarvoor ze zijn verzameld. Voor fiscale gegevens geldt een wettelijke bewaartermijn van 7 jaar. Overige gegevens worden na 2 jaar verwijderd na het laatste contactmoment.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Delen met derden</h2>
            <p>Wij delen uw gegevens alleen met derden wanneer dit noodzakelijk is voor onze dienstverlening:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>RDW — voor kentekenregistratie</li>
              <li>Boekhoudsoftware — voor facturatie</li>
              <li>Hostingproviders — voor het functioneren van de website</li>
            </ul>
            <p className="mt-2">Wij verkopen uw gegevens nooit aan derden.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Uw rechten</h2>
            <p>Op grond van de AVG heeft u de volgende rechten:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-foreground">Inzage</strong> — u kunt opvragen welke gegevens wij van u verwerken</li>
              <li><strong className="text-foreground">Rectificatie</strong> — u kunt onjuiste gegevens laten corrigeren</li>
              <li><strong className="text-foreground">Verwijdering</strong> — u kunt verzoeken uw gegevens te verwijderen</li>
              <li><strong className="text-foreground">Beperking</strong> — u kunt de verwerking laten beperken</li>
              <li><strong className="text-foreground">Overdraagbaarheid</strong> — u kunt uw gegevens opvragen in een gangbaar formaat</li>
              <li><strong className="text-foreground">Bezwaar</strong> — u kunt bezwaar maken tegen de verwerking</li>
            </ul>
            <p className="mt-2">U kunt uw verzoek richten aan <a href="mailto:info@platinautomotive.nl" className="text-primary hover:underline">info@platinautomotive.nl</a>. Wij reageren binnen 30 dagen.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Beveiliging</h2>
            <p>Wij nemen passende technische en organisatorische maatregelen om uw persoonsgegevens te beschermen tegen verlies, misbruik en ongeautoriseerde toegang. Onze website maakt gebruik van SSL-encryptie.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Klachten</h2>
            <p>Heeft u een klacht over de verwerking van uw persoonsgegevens? Neem dan eerst contact met ons op. U heeft ook het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens via <a href="https://www.autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">autoriteitpersoonsgegevens.nl</a>.</p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
  </>
);

export default PrivacyPolicy;
