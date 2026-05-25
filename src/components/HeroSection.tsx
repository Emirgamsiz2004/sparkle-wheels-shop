import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import heroSlide1 from "@/assets/hero-slide-1.webp";

const lazySlideImports = [
  () => import("@/assets/hero-slide-2.webp"),
  () => import("@/assets/hero-slide-3.webp"),
  () => import("@/assets/hero-slide-4.webp"),
];

const slidePositions = [
  { mobilePosition: "center center", desktopPosition: "center center" },
  { mobilePosition: "65% center", desktopPosition: "center center" },
  { mobilePosition: "50% 40%", desktopPosition: "center center" },
  { mobilePosition: "center 40%", desktopPosition: "center center" },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const isMobile = useIsMobile();
  const [slideSrcs, setSlideSrcs] = useState<string[]>([heroSlide1]);
  const loaded = useRef(false);

  // Load remaining slides after page is idle
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const load = () => {
      Promise.all(lazySlideImports.map(fn => fn())).then(modules => {
        setSlideSrcs([heroSlide1, ...modules.map(m => m.default)]);
      });
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(load);
    } else {
      setTimeout(load, 200);
    }
  }, []);

  useEffect(() => {
    if (slideSrcs.length < 4) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(timer);
  }, [slideSrcs.length]);

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
            src={slideSrcs[current] || slideSrcs[0]}
            alt="Platin Automotive showroom"
            className="absolute inset-0 w-full h-full object-cover"
            width={1200}
            height={800}
            loading="eager"
            fetchPriority={current === 0 ? "high" : "auto"}
            decoding={current === 0 ? "sync" : "async"}
            style={{
              objectPosition: isMobile
                ? slidePositions[current].mobilePosition
                : slidePositions[current].desktopPosition,
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 mb-6"
        >
          <MapPin className="w-3 h-3 text-accent" />
          <span className="text-[10px] md:text-xs font-body font-medium tracking-wider uppercase text-accent">
            Direct aan de A4 · Roelofarendsveen
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-display font-extrabold leading-[0.95] mb-6 text-foreground tracking-tight"
        >
          Occasions kopen
          <br />
          & verkopen
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-xs md:text-sm font-body text-foreground/50 mb-8 max-w-md"
        >
          Snel en eenvoudig bereikbaar vanaf de A4. Kom langs voor eerlijke prijzen, persoonlijk advies en een betrouwd aanbod.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-wrap gap-4"
        >
          <Link
            to="/voorraad"
            className="group/cta relative bg-muted border border-border text-foreground px-8 py-3.5 text-[10px] md:text-xs font-body font-semibold tracking-[0.25em] uppercase overflow-hidden transition-all duration-500 hover:border-accent hover:text-accent"
          >
            <span className="absolute inset-0 bg-accent/10 origin-left scale-x-0 group-hover/cta:scale-x-100 transition-transform duration-500 ease-out" />
            <span className="relative z-10">Bekijk ons aanbod</span>
          </Link>
          <Link
            to="/consignatie"
            className="relative border-b border-foreground/25 hover:border-accent pb-1 self-end text-[10px] md:text-xs font-body font-medium tracking-[0.25em] uppercase text-foreground/50 hover:text-accent transition-all duration-500"
          >
            Consignatie verkoop
          </Link>
        </motion.div>

        {/* Slide indicators */}
        <div className="flex gap-2 mt-10">
          {slidePositions.map((_, i) => (
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
