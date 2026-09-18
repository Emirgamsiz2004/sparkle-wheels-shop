import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useVoorraadFeed } from "@/hooks/useVoorraadFeed";
import VoorraadCard from "@/components/VoorraadCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const InventorySection = () => {
  const { data: alleVoertuigen, isLoading } = useVoorraadFeed();
  const voertuigen = alleVoertuigen
    ?.filter((v) => v.dbStatus !== "verkocht")
    ?.sort((a, b) => b.prijs - a.prijs);

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
            {voertuigen && voertuigen.length > 0 && (
              <p className="text-muted-foreground font-body font-light mt-4">
                {voertuigen.length} auto's direct beschikbaar.
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 mt-6 md:mt-0">
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

        {/* Actieve auto's in een compacte slider */}
        {voertuigen && voertuigen.length > 0 && (
          <Carousel
            opts={{ align: "start", slidesToScroll: 1, containScroll: "trimSnaps" }}
            className="relative"
          >
            <CarouselContent className="-ml-5">
              {voertuigen.map((v, i) => (
                <CarouselItem
                  key={v.id}
                  className="basis-full pl-5 sm:basis-1/2 lg:basis-1/3"
                >
                  <div className="h-full">
                    <VoorraadCard voertuig={v} index={i} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {voertuigen.length > 1 && (
              <>
                <CarouselPrevious
                  aria-label="Vorige auto"
                  className="hidden md:flex -left-5 h-11 w-11 border-border bg-background/90 text-foreground hover:bg-foreground hover:text-background disabled:opacity-30"
                />
                <CarouselNext
                  aria-label="Volgende auto"
                  className="hidden md:flex -right-5 h-11 w-11 border-border bg-background/90 text-foreground hover:bg-foreground hover:text-background disabled:opacity-30"
                />
              </>
            )}
          </Carousel>
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

