import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useVoorraadFeed } from "@/hooks/useVoorraadFeed";
import VoorraadCard from "@/components/VoorraadCard";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback } from "react";

const InventorySection = () => {
  const { data: alleVoertuigen, isLoading } = useVoorraadFeed();
  // Verberg verkochte voertuigen op de homepage volledig
  const voertuigen = alleVoertuigen?.filter((v) => v.dbStatus !== "verkocht");
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
    loop: false,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <section id="voorraad" className="py-16 md:py-28 lg:py-36 bg-card">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16"
        >
          <div>
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
              Voorraad
            </p>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
              Onze auto's
            </h2>
          </div>
          <div className="flex items-center gap-4 mt-6 md:mt-0">
            {/* Slider nav buttons */}
            {voertuigen && voertuigen.length > 3 && (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={scrollPrev}
                  className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors duration-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={scrollNext}
                  className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground transition-colors duration-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <Link
              to="/voorraad"
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-foreground hover:text-primary transition-colors"
            >
              Bekijk alles
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Slider */}
        {voertuigen && voertuigen.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex gap-5">
                {voertuigen.map((v, i) => (
                  <div
                    key={v.id}
                    className="flex-[0_0_85%] min-w-0 sm:flex-[0_0_calc(50%-10px)] lg:flex-[0_0_calc(33.333%-14px)]"
                  >
                    <VoorraadCard voertuig={v} index={i} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty / fallback */}
        {voertuigen && voertuigen.length === 0 && (
          <div className="border border-border rounded-2xl bg-background p-10 md:p-16 lg:p-20 text-center">
            <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-3">
              Op zoek naar een occasion?
            </h3>
            <p className="text-muted-foreground font-body font-light max-w-md mx-auto mb-8">
              Bekijk ons actuele aanbod op de voorraadpagina.
            </p>
            <Link
              to="/voorraad"
              className="inline-flex items-center gap-2 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              Bekijk Voorraad
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default InventorySection;
