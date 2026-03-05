import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section id="home" className="relative h-[100svh] w-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-background/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
      </div>

      {/* Content — left aligned like VDM */}
      <div className="relative z-10 flex flex-col justify-center h-full px-6 md:px-[90px] max-w-[1920px] mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-extrabold leading-[0.95] mb-6 text-foreground tracking-tight"
        >
          Platin Automotive
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-[10px] md:text-xs font-body font-semibold tracking-[0.35em] uppercase text-foreground/60 mb-4"
        >
          Kwaliteit & Betrouwbaarheid
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-xl sm:text-2xl md:text-4xl font-display font-light italic text-foreground/80 mb-10 leading-snug"
        >
          Auto's, service
          <br />
          & vertrouwen
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-wrap gap-4"
        >
          <a
            href="#voorraad"
            className="bg-foreground/15 backdrop-blur-sm border border-foreground/20 hover:bg-foreground/25 px-8 py-3.5 text-[10px] md:text-xs font-body font-medium tracking-[0.25em] uppercase text-foreground transition-all duration-300"
          >
            Bekijk ons aanbod
          </a>
          <Link
            to="/consignatie"
            className="border-b border-foreground/30 hover:border-foreground pb-1 self-end text-[10px] md:text-xs font-body font-medium tracking-[0.25em] uppercase text-foreground/60 hover:text-foreground transition-all duration-300"
          >
            Consignatie verkoop
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.a
        href="#diensten"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-foreground/25 hover:text-foreground/50 transition-colors"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.a>
    </section>
  );
};

export default HeroSection;