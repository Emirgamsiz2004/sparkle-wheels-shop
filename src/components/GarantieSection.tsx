import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";
import logoAutotrust from "@/assets/logo-autotrust.png";

const punten = [
  "Officiële AutoTrust-garantie (BOVAG)",
  "Twee pakketten: Instap & Uitgebreid",
  "Heel Europa dekking",
  "Pechhulp & vervangend vervoer",
];

const GarantieSection = () => {
  return (
    <section className="py-16 md:py-28 bg-background">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid lg:grid-cols-[1fr_1.2fr] gap-px bg-border border border-border"
        >
          {/* Left — logo block */}
          <div className="bg-card p-8 md:p-12 flex flex-col justify-center items-start gap-5">
            <ShieldCheck className="w-7 h-7 text-primary" />
            <img
              src={logoAutotrust}
              alt="AutoTrust garantie"
              className="h-10 md:h-12 w-auto object-contain"
            />
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
              Onze garantiepartner
            </p>
          </div>

          {/* Right — copy */}
          <div className="bg-card p-8 md:p-12">
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Garantie
            </p>
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-5 leading-tight">
              Zorgeloos rijden,
              <br />
              gegarandeerd.
            </h2>
            <p className="text-muted-foreground font-body font-light leading-relaxed mb-7 max-w-xl">
              Op iedere geschikte auto bieden wij een officiële AutoTrust-garantie
              aan — een dochter van BOVAG. Twee pakketten op maat van de leeftijd
              en kilometerstand van uw auto.
            </p>

            <ul className="grid sm:grid-cols-2 gap-2.5 mb-8">
              {punten.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm font-body text-foreground/85">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>

            <Link
              to="/garantie"
              className="group inline-flex items-center gap-3 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              Alles over de garantie
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default GarantieSection;
