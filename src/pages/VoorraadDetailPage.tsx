import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useVoorraadDetail } from "@/hooks/useVoorraadFeed";
import TradeInSection from "@/components/TradeInSection";
import {
  ArrowLeft, Phone, MessageCircle, ShieldCheck, Calendar,
  Gauge, Fuel, Settings2, Paintbrush, Car, X, ChevronLeft,
  ChevronRight, Zap, Droplets, Leaf, DoorOpen, Cog,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fmt = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 });

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 400 : -400, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 400 : -400, opacity: 0 }),
};

const VoorraadDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: vehicle, isLoading, isError } = useVoorraadDetail(id);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState(0);

  const photoUrls = vehicle?.fotos ?? [];

  const navigateLightbox = useCallback(
    (dir: number) => {
      setSlideDirection(dir);
      setSelectedPhoto((prev) => {
        const next = prev + dir;
        if (next < 0) return photoUrls.length - 1;
        if (next >= photoUrls.length) return 0;
        return next;
      });
    },
    [photoUrls.length]
  );

  const title = vehicle ? `${vehicle.merk} ${vehicle.model}` : "Laden...";
  const metaTitle = vehicle
    ? `${vehicle.merk} ${vehicle.model} ${vehicle.bouwjaar || ""} | Platin Automotive`
    : "Voertuig | Platin Automotive";
  const metaDesc = vehicle
    ? `${vehicle.merk} ${vehicle.model}, bouwjaar ${vehicle.bouwjaar || ""}, ${Number(vehicle.kilometerstand || 0).toLocaleString("nl-NL")} km. Te koop bij Platin Automotive.`
    : "";

  const specs = vehicle
    ? [
        { label: "Bouwjaar", value: vehicle.bouwjaar, icon: Calendar },
        { label: "Kilometerstand", value: vehicle.kilometerstand ? `${Number(vehicle.kilometerstand).toLocaleString("nl-NL")} km` : null, icon: Gauge },
        { label: "Brandstof", value: vehicle.brandstof, icon: Fuel },
        { label: "Transmissie", value: vehicle.transmissie, icon: Settings2 },
        { label: "Carrosserie", value: vehicle.carrosserie, icon: Car },
        { label: "Kleur", value: vehicle.kleur, icon: Paintbrush },
        { label: "Vermogen", value: vehicle.vermogen_pk ? `${vehicle.vermogen_pk} pk` : null, icon: Zap },
        { label: "Aandrijving", value: vehicle.extra?.aandrijving || null, icon: Cog },
        { label: "Deuren", value: vehicle.extra?.deuren || null, icon: DoorOpen },
        { label: "Verbruik", value: vehicle.extra?.verbruik ? `${vehicle.extra.verbruik} l/100km` : null, icon: Droplets },
        { label: "Energielabel", value: vehicle.extra?.energielabel || null, icon: Leaf },
      ].filter((s) => s.value)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 flex flex-col items-center justify-center gap-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-body">Voertuig laden…</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">Voertuig niet gevonden</h1>
          <Link to="/voorraad" className="text-primary hover:underline text-sm font-body">
            Terug naar voorraad
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const mainPhoto = photoUrls[selectedPhoto] ?? vehicle.afbeelding ?? "/placeholder.svg";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={`https://platinautomotive.nl/voorraad/${id}`} />
      </Helmet>
      <Navbar />

      <section className="pt-28 pb-20 lg:pb-28">
        <div className="container mx-auto px-5 lg:px-16 max-w-[1920px]">
          {/* Back link */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link
              to="/voorraad"
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Terug naar voorraad
            </Link>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* LEFT — Photos (60%) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:w-[60%]"
            >
              {/* Main photo */}
              <div
                className="aspect-[16/10] overflow-hidden bg-card cursor-pointer relative group"
                onClick={() => photoUrls.length > 0 && setLightboxOpen(true)}
              >
                <img src={mainPhoto} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                {photoUrls.length > 1 && (
                  <span className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 text-[10px] font-body tracking-wider uppercase text-foreground">
                    {selectedPhoto + 1} / {photoUrls.length}
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {photoUrls.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  {photoUrls.slice(0, 20).map((url, i) => (
                    <button
                      key={i}
                      onClick={() => { setSlideDirection(i > selectedPhoto ? 1 : -1); setSelectedPhoto(i); }}
                      className={`shrink-0 w-24 h-16 overflow-hidden border-2 transition-all duration-300 ${
                        i === selectedPhoto ? "border-primary opacity-100" : "border-transparent opacity-50 hover:opacity-90"
                      }`}
                    >
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}

              {/* Specs section */}
              <div className="mt-14">
                <h2 className="text-xl font-display font-semibold text-foreground mb-6 tracking-tight">Specificaties</h2>
                <div className="border border-border divide-y divide-border">
                  {specs.map((spec) => (
                    <div key={spec.label} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <spec.icon className="w-4 h-4" />
                        <span className="text-sm font-body tracking-wide">{spec.label}</span>
                      </div>
                      <span className="text-sm font-body font-medium text-foreground capitalize">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              {vehicle.beschrijving && (
                <div className="mt-14">
                  <h2 className="text-xl font-display font-semibold text-foreground mb-5 tracking-tight">Omschrijving</h2>
                  <p className="text-sm font-body font-light text-muted-foreground leading-relaxed whitespace-pre-line">
                    {vehicle.beschrijving}
                  </p>
                </div>
              )}

              {/* Options */}
              {vehicle.opties && vehicle.opties.length > 0 && (
                <div className="mt-14">
                  <h2 className="text-xl font-display font-semibold text-foreground mb-5 tracking-tight">
                    Opties & Accessoires
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {vehicle.opties.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-sm font-body text-muted-foreground">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <TradeInSection />
            </motion.div>

            {/* RIGHT — Sidebar (40%, sticky) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:w-[40%]"
            >
              <div className="lg:sticky lg:top-8 space-y-7">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight leading-tight">
                    {vehicle.merk} {vehicle.model}
                  </h1>
                  {vehicle.type && (
                    <p className="text-[11px] text-muted-foreground tracking-wide uppercase mt-2">{vehicle.type}</p>
                  )}
                  <p className="text-sm font-body text-muted-foreground mt-3 tracking-wide">
                    {[vehicle.bouwjaar, vehicle.kilometerstand ? `${Number(vehicle.kilometerstand).toLocaleString("nl-NL")} km` : null, vehicle.brandstof]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                <p className="text-4xl md:text-5xl font-display font-bold text-foreground">
                  {vehicle.prijs > 0 ? fmt.format(vehicle.prijs) : "Op aanvraag"}
                </p>

                <div className="flex items-center gap-2 bg-card border border-border px-4 py-2.5 w-fit">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-body font-semibold tracking-[0.2em] uppercase text-foreground">
                    Gecontroleerd & Rijklaar
                  </span>
                </div>

                <div className="space-y-3">
                  <a
                    href="tel:+31612693825"
                    className="flex items-center justify-center gap-2.5 w-full border-2 border-foreground bg-foreground text-background py-4 text-[11px] font-body font-semibold tracking-[0.15em] uppercase transition-all duration-500 hover:bg-primary hover:border-primary hover:text-primary-foreground"
                  >
                    <Phone className="w-4 h-4" />
                    Bel Direct — 06-12693825
                  </a>
                  <a
                    href={`https://wa.me/31612693825?text=${encodeURIComponent(`Hallo, ik heb interesse in de ${vehicle.merk} ${vehicle.model} (${vehicle.bouwjaar || ""}).`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full border-2 border-border text-foreground py-4 text-[11px] font-body font-semibold tracking-[0.15em] uppercase bg-transparent transition-all duration-500 hover:border-foreground hover:bg-foreground hover:text-background"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Stuur WhatsApp
                  </a>
                </div>

                <p className="text-[11px] font-body text-muted-foreground tracking-wide text-center">
                  Proefrit mogelijk? Neem contact op
                </p>

                <div className="border-t border-border pt-6 space-y-4">
                  {specs.slice(0, 6).map((spec) => (
                    <div key={spec.label} className="flex items-center justify-between">
                      <span className="text-[12px] font-body text-muted-foreground">{spec.label}</span>
                      <span className="text-[12px] font-body font-medium text-foreground capitalize">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && photoUrls.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button onClick={() => setLightboxOpen(false)} className="absolute top-5 right-5 text-foreground hover:text-primary transition-colors z-10">
              <X className="w-6 h-6" />
            </button>
            {photoUrls.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors z-10">
                  <ChevronLeft className="w-10 h-10" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors z-10">
                  <ChevronRight className="w-10 h-10" />
                </button>
              </>
            )}
            <div className="relative w-[90vw] h-[85vh] flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">
                <motion.img
                  key={selectedPhoto}
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  src={photoUrls[selectedPhoto]}
                  alt={`${title} foto ${selectedPhoto + 1}`}
                  className="max-w-full max-h-full object-contain absolute"
                />
              </AnimatePresence>
            </div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[11px] font-body tracking-wider text-muted-foreground">
              {selectedPhoto + 1} / {photoUrls.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default VoorraadDetailPage;
