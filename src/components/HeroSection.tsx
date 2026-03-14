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
        <div className="absolute inset-0 bg-background/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      </div>

      {/* Content — left aligned */}
      <div className="relative z-10 flex flex-col justify-center h-full px-6 md:px-[90px] max-w-[1920px] mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-[10px] md:text-xs font-body font-semibold tracking-[0.35em] uppercase text-foreground/50 mb-5"
        >
          Platin Automotive
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-display font-extrabold leading-[0.95] mb-12 text-foreground tracking-tight"
        >
          Occasions kopen
          <br />
          & verkopen
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-wrap gap-4"
        >
          <a
            href="#voorraad"
            className="bg-foreground/15 backdrop-blur-sm border border-foreground/20 hover:bg-primary/20 hover:border-primary/40 px-8 py-3.5 text-[10px] md:text-xs font-body font-medium tracking-[0.25em] uppercase text-foreground transition-all duration-300"
          >
            Bekijk ons aanbod
          </a>
          <Link
            to="/consignatie"
            className="border-b border-foreground/30 hover:border-primary hover:text-primary pb-1 self-end text-[10px] md:text-xs font-body font-medium tracking-[0.25em] uppercase text-foreground/60 transition-all duration-300"
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
