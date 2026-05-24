import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Calculator, Briefcase, User, Percent } from "lucide-react";
import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { berekenLease, formatEuro, LEASE_DEFAULTS } from "@/lib/lease";
import logoFinanciallease from "@/assets/logo-financiallease.png";

const FinancieringSection = () => {
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
    <section className="py-16 md:py-28 lg:py-36 bg-card border-t border-border">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Financiering & Lease
            </p>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-6">
              Rijd vandaag,
              <br />
              betaal per maand.
            </h2>
            <p className="text-muted-foreground font-body font-light leading-relaxed mb-8 max-w-xl">
              Elke auto in onze voorraad is direct te financieren of te leasen via
              onze partner{" "}
              <span className="text-foreground font-medium">financiallease.nl</span>.
              Voor ondernemers (financial lease) én particulieren (private lease).
              Vaste lage rente, snel akkoord en volledig online.
            </p>

            <div className="grid sm:grid-cols-3 gap-px bg-border mb-8">
              {[
                { icon: Briefcase, label: "Financial Lease", desc: "Voor ondernemers" },
                { icon: User, label: "Private Lease", desc: "Voor particulieren" },
                { icon: Percent, label: "Vaste rente", desc: "Vanaf 7,9%" },
              ].map((item) => (
                <div key={item.label} className="bg-card p-4">
                  <item.icon className="w-4 h-4 text-muted-foreground mb-2" />
                  <p className="text-xs font-display font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/financiering"
                className="group inline-flex items-center justify-center gap-3 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                Meer over lease
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/voorraad"
                className="group inline-flex items-center justify-center gap-3 border border-foreground/20 hover:border-foreground/50 text-foreground px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase transition-all duration-300"
              >
                Bekijk voorraad
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Right — partner card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="bg-background border border-border p-8 md:p-10"
          >
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
              <Calculator className="w-6 h-6 text-foreground" />
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
                  Lease-calculator
                </p>
                <p className="text-sm font-display font-semibold text-foreground">
                  Bereken uw maandbedrag
                </p>
              </div>
            </div>

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

            <div className="bg-card p-5 border border-border mb-5">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                Maandbedrag
              </p>
              <p className="font-display text-3xl md:text-4xl font-bold text-foreground transition-all">
                {formatEuro(maandbedrag)}
                <span className="text-base font-body font-normal text-muted-foreground"> /mnd</span>
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <img
                src={logoFinanciallease}
                alt="financiallease.nl"
                className="h-8 w-auto object-contain opacity-80"
              />
              <p className="text-[10px] text-muted-foreground/70 leading-snug">
                In samenwerking met financiallease.nl. Indicatief, onder voorbehoud van goedkeuring.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FinancieringSection;
