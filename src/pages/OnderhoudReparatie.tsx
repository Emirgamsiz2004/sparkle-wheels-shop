import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, Wrench, Clock, Euro, MessageCircle, Phone, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceForm from "@/components/ServiceForm";
import FloatingCTA from "@/components/FloatingCTA";
import ServiceSEOContent from "@/components/ServiceSEOContent";
import onderhoudImg from "@/assets/onderhoud.jpg";

const diensten = [
  "Olie verversen",
  "Filters vervangen",
  "Remblokken & schijven",
  "Banden wisselen",
  "Airco service",
  "Vloeistoffen bijvullen",
  "Bougies vervangen",
  "Accu vervangen",
];

const OnderhoudReparatie = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Auto Onderhoud &amp; Reparatie Roelofarendsveen | Platin Automotive</title>
        <meta name="description" content="Auto onderhoud en reparatie in Roelofarendsveen. Olie, remmen, banden, airco en meer. Eerlijke prijzen, snelle service. Maak vandaag een afspraak." />
        <link rel="canonical" href="https://platinautomotive.nl/diensten/onderhoud-reparatie" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Auto Onderhoud &amp; Reparatie Roelofarendsveen | Platin Automotive" />
        <meta property="og:description" content="Auto onderhoud en reparatie in Roelofarendsveen. Olie, remmen, banden, airco en meer. Eerlijke prijzen, snelle service. Maak vandaag een afspraak." />
        <meta property="og:url" content="https://platinautomotive.nl/diensten/onderhoud-reparatie" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Auto Onderhoud &amp; Reparatie Roelofarendsveen | Platin Automotive" />
        <meta name="twitter:description" content="Auto onderhoud en reparatie in Roelofarendsveen. Olie, remmen, banden, airco en meer. Eerlijke prijzen, snelle service. Maak vandaag een afspraak." />

      </Helmet>
      <Navbar />
      <FloatingCTA targetId="afspraak" label="Afspraak maken" />

      {/* Hero */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${onderhoudImg})` }}
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
              Onderhoud & Reparatie
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
                Betrouwbaar onderhoud
                <br />
                voor uw auto.
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Bij Platin Automotive kunt u terecht voor al uw klein onderhoud. 
                  Van een oliewissel tot het vervangen van remblokken — wij zorgen ervoor 
                  dat uw auto in topconditie blijft.
                </p>
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Wij richten ons bewust op onderhoud en kleine reparaties. 
                  Geen onnodige werkzaamheden, geen verrassingen op de factuur. 
                  Altijd vooraf een duidelijke prijsindicatie.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="grid grid-cols-3 gap-px bg-border">
                {[
                  { icon: Euro, label: "Scherpe prijzen" },
                  { icon: Clock, label: "Snel geholpen" },
                  { icon: Wrench, label: "Vakwerk" },
                ].map((item) => (
                  <div key={item.label} className="bg-background p-5 md:p-6 flex flex-col items-center text-center">
                    <item.icon className="w-5 h-5 text-muted-foreground mb-3" />
                    <span className="text-[10px] tracking-[0.15em] uppercase font-body font-medium text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Diensten overzicht */}
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
              Werkzaamheden
            </p>
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight">
              Wat wij voor u doen
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {diensten.map((dienst, i) => (
              <motion.div
                key={dienst}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="bg-card p-5 md:p-6 flex items-center gap-3 group"
              >
                <CheckCircle className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                <span className="text-sm font-body text-foreground">{dienst}</span>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-xs font-body font-light text-muted-foreground mt-6"
          >
            Staat uw werkzaamheid er niet bij? Neem contact op — wij kijken graag wat we voor u kunnen betekenen.
          </motion.p>
        </div>
      </section>

      {/* Afspraak + Quick contact */}
      <ServiceSEOContent
        sections={[
          {
            heading: "Auto onderhoud en reparatie in Roelofarendsveen",
            paragraphs: [
              "Platin Automotive is uw vertrouwde adres voor klein onderhoud en reparaties aan personenauto's in Roelofarendsveen en omgeving. Onze monteurs zijn gespecialiseerd in periodiek onderhoud, slijtagedelen en kleine technische ingrepen waarmee uw auto betrouwbaar en veilig blijft rijden. Met moderne apparatuur, OBD-uitleesapparatuur en originele of gelijkwaardige onderdelen werken wij efficiënt, transparant en eerlijk.",
              "Wij bedienen klanten uit Roelofarendsveen, Alphen aan den Rijn, Leiden, Leiderdorp, Nieuwkoop, Lisse, Sassenheim, Hoofddorp, Zoetermeer en de bredere Randstad. Dankzij onze ligging direct aan de N446 en op enkele minuten van de A4 en N11 zijn wij snel en goed bereikbaar.",
            ],
          },
          {
            heading: "Klein onderhoud: olie, filters en vloeistoffen",
            paragraphs: [
              "Periodiek onderhoud is de basis voor een lange levensduur van uw auto. Wij vervangen de motorolie volgens fabrieksvoorschrift, vernieuwen olie-, lucht-, brandstof- en interieurfilters en controleren alle vloeistofniveaus zoals koelvloeistof, remvloeistof, ruitensproeiervloeistof en stuurbekrachtigingsolie. Wij gebruiken hoogwaardige merkolie passend bij uw motor en uw rijstijl.",
              "Tijdens elke onderhoudsbeurt voeren wij ook een visuele inspectie uit van de onderzijde, de banden, de remmen, de uitlaat en de ophanging. Zo signaleren wij problemen voordat ze duur worden. U ontvangt altijd een eerlijk advies — geen verkooppraatjes, alleen wat écht nodig is.",
            ],
          },
          {
            heading: "Remmen, banden en ophanging",
            paragraphs: [
              "Remblokken, remschijven en remvloeistof horen tot de meest veiligheidskritische onderdelen van uw auto. Wij meten remblokdiktes nauwkeurig en vervangen ze tijdig met kwalitatieve onderdelen. Ook remschijven, remklauwen en de handremkabel pakken wij aan wanneer nodig.",
              "Voor uw banden bieden wij montage, balanceren, uitlijnen, reparatie van lekke banden en seizoenswissel van winter- naar zomerbanden en omgekeerd. Wij adviseren u graag over het juiste bandenmerk en het juiste profiel voor uw rijstijl. Slijtage aan schokdempers, fuseekogels, stabilisatorstangen en draagarmen pakken wij eveneens aan.",
            ],
          },
          {
            heading: "Airco service en seizoensonderhoud",
            paragraphs: [
              "Een goed werkende airco zorgt niet alleen voor comfort in de zomer, maar voorkomt ook beslagen ruiten in de winter. Wij voeren een complete aircoservice uit: bijvullen van koudemiddel R134a of R1234yf, vervangen van de interieurfilter, controleren van het systeem op lekkage en desinfecteren van het ventilatiesysteem tegen schimmel en bacteriën.",
              "Daarnaast bieden wij seizoensgebonden controles aan: voor de winter checken wij accu, antivries, ruitenwissers en banden; voor de zomer richten wij ons op airco, koeling en bandenspanning. Zo bent u in elk seizoen veilig op weg.",
            ],
          },
          {
            heading: "Accu, bougies en startproblemen",
            paragraphs: [
              "Een auto die niet wil starten staat altijd op het verkeerde moment stil. Wij testen accu, dynamo en startmotor en vervangen accu's van topkwaliteit met aangepaste codering voor moderne start-stop systemen. Bougies, gloeibougies en bobines worden vervangen volgens fabrieksvoorschrift.",
              "Met onze OBD-uitleesapparatuur lezen wij foutcodes uit en stellen we problemen snel vast. Bij motorstoringslampjes, vermogensverlies of vreemde geluiden kunt u altijd vrijblijvend langskomen voor een diagnose.",
            ],
          },
          {
            heading: "Eerlijke prijzen, geen verrassingen",
            paragraphs: [
              "Bij Platin Automotive werken wij met scherpe, transparante tarieven. U krijgt vooraf een duidelijke prijsindicatie en wij voeren nooit werkzaamheden uit zonder uw akkoord. Onze werkplaatstarieven zijn aanzienlijk lager dan die van dealers, terwijl wij dezelfde kwaliteit leveren en uw fabrieksgarantie behouden.",
              "Onderhoud aan uw auto bij een onafhankelijke garage zoals de onze tast de fabrieksgarantie niet aan, mits het werk volgens voorschrift wordt uitgevoerd. Wij stempelen het onderhoudsboekje en bewaren alle bonnen digitaal voor uw administratie.",
            ],
          },
          {
            heading: "Onderhoud voor alle merken en modellen",
            paragraphs: [
              "Wij werken aan vrijwel alle merken: Volkswagen, Audi, BMW, Mercedes-Benz, Opel, Ford, Toyota, Renault, Peugeot, Citroën, Skoda, SEAT, Volvo, Mini, Tesla en meer. Of u nu een benzine-, diesel-, hybride- of volledig elektrische auto rijdt — onze monteurs hebben de kennis en de juiste apparatuur. Voor specialistische werkzaamheden buiten onze focus verwijzen we eerlijk door.",
            ],
          },
          {
            heading: "Maak vandaag nog een afspraak",
            paragraphs: [
              "Heeft u een reparatie of onderhoudsbeurt nodig? Bel of WhatsApp ons op 071-781 25 25, mail naar info@platinautomotive.nl of plan online direct een afspraak via het formulier hieronder. Wij zitten aan de Cilinderweg 99 in Roelofarendsveen — gratis parkeren voor de deur, en op loopafstand een bakker en koffiezaak voor het geval u wacht.",
            ],
          },
        ]}
      />

      {/* Afspraak + Quick contact */}
      <section id="afspraak" className="py-16 md:py-28 bg-card">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-px bg-border">
            {/* Afspraak formulier */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-background p-6 md:p-10"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-2">
                Direct inplannen
              </p>
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2">
                Maak een afspraak
              </h3>
              <p className="text-xs font-body font-light text-muted-foreground leading-relaxed mb-8">
                Kies een datum en tijd die u uitkomt. Wij bevestigen uw afspraak zo snel mogelijk. Vrijblijvend en zonder verplichtingen.
              </p>
              <ServiceForm dienst="onderhoud" />
            </motion.div>

            {/* Snel contact */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-background p-6 md:p-10 flex flex-col"
            >
              <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-2">
                Snel contact
              </p>
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2">
                Liever direct contact?
              </h3>
              <p className="text-xs font-body font-light text-muted-foreground leading-relaxed mb-8">
                Bel ons of stuur een WhatsApp berichtje. Wij reageren snel en kunnen u direct een inschatting geven.
              </p>

              <div className="space-y-4 mb-8">
                <a
                  href="tel:+31620686868"
                  className="group flex items-center gap-4 p-4 border border-border hover:border-foreground/30 transition-all duration-300"
                >
                  <Phone className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <div>
                    <p className="text-sm font-display font-semibold text-foreground">Bel werkplaats</p>
                    <p className="text-xs font-body text-muted-foreground">071-781 25 25</p>
                  </div>
                </a>
                <a
                  href="https://wa.me/31620686868?text=Hallo%2C%20ik%20wil%20graag%20een%20afspraak%20voor%20onderhoud."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-4 border border-border hover:border-foreground/30 transition-all duration-300"
                >
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-display font-semibold text-foreground">WhatsApp</p>
                    <p className="text-xs font-body text-muted-foreground">Stuur een berichtje</p>
                  </div>
                </a>
              </div>

              <div className="mt-auto pt-8 border-t border-border">
                <p className="text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-4">
                  Openingstijden
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Maandag</span>
                    <span className="text-foreground">12:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Di t/m Vr</span>
                    <span className="text-foreground">09:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Zaterdag</span>
                    <span className="text-foreground">10:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-muted-foreground">Zondag</span>
                    <span className="text-foreground">10:00 - 16:00</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OnderhoudReparatie;
