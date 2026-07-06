import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, FileCheck, Eye, Handshake, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceSEOContent from "@/components/ServiceSEOContent";
import verkoopImg from "@/assets/verkoop.jpg";

const usps = [
  {
    icon: ShieldCheck,
    title: "Gecontroleerd & Rijklaar",
    description: "Elke auto wordt grondig geïnspecteerd en rijklaar afgeleverd. Geen verrassingen achteraf.",
  },
  {
    icon: FileCheck,
    title: "NAP & RDW Gecontroleerd",
    description: "Alle voertuigen worden gecheckt op tellerstanden en registratie. Volledige transparantie gegarandeerd.",
  },
  {
    icon: Eye,
    title: "Eerlijke Prijzen",
    description: "Geen verborgen kosten of trucs. De prijs die u ziet is de prijs die u betaalt.",
  },
  {
    icon: Handshake,
    title: "Persoonlijk Advies",
    description: "Geen verkooppraatjes maar oprecht advies. Wij helpen u de juiste auto te vinden voor uw situatie.",
  },
];

const InEnVerkoop = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Auto Inkopen & Verkopen Roelofarendsveen | Platin Automotive</title>
        <meta name="description" content="Platin Automotive koopt en verkoopt auto's in Roelofarendsveen. Eerlijke inruilprijs, snelle afhandeling. Verkoop je auto vandaag – gratis waardebepaling!" />
        <link rel="canonical" href="https://platinautomotive.nl/diensten/in-en-verkoop" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Auto Inkopen & Verkopen Roelofarendsveen | Platin Automotive" />
        <meta property="og:description" content="Platin Automotive koopt en verkoopt auto's in Roelofarendsveen. Eerlijke inruilprijs, snelle afhandeling. Verkoop je auto vandaag – gratis waardebepaling!" />
        <meta property="og:url" content="https://platinautomotive.nl/diensten/in-en-verkoop" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Auto Inkopen & Verkopen Roelofarendsveen | Platin Automotive" />
        <meta name="twitter:description" content="Platin Automotive koopt en verkoopt auto's in Roelofarendsveen. Eerlijke inruilprijs, snelle afhandeling. Verkoop je auto vandaag – gratis waardebepaling!" />

      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${verkoopImg})` }}
        >
          <div className="absolute inset-0 bg-background/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col justify-end h-full container mx-auto px-6 lg:px-16 pb-12 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              Terug naar home
            </Link>
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Diensten
            </p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
              In- & Verkoop
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-16 md:py-28 bg-card">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-6 leading-tight">
                Betrouwbare occasions
                <br />
                voor eerlijke prijzen.
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Bij Platin Automotive draait alles om kwaliteit en vertrouwen. 
                  Wij selecteren onze auto's zorgvuldig en bieden alleen voertuigen aan 
                  waar we volledig achter staan. Geen auto's met verborgen gebreken — 
                  elke auto is gecontroleerd, eerlijk geprijsd en rijklaar.
                </p>
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Of u nu op zoek bent naar uw eerste auto of een betrouwbare gezinsauto, 
                  wij denken graag met u mee. Persoonlijk, eerlijk en zonder druk.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-4"
            >
              <p className="text-muted-foreground font-body font-light leading-relaxed">
                Wilt u uw huidige auto verkopen? Ook dat kan bij ons. Wij bieden een 
                eerlijke prijs en regelen de volledige afhandeling. Snel, transparant 
                en zonder gedoe.
              </p>
              <p className="text-muted-foreground font-body font-light leading-relaxed">
                Bent u benieuwd naar ons aanbod? Bekijk onze voorraad online of 
                kom langs in onze showroom aan de Cilinderweg 99 in Roelofarendsveen. 
                We ontvangen u graag voor een vrijblijvend gesprek of proefrit.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="py-16 md:py-28 bg-background">
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12 md:mb-16"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Waarom Platin
            </p>
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight">
              Waar wij voor staan
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {usps.map((usp, i) => (
              <motion.div
                key={usp.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="bg-card p-6 md:p-8 group"
              >
                <usp.icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground mb-5 transition-colors duration-300" />
                <h3 className="text-sm font-display font-semibold text-foreground mb-2">
                  {usp.title}
                </h3>
                <p className="text-xs font-body font-light text-muted-foreground leading-relaxed">
                  {usp.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showroom CTA */}
      <section className="py-16 md:py-28 bg-card">
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="grid lg:grid-cols-2 gap-px bg-border"
          >
            <div className="bg-background p-8 md:p-12 flex flex-col justify-center">
              <MapPin className="w-5 h-5 text-muted-foreground mb-5" />
              <h3 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-4 leading-tight">
                Bezoek onze
                <br />
                showroom.
              </h3>
              <p className="text-muted-foreground font-body font-light leading-relaxed mb-8 max-w-md">
                Kom vrijblijvend langs en bekijk onze auto's in het echt. 
                Wij nemen de tijd voor u en beantwoorden al uw vragen. 
                Een proefrit? Dat regelen we ter plekke.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/voorraad"
                  className="group inline-flex items-center gap-3 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-foreground/90 transition-all duration-300"
                >
                  Bekijk Voorraad
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/contact"
                  className="group inline-flex items-center gap-3 border border-foreground/20 hover:border-foreground/50 text-foreground px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-300"
                >
                  Plan Een Bezoek
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="bg-background p-8 md:p-12">
              <div className="space-y-0">
                {[
                  { label: "Adres", value: "Cilinderweg 99, 2371 DZ Roelofarendsveen" },
                  { label: "Telefoon", value: "071-781 25 25" },
                  { label: "E-mail", value: "info@platinautomotive.nl" },
                  { label: "Maandag", value: "09:00 - 18:00" },
                  { label: "Di t/m Vr", value: "09:00 - 18:00" },
                  { label: "Zaterdag", value: "10:00 - 17:00" },
                  { label: "Zondag", value: "12:00 - 16:00" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
                    <span className="text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-body text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <ServiceSEOContent
        sections={[
          {
            heading: "Auto in- en verkoop in Roelofarendsveen",
            paragraphs: [
              "Platin Automotive is een RDW erkend autobedrijf gespecialiseerd in de in- en verkoop van premium occasions in Roelofarendsveen. Wij selecteren onze auto's persoonlijk, hebben elke auto zelf onder handen gehad en leveren standaard rijklaar af met beurt, schone in- en exterieur, AutoTrust garantie en nieuwe set sleutels indien beschikbaar. Geen tussenhandel, geen tweede levens — alleen auto's waar wij zelf in zouden rijden.",
              "Onze klanten komen uit heel de Randstad: Alphen aan den Rijn, Leiden, Leiderdorp, Hoofddorp, Nieuwkoop, Lisse, Zoetermeer, Den Haag, Amsterdam-Zuid en verder. Dankzij onze ligging direct aan de N446 zijn wij snel bereikbaar en bieden wij gratis parkeren voor de deur.",
            ],
          },
          {
            heading: "Uw auto verkopen aan Platin Automotive",
            paragraphs: [
              "Wilt u uw auto verkopen zonder gedoe? Wij kopen dagelijks auto's in van particulieren, ondernemers en collega-bedrijven. U krijgt een eerlijk taxatievoorstel op basis van actuele marktwaarde, RDW-data, kilometerstand, onderhoudshistorie en de algemene staat. Bij akkoord regelen wij direct de RDW vrijwaring, betalen wij contant of per bank en u rijdt zorgeloos naar huis.",
              "Heeft u nog een lopende financiering of leaseovereenkomst? Wij lossen die voor u af. Ook auto's met schade, hoge kilometerstand of import zijn welkom — wij doen altijd een eerlijk bod. Vraag een vrijblijvende taxatie aan via WhatsApp, telefoon of het formulier op deze website.",
            ],
          },
          {
            heading: "Premium occasions met garantie",
            paragraphs: [
              "In onze voorraad vindt u zorgvuldig geselecteerde occasions van merken als Audi, BMW, Mercedes-Benz, Volkswagen, Volvo, Land Rover, Porsche, Tesla en Lexus. Wij richten ons bewust op auto's met een rijke uitrusting, lage tot gemiddelde kilometerstand en een complete onderhoudshistorie. Elke auto wordt door onze monteurs gecontroleerd op 60+ punten voordat hij in de verkoop gaat.",
              "Standaard krijgt u 6 maanden AutoTrust garantie, optioneel uitbreidbaar tot 12 of 24 maanden. AutoTrust is een onafhankelijke garantieverstrekker met landelijke dekking — u kunt dus ook bij een garage bij u in de buurt terecht voor service onder garantie.",
            ],
          },
          {
            heading: "Inruil mogelijk — eerlijk en snel",
            paragraphs: [
              "Bij de aankoop van een auto bij Platin Automotive kunt u uw huidige auto inruilen. Wij waarderen uw inruilauto realistisch op basis van actuele marktdata en de staat van de auto. Hierdoor ontvangt u een eerlijke inruilwaarde en bespaart u tijd en moeite die u anders kwijt zou zijn aan particuliere verkoop.",
              "Heeft u een auto met restschuld? Geen probleem — wij regelen de aflossing en verrekenen dit transparant in de aankoopsom van uw nieuwe auto.",
            ],
          },
          {
            heading: "Financiering en private lease",
            paragraphs: [
              "Naast contante aankoop bieden wij verschillende financieringsoplossingen aan via gerenommeerde partners. Of u nu kiest voor een traditioneel autokrediet, een doorlopend krediet of private lease — wij helpen u bij het vinden van de beste vorm met de scherpste rente. De aanvraag verloopt snel en u krijgt vaak binnen één werkdag uitsluitsel.",
              "Voor zakelijke klanten regelen wij financial lease en operational lease. Profiteer van fiscale voordelen, vrij rijden en een vast maandbedrag. Vraag vrijblijvend een berekening aan via onze lease-calculator of bel ons direct.",
            ],
          },
          {
            heading: "RDW erkend, AutoTrust en BOVAG-waardig",
            paragraphs: [
              "Platin Automotive is officieel RDW erkend (KvK 99146193) en werkt volgens de hoogste normen in de branche. Wij hanteren transparante prijzen — geen verborgen kosten, geen onverwachte facturen. Op verzoek leveren wij een complete dossier mee inclusief NAP-historie, onderhoudshistorie, eventuele schadehistorie en aankoopfactuur.",
              "Onze werkwijze is gestoeld op vertrouwen, langdurige relaties en service. Veel van onze klanten komen voor hun volgende auto terug en bevelen ons aan bij vrienden en familie. Lees onze Google reviews om te zien wat klanten over ons zeggen.",
            ],
          },
          {
            heading: "Werkgebied: Roelofarendsveen en wijde omgeving",
            paragraphs: [
              "Wij verzorgen verkoop en aankoop van auto's voor klanten uit Roelofarendsveen, Alphen aan den Rijn, Leiden, Leiderdorp, Lisse, Sassenheim, Nieuwkoop, Mijdrecht, Hoofddorp, Zoetermeer, Den Haag, Amsterdam en de hele Randstad. Indien gewenst leveren wij uw nieuwe auto bij u thuis af — bespreek de mogelijkheden direct met ons team.",
            ],
          },
          {
            heading: "Plan een bezoek of taxatie",
            paragraphs: [
              "Kom langs in onze showroom aan de Cilinderweg 99 in Roelofarendsveen, of bel/WhatsApp 071-781 25 25 voor een afspraak. Wij staan voor u klaar van maandag t/m zondag — zie de openingstijden hierboven. Bekijk onze actuele voorraad online of laat uw auto vrijblijvend taxeren via ons formulier.",
            ],
          },
        ]}
      />

      <Footer />
    </div>
  );
};

export default InEnVerkoop;
