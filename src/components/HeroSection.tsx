import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import heroSlide1 from "@/assets/hero-slide-1.webp";

const GoogleG = () => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

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
  const [reviewData, setReviewData] = useState<{ rating: number; totalRatings: number } | null>(null);

  useEffect(() => {
    supabase.functions.invoke("fetch-google-reviews")
      .then(({ data }) => {
        if (data?.rating) setReviewData({ rating: data.rating, totalRatings: data.totalRatings });
      })
      .catch(() => {});
  }, []);

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

        <motion.a
          href="https://www.google.com/maps/dir/?api=1&destination=Platin+Automotive+Cilinderweg+99+Roelofarendsveen"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open routebeschrijving naar Platin Automotive in Google Maps"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 hover:bg-accent/20 hover:border-accent/40 transition-colors px-4 py-2 mb-6 cursor-pointer"
        >
          <MapPin className="w-3 h-3 text-accent" />
          <span className="text-[10px] md:text-xs font-body font-medium tracking-wider uppercase text-accent">
            Direct aan de A4 · Roelofarendsveen
          </span>
        </motion.a>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="relative text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-display font-extrabold leading-[0.95] mb-6 text-foreground tracking-tight pl-5 md:pl-7"
        >
          <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-accent shadow-[0_0_20px_hsl(var(--accent)/0.6)]" />
          Occasions kopen
          <br />
          <span className="bg-gradient-to-r from-accent via-[hsl(var(--accent-glow))] to-accent bg-clip-text text-transparent">
            &amp; verkopen
          </span>
        </motion.h1>


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

        {/* Subtle Google reviews */}
        {reviewData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-6"
          >
            <Link
              to="/reviews"
              className="group inline-flex items-center gap-2.5 text-foreground/60 hover:text-foreground transition-colors"
              aria-label={`Beoordeeld met ${reviewData.rating.toFixed(1)} sterren op Google`}
            >
              <GoogleG />
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.round(reviewData.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-foreground/20"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] md:text-xs font-body tracking-wider uppercase">
                <span className="font-semibold text-foreground/80">{reviewData.rating.toFixed(1)}</span>
                <span className="text-foreground/40"> · {reviewData.totalRatings} reviews</span>
              </span>
            </Link>
          </motion.div>
        )}

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
