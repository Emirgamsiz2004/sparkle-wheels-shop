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
    description: "Lage vaste rente vanaf 7,9% — geen verrassingen.",
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
          content="Auto financieren of leasen bij Platin Automotive? Financial lease voor ondernemers en private lease voor particulieren. In samenwerking met financiallease.nl."
        />
        <link rel="canonical" href="https://platinautomotive.nl/financiering" />
        <meta property="og:title" content="Financiering & Lease | Platin Automotive" />
        <meta
          property="og:description"
          content="Financial lease voor ondernemers en private lease voor particulieren. Snel, online en met vaste lage rente via financiallease.nl."
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
              Bij Platin Automotive financier je elke auto eenvoudig via{" "}
              <span className="text-foreground font-medium">financiallease.nl</span>.
              Voor ondernemers én particulieren — snel, online en met een vaste
              lage rente.
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
              Wij bieden twee vormen aan — voor zakelijk én particulier gebruik.
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
                U financiert de auto en wordt direct juridisch eigenaar. De auto
                komt op uw balans en u kunt BTW en afschrijving fiscaal aftrekken.
                Na de laatste termijn is de auto helemaal van u.
              </p>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Auto direct op de zaak",
                  "BTW & afschrijving aftrekbaar",
                  "Vaste lage rente (vanaf 7,9%)",
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
                Voor particulieren
              </p>
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">
                Private Lease
              </h3>
              <p className="text-sm font-body text-muted-foreground leading-relaxed mb-6">
                Eén vast maandbedrag — all-in. Geen aanbetaling nodig, geen
                onverwachte kosten. Wegenbelasting, onderhoud, verzekering en
                pechhulp zijn meestal inbegrepen. Ideaal voor zorgeloos rijden.
              </p>
              <ul className="space-y-2.5 mb-6">
                {[
                  "Eén vast maandbedrag",
                  "All-in: belasting, onderhoud, pechhulp",
                  "Geen aanbetaling vereist",
                  "Flexibele looptijd",
                  "Geen restwaarde-risico",
                  "Voor particulieren én ZZP'ers",
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
                Bereken private lease
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
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
                Sharia-conform
              </p>
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">
                Halal Lease
              </h3>
              <p className="text-sm font-body text-muted-foreground leading-relaxed mb-6">
                Volledig rentevrij financieren volgens islamitische principes. In plaats
                van rente betaalt u een vooraf vastgestelde{" "}
                <span className="text-foreground font-medium">kredietvergoeding</span>{" "}
                (murabaha): het totaalbedrag staat vast en wijzigt nooit.
              </p>
              <ul className="space-y-2.5 mb-6">
                {[
                  "100% rentevrij (geen riba)",
                  "Vaste kredietvergoeding vooraf bekend",
                  "Transparant — totaalbedrag staat vast",
                  "Voor particulier én zakelijk",
                  "Looptijd 12 tot 72 maanden",
                  "Sharia-conforme partner",
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
                Halal lease aanvragen
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

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
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-10 md:mb-14">
              Hoe werkt het?
            </h2>
          </motion.div>

          <div className="space-y-px bg-border">
            {[
              {
                num: "01",
                title: "Kies uw auto",
                desc: "Bekijk onze voorraad. Bij elke auto ziet u direct het indicatieve maandbedrag.",
              },
              {
                num: "02",
                title: "Bereken & vraag aan",
                desc: "Speel met aanbetaling en looptijd in onze calculator. Vraag dan vrijblijvend aan bij financiallease.nl.",
              },
              {
                num: "03",
                title: "Akkoord binnen 24 uur",
                desc: "Meestal heeft u binnen één werkdag akkoord. Wij regelen daarna het hele aflevertraject.",
              },
              {
                num: "04",
                title: "Rij weg",
                desc: "Auto rijklaar, papieren in orde. U rijdt direct weg vanuit onze showroom in Roelofarendsveen.",
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
