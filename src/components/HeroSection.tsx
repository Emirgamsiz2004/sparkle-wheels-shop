import { motion } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section id="home" className="relative h-screen w-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-background/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-start justify-center h-full px-6 lg:px-16 max-w-6xl mx-auto">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 48 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="h-px bg-foreground/50 mb-8"
        />

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-[10px] md:text-xs tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-5"
        >
          In- & Verkoop · Onderhoud · Detailing
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold leading-[0.95] mb-8 text-foreground tracking-tight"
        >
          Uw auto
          <br />
          <span className="text-gradient">in de beste</span>
          <br />
          handen.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-sm md:text-base text-muted-foreground max-w-sm mb-10 font-body font-light leading-relaxed"
        >
          Persoonlijke service, eerlijke prijzen en vakmanschap waar u op kunt vertrouwen.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <a
            href="#diensten"
            className="group flex items-center gap-3 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-foreground/90 transition-all duration-300"
          >
            Bekijk Diensten
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#contact"
            className="flex items-center gap-3 border border-foreground/20 text-foreground px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:border-foreground/50 hover:bg-foreground/5 transition-all duration-300"
          >
            Neem Contact Op
          </a>
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