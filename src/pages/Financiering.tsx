import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Calculator,
  ShieldCheck,
  Briefcase,
  User,
  ExternalLink,
  Clock,
  FileCheck,
  Percent,
  Moon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Slider } from "@/components/ui/slider";
import logoFinanciallease from "@/assets/logo-financiallease.png";
import { berekenLease, formatEuro, LEASE_DEFAULTS } from "@/lib/lease";

const voordelen = [
  {
    icon: Clock,
    title: "Snelle afhandeling",
    description: "Vaak binnen 24 uur akkoord en uitbetaald.",
  },
  {
    icon: Percent,
    title: "Vaste rente",
    description: "Lage vaste rente vanaf 10,9% — geen verrassingen.",
  },
  {
    icon: FileCheck,
    title: "Volledig digitaal",
    description: "Aanvragen, ondertekenen en uitbetalen 100% online.",
  },
  {
    icon: ShieldCheck,
    title: "Betrouwbare partner",
    description: "Wij werken samen met financiallease.nl, de grootste lease-aanbieder van Nederland.",
  },
];

const Financiering = () => {
  const [prijs, setPrijs] = useState(25000);
  const [aanbetalingPct, setAanbetalingPct] = useState(10);
  const [looptijd, setLooptijd] = useState(72);

  const aanbetaling = useMemo(() => Math.round(prijs * (aanbetalingPct / 100)), [prijs, aanbetalingPct]);
  const leasebedrag = useMemo(() => prijs - aanbetaling, [prijs, aanbetaling]);
  const maandbedrag = useMemo(
    () => berekenLease({ prijs, aanbetalingPct: aanbetalingPct / 100, looptijd, slottermijnPct: 0 }),
    [prijs, aanbetalingPct, looptijd]
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Financiering & Lease | Platin Automotive Roelofarendsveen</title>
        <meta
          name="description"
          content="Auto financieren of leasen bij Platin Automotive? Zakelijke financial lease, financiering met vaste kredietvergoeding en private lease voor auto's uit onze voorraad."
        />
        <link rel="canonical" href="https://platinautomotive.nl/financiering" />
        <meta property="og:title" content="Financiering & Lease | Platin Automotive" />
        <meta
          property="og:description"
          content="Zakelijke financial lease, financiering met vaste kredietvergoeding en private lease voor auto's uit onze voorraad."
        />
        <meta property="og:url" content="https://platinautomotive.nl/financiering" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-6 lg:px-16 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-4">
              Financiering & Lease
            </p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight mb-6">
              Rijd vandaag,
              <br />
              betaal per maand.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground font-body font-light leading-relaxed max-w-2xl mx-auto">
              Bij Platin Automotive regelt u eenvoudig een passende financiering via{" "}
              <span className="text-foreground font-medium">financiallease.nl</span>.
              Zakelijke financiering is ook mogelijk voor een auto van een andere
              aanbieder. Private lease bieden wij alleen aan voor auto's uit onze voorraad.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Partner */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-6 lg:px-16 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <img
                src={logoFinanciallease}
                alt="financiallease.nl"
                className="h-12 md:h-14 w-auto object-contain"
              />
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
                  Onze partner
                </p>
                <p className="text-sm md:text-base font-display font-semibold text-foreground">
                  financiallease.nl
                </p>
              </div>
            </div>
            <a
              href={LEASE_DEFAULTS.partnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase font-semibold text-foreground hover:text-primary transition-colors"
            >
              Bezoek financiallease.nl
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Twee opties */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-16 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-4">
              Welke lease past bij u?
            </h2>
            <p className="text-muted-foreground font-body font-light max-w-xl mx-auto">
                Bekijk welke mogelijkheid past bij uw situatie en de auto die u kiest.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
            {/* Financial lease */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card p-8 md:p-10"
            >
              <Briefcase className="w-6 h-6 text-foreground mb-5" />
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                Voor ondernemers
              </p>
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">
                Financial Lease
              </h3>
              <p className="text-sm font-body text-muted-foreground leading-relaxed mb-6">
                U financiert de auto en wordt economisch eigenaar. De auto komt op
                uw balans en kan fiscale voordelen bieden. Na betaling van de laatste
                termijn wordt u ook juridisch eigenaar.
              </p>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Auto direct op de zaak",
                  "BTW & afschrijving aftrekbaar",
                  "Vaste lage rente (vanaf 10,9%)",
                  "Looptijd 24 tot 72 maanden",
                  "Aanbetaling vanaf 10%",
                  "Eigendom na laatste termijn",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm font-body text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
              <a
                href={LEASE_DEFAULTS.partnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase font-semibold text-foreground hover:text-primary transition-colors"
              >
                Bereken financial lease
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </motion.div>

            {/* Private lease */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-card p-8 md:p-10"
            >
              <User className="w-6 h-6 text-foreground mb-5" />
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                Voor particulieren · eigen voorraad
              </p>
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">
                Private Lease
              </h3>
              <p className="text-sm font-body text-muted-foreground leading-relaxed mb-6">
                Private lease is uitsluitend mogelijk voor een daarvoor geschikt
                voertuig uit onze eigen voorraad. U betaalt een vast maandbedrag;
                de precieze dekking en voorwaarden staan in het persoonlijke aanbod.
              </p>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Alleen auto's uit onze voorraad",
                  "Vast maandbedrag",
                  "Voor particuliere klanten",
                  "Looptijd en kilometrage op maat",
                  "Voorwaarden vooraf duidelijk",
                  "Altijd onder voorbehoud van acceptatie",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm font-body text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase font-semibold text-foreground hover:text-primary transition-colors"
              >
                Vraag private lease aan
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* Halal lease */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card p-8 md:p-10"
            >
              <Moon className="w-6 h-6 text-foreground mb-5" />
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                Uitsluitend voor ondernemers
              </p>
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">
                Halal Lease
              </h3>
              <p className="text-sm font-body text-muted-foreground leading-relaxed mb-6">
                Wat vaak halal lease wordt genoemd, is bij onze partner een zakelijke
                financiering met duidelijke afspraken. Op de overeenkomst staat geen
                rente, maar een vooraf vastgestelde{" "}
                <span className="text-foreground font-medium">kredietvergoeding</span>.
              </p>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Alleen voor zakelijke klanten",
                  "Geen rentevermelding op de overeenkomst",
                  "Kredietvergoeding vooraf vastgesteld",
                  "Duidelijke maandtermijnen en looptijd",
                  "Looptijd 12 tot 72 maanden",
                  "Onder voorbehoud van acceptatie",
                ].map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm font-body text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase font-semibold text-foreground hover:text-primary transition-colors"
              >
                Zakelijke aanvraag bespreken
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="py-16 md:py-24 bg-background border-y border-border">
        <div className="container mx-auto px-6 lg:px-16 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
                Lease-calculator
              </p>
              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-6">
                Bereken uw maandbedrag
              </h2>
              <p className="text-muted-foreground font-body font-light leading-relaxed mb-8 max-w-lg">
                Speel met aanbetaling en looptijd om een indicatie van uw maandbedrag te zien. 
                Alle bedragen zijn indicatief en onder voorbehoud van kredietgoedkeuring via{" "}
                <span className="text-foreground font-medium">financiallease.nl</span>.
              </p>

              <div className="flex items-center gap-3">
                <img
                  src={logoFinanciallease}
                  alt="financiallease.nl"
                  className="h-8 w-auto object-contain opacity-80"
                />
                <p className="text-[10px] text-muted-foreground/70 leading-snug max-w-xs">
                  In samenwerking met financiallease.nl
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="bg-card border border-border p-8 md:p-10"
            >
              <div className="space-y-6 mb-7">
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="text-xs font-body text-muted-foreground">Aankoopprijs</label>
                    <span className="text-sm font-display font-semibold text-foreground">{formatEuro(prijs)}</span>
                  </div>
                  <Slider
                    value={[prijs]}
                    onValueChange={(v) => setPrijs(v[0])}
                    min={5000}
                    max={75000}
                    step={500}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="text-xs font-body text-muted-foreground">Aanbetaling</label>
                    <span className="text-sm font-display font-semibold text-foreground">
                      {aanbetalingPct}% · {formatEuro(aanbetaling)}
                    </span>
                  </div>
                  <Slider
                    value={[aanbetalingPct]}
                    onValueChange={(v) => setAanbetalingPct(v[0])}
                    min={0}
                    max={95}
                    step={5}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="text-xs font-body text-muted-foreground">Looptijd</label>
                    <span className="text-sm font-display font-semibold text-foreground">{looptijd} mnd</span>
                  </div>
                  <Slider
                    value={[looptijd]}
                    onValueChange={(v) => setLooptijd(v[0])}
                    min={12}
                    max={84}
                    step={12}
                  />
                </div>

                <div className="flex justify-between text-xs font-body pt-1">
                  <span className="text-muted-foreground">Leasebedrag · Rente</span>
                  <span className="text-foreground font-medium">
                    {formatEuro(leasebedrag)} · {(LEASE_DEFAULTS.rente * 100).toFixed(1).replace(".", ",")}% vast
                  </span>
                </div>
              </div>

              <div className="bg-background p-5 border border-border mb-5">
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                  Maandbedrag
                </p>
                <p className="font-display text-3xl md:text-4xl font-bold text-foreground transition-all">
                  {formatEuro(maandbedrag)}
                  <span className="text-base font-body font-normal text-muted-foreground"> /mnd</span>
                </p>
              </div>

              <a
                href={LEASE_DEFAULTS.partnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300 w-full"
              >
                Vraag lease aan bij financiallease.nl
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Voordelen */}

      {/* Voordelen */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-6 lg:px-16 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Waarom lease via Platin
            </p>
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight">
              Eenvoudig, snel & transparant
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
            {voordelen.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-background p-6 md:p-8"
              >
                <v.icon className="w-5 h-5 text-muted-foreground mb-4" />
                <h3 className="text-sm font-display font-semibold text-foreground mb-2">
                  {v.title}
                </h3>
                <p className="text-xs font-body font-light text-muted-foreground leading-relaxed">
                  {v.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hoe werkt het */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-6 lg:px-16 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-4">
              Hoe werkt het precies?
            </h2>
            <p className="text-sm md:text-base font-body text-muted-foreground leading-relaxed mb-10 md:mb-14 max-w-2xl">
              U kunt een auto uit onze voorraad kiezen. Bent u ondernemer en vond u
              een auto bij een andere garage of particulier? Dan kunnen wij ook de
              zakelijke financiering voor u aanvragen. Private lease is uitsluitend
              mogelijk voor auto's uit onze eigen voorraad.
            </p>
          </motion.div>

          <div className="space-y-px bg-border">
            {[
              {
                num: "01",
                title: "U vindt een auto",
                desc: "Kies een auto uit onze voorraad. Zakelijke klanten kunnen ook een advertentie van een andere garage of particulier aanleveren.",
              },
              {
                num: "02",
                title: "Stuur ons de gegevens",
                desc: "Mail of WhatsApp ons de advertentie (of het kenteken) met uw wensen: gewenst maandbedrag, aanbetaling en looptijd. Voor ondernemers ook graag de KvK-gegevens.",
              },
              {
                num: "03",
                title: "Wij vragen het voor u aan",
                desc: "Wij dienen de aanvraag in bij financiallease.nl. Voor ondernemers bespreken we financial lease of de mogelijkheid met een vaste kredietvergoeding. Private lease geldt alleen voor auto's uit onze voorraad.",
              },
              {
                num: "04",
                title: "Akkoord & contract",
                desc: "Meestal binnen 24 uur uitsluitsel. U ontvangt het contract digitaal en ondertekent online. Wij houden u bij elke stap op de hoogte.",
              },
              {
                num: "05",
                title: "Uitbetaling & aflevering",
                desc: "De leasemaatschappij betaalt de verkopende partij. Wij maken de auto rijklaar, regelen de papieren en u rijdt weg.",
              },
            ].map((step) => (
              <div key={step.num} className="bg-card p-6 md:p-8 flex gap-5 md:gap-8 items-start">
                <span className="text-2xl md:text-4xl font-display font-bold text-muted-foreground/40 shrink-0">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-base md:text-lg font-display font-semibold text-foreground mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm font-body text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-card border-t border-border">
        <div className="container mx-auto px-6 lg:px-16 max-w-4xl text-center">
          <Calculator className="w-7 h-7 text-muted-foreground mx-auto mb-5" />
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-4">
            Klaar om te berekenen?
          </h2>
          <p className="text-muted-foreground font-body font-light leading-relaxed max-w-2xl mx-auto mb-8">
            Bekijk onze voorraad en zie bij elke auto direct het maandbedrag.
            Vragen? Wij helpen u graag persoonlijk.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/voorraad"
              className="group inline-flex items-center justify-center gap-3 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              Bekijk Voorraad
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/contact"
              className="group inline-flex items-center justify-center gap-3 border border-foreground/20 hover:border-foreground/50 text-foreground px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-300"
            >
              Stel een vraag
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-6 max-w-xl mx-auto">
            Alle leaseaanvragen verlopen via onze partner financiallease.nl. Onder
            voorbehoud van kredietgoedkeuring.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Financiering;
