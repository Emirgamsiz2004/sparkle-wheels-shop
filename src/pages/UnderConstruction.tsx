import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const UnderConstruction = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <motion.img
        src={logo}
        alt="Platin Automotive"
        className="h-10 md:h-12 w-auto mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-lg"
      >
        <p className="text-[10px] md:text-xs font-body font-semibold tracking-[0.35em] uppercase text-muted-foreground mb-6">
          Binnenkort beschikbaar
        </p>

        <h1 className="text-3xl md:text-5xl font-display font-extrabold leading-tight text-foreground tracking-tight mb-6">
          We werken aan
          <br />
          iets moois.
        </h1>

        <p className="text-sm md:text-base font-body text-muted-foreground leading-relaxed mb-10">
          Onze website wordt momenteel gebouwd. Neem gerust contact met ons op
          voor vragen of een afspraak.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="tel:+31717812525"
            className="bg-foreground text-background px-8 py-3.5 text-[10px] md:text-xs font-body font-semibold tracking-[0.25em] uppercase transition-all hover:bg-foreground/90"
          >
            Bel ons — 071-781 25 25
          </a>
          <a
            href="mailto:info@platinautomotive.nl"
            className="border border-border px-8 py-3.5 text-[10px] md:text-xs font-body font-medium tracking-[0.25em] uppercase text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
          >
            E-mail ons
          </a>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-8 text-[9px] font-body tracking-[0.2em] uppercase text-muted-foreground/40"
      >
        © {new Date().getFullYear()} Platin Automotive
      </motion.p>
    </div>
  );
};

export default UnderConstruction;
