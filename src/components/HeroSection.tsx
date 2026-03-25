import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";
import heroSlide4 from "@/assets/hero-slide-4.jpg";

const slides = [
  { src: heroSlide1, mobilePosition: "center center", desktopPosition: "center center" },
  { src: heroSlide2, mobilePosition: "65% center", desktopPosition: "center center" },
  { src: heroSlide3, mobilePosition: "50% 40%", desktopPosition: "center center" },
  { src: heroSlide4, mobilePosition: "center 40%", desktopPosition: "center center" },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="home" className="relative h-[100svh] w-full overflow-hidden">
      {/* Background slideshow */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1.03 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: isMobile
                ? slides[current].mobilePosition
                : slides[current].desktopPosition,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlays — lighter on mobile for more image visibility */}
      <div className="absolute inset-0 bg-background/40 md:bg-background/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 md:from-background/90 via-background/30 md:via-background/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30 md:to-background/40" />

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
            className="group/cta relative bg-muted border border-border text-foreground px-8 py-3.5 text-[10px] md:text-xs font-body font-semibold tracking-[0.25em] uppercase overflow-hidden transition-all duration-500 hover:border-accent hover:text-accent"
          >
            <span className="absolute inset-0 bg-accent/10 origin-left scale-x-0 group-hover/cta:scale-x-100 transition-transform duration-500 ease-out" />
            <span className="relative z-10">Bekijk ons aanbod</span>
          </a>
          <Link
            to="/consignatie"
            className="relative border-b border-foreground/25 hover:border-accent pb-1 self-end text-[10px] md:text-xs font-body font-medium tracking-[0.25em] uppercase text-foreground/50 hover:text-accent transition-all duration-500"
          >
            Consignatie verkoop
          </Link>
        </motion.div>

        {/* Slide indicators */}
        <div className="flex gap-2 mt-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-[2px] transition-all duration-500 ${
                i === current ? "w-8 bg-foreground/60" : "w-4 bg-foreground/20"
              }`}
            />
          ))}
        </div>
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
