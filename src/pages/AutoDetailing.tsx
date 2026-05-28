import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ArrowRight, Sparkles, Star, MessageCircle, Phone, CheckCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceForm from "@/components/ServiceForm";
import FloatingCTA from "@/components/FloatingCTA";
import DetailingConfigurator from "@/components/DetailingConfigurator";
import ServiceSEOContent from "@/components/ServiceSEOContent";
import polishImg from "@/assets/detailing/polish.webp";
import foamWashImg from "@/assets/detailing/foam-wash.webp";
import foamFrontImg from "@/assets/detailing/foam-front.webp";
import interiorImg from "@/assets/detailing/interior.webp";
import wheelImg from "@/assets/detailing/wheel.webp";

const behandelingen = [
  {
    img: foamWashImg,
    title: "Handwas & foamwash",
    desc: "pH-neutrale snowfoam en zachte microvezels — veilig voor uw lak.",
  },
  {
    img: polishImg,
    title: "Polijsten & ontkrassen",
    desc: "Wegwerken van wervels, lichte krassen en holograms voor diepe glans.",
  },
  {
    img: interiorImg,
    title: "Interieur dieptereiniging",
    desc: "Stoelen, bekleding en leder weer fris, zacht en als nieuw.",
  },
  {
    img: wheelImg,
    title: "Velgen & banden",
    desc: "Grondige velgreiniging tot in de hoeken en bandendressing.",
  },
  {
    img: foamFrontImg,
    title: "Lakbescherming",
    desc: "Sealants en keramische coatings voor langdurige glans en bescherming.",
  },
];

const AutoDetailing = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#configurator") {
      requestAnimationFrame(() => {
        const el = document.getElementById("configurator");
        if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
      });
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Auto Detailing Roelofarendsveen | Poetsen &amp; Polijsten | Platin Automotive</title>
        <meta name="description" content="Professionele auto detailing in Roelofarendsveen. Handwas, polijsten, interieur reiniging en lakbescherming. Klanten uit Alphen, Leiden en omgeving welkom. Bel 071-781 25 25." />
        <link rel="canonical" href="https://platinautomotive.nl/diensten/auto-detailing" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Auto Detailing Roelofarendsveen | Poetsen &amp; Polijsten | Platin Automotive" />
        <meta property="og:description" content="Professionele auto detailing in Roelofarendsveen. Handwas, polijsten, interieur reiniging en lakbescherming. Klanten uit Alphen, Leiden en omgeving welkom. Bel 071-781 25 25." />
        <meta property="og:url" content="https://platinautomotive.nl/diensten/auto-detailing" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Auto Detailing Roelofarendsveen | Poetsen &amp; Polijsten | Platin Automotive" />
        <meta name="twitter:description" content="Professionele auto detailing in Roelofarendsveen. Handwas, polijsten, interieur reiniging en lakbescherming. Klanten uit Alphen, Leiden en omgeving welkom. Bel 071-781 25 25." />
      </Helmet>
      <Navbar />
      <FloatingCTA targetId="afspraak" label="Afspraak maken" />

      {/* Hero */}
      <section className="relative h-[32vh] md:h-[38vh] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${polishImg})` }}
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
              Auto Detailing Roelofarendsveen | Professioneel Poetsen &amp; Polijsten
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Configurator */}
      <DetailingConfigurator />

      {/* Waarom professionele detailing? */}
      <section className="py-16 md:py-28 bg-background">
        <div className="container mx-auto px-6 lg:px-16 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-6">
              Waarom professionele detailing?
            </h2>
            <div className="space-y-4 text-muted-foreground font-body font-light leading-relaxed text-base md:text-lg">
              <p>Een professionele poetsbeurt is meer dan alleen een schone auto.</p>
              <p>Het beschermt je lak, verhoogt de waarde van je auto en zorgt dat hij er altijd als nieuw uitziet. Bij Platin Automotive behandelen we elke auto met dezelfde zorg — of het nu een dagelijkse rijder is of een topmodel.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Onze detailing diensten */}
      <section className="py-16 md:py-28 bg-card">
        <div className="container mx-auto px-6 lg:px-16 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-6">
              Onze detailing diensten
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-muted-foreground font-body font-light text-base md:text-lg">
                <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span><strong className="text-foreground font-medium">Handwas &amp; foamwash</strong> — grondige reiniging van buiten</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground font-body font-light text-base md:text-lg">
                <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span><strong className="text-foreground font-medium">Polijsten &amp; ontkrassen</strong> — krassen en matte lak herstellen</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground font-body font-light text-base md:text-lg">
                <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span><strong className="text-foreground font-medium">Interieur dieptereiniging</strong> — stoelen, tapijt, dashboard</span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground font-body font-light text-base md:text-lg">
                <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span><strong className="text-foreground font-medium">Velgen &amp; banden behandeling</strong></span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground font-body font-light text-base md:text-lg">
                <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span><strong className="text-foreground font-medium">Lakbescherming &amp; keramische coating</strong></span>
              </li>
              <li className="flex items-start gap-3 text-muted-foreground font-body font-light text-base md:text-lg">
                <CheckCircle className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span><strong className="text-foreground font-medium">Voor &amp; na foto's</strong> van elk werk</span>
              </li>
            </ul>
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
                Uw auto als nieuw,
                <br />
                tot in de details.
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Bij Platin Automotive geven we uw auto de behandeling die het verdient.
                  Van een uitgebreide handwas tot een complete interieur- en exterieurreiniging —
                  wij maken uw auto zo goed als nieuw.
                </p>
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Of uw auto nu toe is aan een grondige poetsbeurt of u wilt hem in showroom-conditie
                  brengen: wij pakken het professioneel aan. Elke auto wordt met de hand behandeld
                  en krijgt de aandacht die het verdient.
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
                  { icon: Sparkles, label: "Als nieuw" },
                  { icon: ShieldCheck, label: "Bescherming" },
                  { icon: Star, label: "Premium" },
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

      {/* Voor particulieren en bedrijven */}
      <section className="py-16 md:py-28 bg-background">
        <div className="container mx-auto px-6 lg:px-16 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-6">
              Voor particulieren en bedrijven
            </h2>
            <div className="space-y-4 text-muted-foreground font-body font-light leading-relaxed text-base md:text-lg">
              <p>Wij detailen zowel particuliere auto's als bedrijfswagens en lease-auto's.</p>
              <p>Klanten komen naar ons toe vanuit Alphen aan den Rijn, Leiden, Lisse, Sassenheim en de wijde omgeving.</p>
            </div>
          </motion.div>
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
              Behandelingen
            </p>
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight">
              Wat wij voor u doen
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {behandelingen.map((b, i) => (
              <motion.article
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="bg-card group overflow-hidden"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={b.img}
                    alt={b.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 md:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <h3 className="text-sm md:text-base font-display font-semibold text-foreground">
                      {b.title}
                    </h3>
                  </div>
                  <p className="text-xs md:text-sm font-body font-light text-muted-foreground leading-relaxed">
                    {b.desc}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-xs font-body font-light text-muted-foreground mt-6"
          >
            Wilt u iets speciaals laten doen? Neem contact op — wij denken graag met u mee.
          </motion.p>
        </div>
      </section>

      {/* Wat kost een detailing */}
      <section className="py-16 md:py-28 bg-card">
        <div className="container mx-auto px-6 lg:px-16 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-6">
              Wat kost een detailing bij Platin Automotive?
            </h2>
            <div className="space-y-4 text-muted-foreground font-body font-light leading-relaxed text-base md:text-lg">
              <p>De prijs hangt af van het voertuig en het pakket.</p>
              <p>Neem contact op voor een vrijblijvende prijsopgave op maat. Wij denken altijd eerlijk met je mee.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Maak een afspraak voor detailing */}
      <section className="py-16 md:py-28 bg-background">
        <div className="container mx-auto px-6 lg:px-16 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-6">
              Maak een afspraak voor detailing
            </h2>
            <div className="space-y-4 text-muted-foreground font-body font-light leading-relaxed text-base md:text-lg">
              <p>Bel of WhatsApp 071-781 25 25 of boek direct online via onze website.</p>
              <p>Wij zijn gevestigd op Cilinderweg 99 in Roelofarendsveen, goed bereikbaar vanuit de hele regio.</p>
            </div>
            <div className="flex flex-wrap gap-4 pt-6">
              <a
                href="tel:+31717812525"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-body font-medium hover:bg-primary/90 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Bel 071-781 25 25
              </a>
              <a
                href="https://wa.me/31620686868?text=Hallo%2C%20ik%20wil%20graag%20informatie%20over%20auto%20detailing."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-md font-body font-medium hover:border-foreground/30 transition-all"
              >
                <MessageCircle className="w-4 h-4 text-green-500" />
                WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Afspraak + Quick contact */}
      <ServiceSEOContent
        sections={[
          {
            heading: "Auto detailing in Roelofarendsveen door specialisten",
            paragraphs: [
              "Platin Automotive is een gespecialiseerd auto detailing bedrijf in Roelofarendsveen, centraal gelegen in het Groene Hart van Zuid-Holland. Onze werkplaats aan de Cilinderweg 99 is uitgerust met professionele poetsapparatuur, gefilterd water, LED-inspectielampen en hoogwaardige producten van topmerken zoals Koch-Chemie, Gyeon en Sonax. Of u nu een dagelijkse rijder, een lease-auto, een youngtimer of een exclusieve sportwagen heeft — wij behandelen iedere auto met dezelfde passie en aandacht voor detail.",
              "Detailing is veel meer dan een grondige wasbeurt. Het is een ambacht waarbij elk paneel, elke kier en elk onderdeel van het interieur stap voor stap wordt behandeld. Onze detailers werken volgens een vast protocol: van veilige voorwas en contactloze foamwash, tot decontaminatie van lak met clay bar, lakcorrectie met roterende en excentrische polijstmachines, en als laatste de bescherming met sealants of een keramische coating. Het resultaat is een auto die er niet alleen uitziet als nieuw, maar ook beschermd is tegen wind, regen, vuil, vogelpoep, boomhars en UV-straling.",
            ],
          },
          {
            heading: "Het verschil tussen wassen, poetsen en detailing",
            paragraphs: [
              "Een doorsnee wasstraat verwijdert oppervlakkig vuil, maar veroorzaakt vaak ook microkrasjes door harde borstels en gerecycled water. Bij een professionele handwas gebruiken wij twee-emmer methodes, microvezel washandschoenen en pH-neutrale shampoo om de lak veilig te reinigen. Poetsen gaat een stap verder: hierbij worden swirls, holograms en lichte krassen mechanisch verwijderd met polish en pads.",
              "Detailing combineert dit alles met een complete behandeling van het interieur, de motorruimte, de velgen, de banden, de ramen en de kunststof delen. Het is de meest grondige manier om uw auto in topconditie te brengen en de waarde te behouden. Veel klanten kiezen voor detailing wanneer ze hun auto willen verkopen, inruilen of gewoon weer trots achter het stuur willen zitten.",
            ],
          },
          {
            heading: "Lakcorrectie en polijsten in detail",
            paragraphs: [
              "Bij lakcorrectie meten wij eerst de laklaagdikte met een digitale lakdiktemeter. Op basis daarvan bepalen we welke pad-polish combinatie veilig is. Lichte krassen, draaicirkels van borstels in de wasstraat en holograms van eerdere foutieve polijstbeurten zijn meestal in één of twee stappen te corrigeren. Diepere krassen kunnen we tot een bepaalde diepte wegwerken zonder de lak te beschadigen.",
              "Na de polijstbeurt wordt de lak ontvet en gecontroleerd onder een LED-zwanenhalslamp. Pas dan wordt de bescherming aangebracht. Wij werken bewust niet met sneltrucs of glansmiddelen die krassen tijdelijk vullen — onze resultaten zijn blijvend en zichtbaar.",
            ],
          },
          {
            heading: "Keramische coating: bescherming die jaren meegaat",
            paragraphs: [
              "Een keramische coating vormt een keiharde, transparante beschermlaag op de lak die water, vuil en chemicaliën afstoot. De coating heeft een hydrofobe werking waardoor regen letterlijk van de auto afparelt. Hierdoor blijft uw auto langer schoon, is hij makkelijker te onderhouden en behoudt hij zijn diepe glans.",
              "Wij bieden coatings aan met een levensduur van 2 tot 7 jaar, afhankelijk van het pakket. Naast lakcoating kunnen wij ook velgen, ramen, leder en textiel coaten. Voor klanten die maximale bescherming willen combineren we de coating met paint protection film (PPF) op de meest kwetsbare delen zoals de motorkap, spiegels en zijschermen.",
            ],
          },
          {
            heading: "Interieur detailing: van leer tot textiel",
            paragraphs: [
              "Het interieur van een auto vangt dagelijks veel te verduren: stof, kruimels, vlekken, transpiratie, huisdierenharen en geuren hopen zich op. Bij een interieur detailing zuigen we eerst grondig stof en vuil, behandelen we kunststof en leder met speciale reinigers, en pakken we vlekken in stoffering aan met extractie-apparatuur. Leer wordt gevoed met pH-neutrale conditioner zodat het zacht en soepel blijft en niet uitdroogt of scheurt.",
              "Ook ventilatieroosters, dakhemel, deurpanelen, gordels, knoppen en het stuurwiel worden meegenomen. Geuren — bijvoorbeeld van rook of huisdieren — pakken we aan met ozonbehandeling. Na onze interieur detailing stapt u letterlijk in een andere auto.",
            ],
          },
          {
            heading: "Detailing voor klassiekers, youngtimers en exclusieve auto's",
            paragraphs: [
              "Eigenaren van klassiekers, youngtimers en exclusieve auto's zoals Porsche, Mercedes-AMG, BMW M, Audi RS, Tesla en Range Rover vertrouwen ons hun auto graag toe. Wij begrijpen dat juist bij deze auto's elke handeling met de grootste zorg moet gebeuren. Originele lak van een klassieker, een matgrijze wrap of een carbon dakhemel vragen om specifieke producten en technieken.",
              "Onze werkplaats is afgesloten, droog en stofvrij. Tijdens de behandeling staat uw auto veilig binnen en wordt deze nooit onbeheerd buiten gezet. Op verzoek leveren wij ook haal- en brengservice in de regio.",
            ],
          },
          {
            heading: "Detailing voor bedrijfsauto's, lease en wagenparken",
            paragraphs: [
              "Voor zakelijke klanten verzorgen wij periodiek onderhoud van bedrijfsauto's, leasewagens en complete wagenparken. Een verzorgde auto draagt bij aan een professionele uitstraling, beschermt de restwaarde en voorkomt schadekosten bij inlevering van de leaseauto. Wij maken graag afspraken op maat met vaste tarieven en korte doorlooptijden.",
              "Klanten uit Alphen aan den Rijn, Leiden, Leiderdorp, Zoetermeer, Lisse, Sassenheim, Nieuwkoop, Hoofddorp, Mijdrecht en de hele Randstad weten ons al jaren te vinden. De ligging direct aan de N446 en N207 maakt ons makkelijk bereikbaar.",
            ],
          },
          {
            heading: "Veelgestelde vragen over auto detailing",
            paragraphs: [
              "Hoe lang duurt een detailing? Een express poetsbeurt is in 2 tot 3 uur klaar, een volledige detailing met lakcorrectie en coating kan 1 tot 3 dagen duren afhankelijk van de staat van de auto. Krijg ik voor- en na-foto's? Ja, op verzoek documenteren wij de behandeling met foto's onder verschillende lichtsoorten zodat u het resultaat duidelijk ziet.",
              "Hoe vaak moet ik mijn auto laten detailen? Voor optimale bescherming adviseren wij minimaal één grote detailing per jaar, eventueel aangevuld met een onderhoudsbeurt elke 6 maanden. Is de bescherming voor de winter belangrijk? Absoluut — strooizout, vocht en wisselende temperaturen zijn de grootste vijanden van uw lak. Een goede coating voor de winter bespaart u veel ellende.",
            ],
          },
          {
            heading: "Direct een afspraak maken voor detailing",
            paragraphs: [
              "Wij plannen graag een vrijblijvende afspraak met u in. Tijdens dit kennismakingsgesprek inspecteren we uw auto, bespreken we uw wensen en geven we een eerlijke prijsopgave. Bel of WhatsApp 071-781 25 25, mail naar info@platinautomotive.nl of gebruik het online formulier hieronder. Onze werkplaats vindt u aan de Cilinderweg 99 in Roelofarendsveen — gratis parkeren voor de deur.",
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
              <ServiceForm dienst="detailing" />
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
                  href="https://wa.me/31620686868?text=Hallo%2C%20ik%20wil%20graag%20informatie%20over%20auto%20detailing."
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

export default AutoDetailing;
