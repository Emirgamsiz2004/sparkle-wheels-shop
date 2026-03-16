import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  ShieldCheck,
  Calendar,
  Gauge,
  Fuel,
  Settings2,
  Paintbrush,
  Car,
  DoorOpen,
  Zap,
  Users,
  FileCheck,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const VoertuigDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: photos } = useQuery({
    queryKey: ["vehicle-photos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_photos")
        .select("*")
        .eq("vehicle_id", id!)
        .order("volgorde", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const getPhotoUrl = (filePath: string) => {
    if (filePath.startsWith("http")) return filePath;
    return `${SUPABASE_URL}/storage/v1/object/public/vehicle-photos/${filePath}`;
  };

  const photoUrls = photos?.map((p) => getPhotoUrl(p.file_path)) ?? [];
  const mainPhoto = photoUrls[selectedPhoto] ?? "/placeholder.svg";

  const navigateLightbox = (dir: number) => {
    setSelectedPhoto((prev) => {
      const next = prev + dir;
      if (next < 0) return photoUrls.length - 1;
      if (next >= photoUrls.length) return 0;
      return next;
    });
  };

  const title = vehicle ? `${vehicle.merk} ${vehicle.model}` : "Laden...";
  const metaTitle = vehicle
    ? `${vehicle.merk} ${vehicle.model} ${vehicle.bouwjaar || ""} | Platin Automotive`
    : "Voertuig | Platin Automotive";
  const metaDesc = vehicle
    ? `${vehicle.merk} ${vehicle.model}, bouwjaar ${vehicle.bouwjaar || ""}, ${(vehicle.kilometerstand ?? 0).toLocaleString("nl-NL")} km. Te koop bij Platin Automotive in Roelofarendsveen.`
    : "";

  const specs = vehicle
    ? [
        { label: "Bouwjaar", value: vehicle.bouwjaar, icon: Calendar },
        { label: "Kilometerstand", value: vehicle.kilometerstand != null ? `${vehicle.kilometerstand.toLocaleString("nl-NL")} km` : null, icon: Gauge },
        { label: "Brandstof", value: vehicle.brandstof, icon: Fuel },
        { label: "Transmissie", value: null, icon: Settings2 }, // no transmissie column yet
        { label: "Kleur", value: vehicle.kleur, icon: Paintbrush },
        { label: "Status", value: vehicle.status, icon: Car },
      ].filter((s) => s.value)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!vehicle) {
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
              className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Terug naar voorraad
            </Link>
          </motion.div>

          {/* Main content: photos + sidebar */}
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
                <img
                  src={mainPhoto}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                {photoUrls.length > 1 && (
                  <span className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-2.5 py-1 text-[9px] font-body tracking-wider uppercase text-foreground">
                    {selectedPhoto + 1} / {photoUrls.length}
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {photoUrls.length > 1 && (
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-2">
                  {photoUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPhoto(i)}
                      className={`shrink-0 w-20 h-14 overflow-hidden border-2 transition-all ${
                        i === selectedPhoto ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Specs section */}
              <div className="mt-12">
                <h2 className="text-lg font-display font-semibold text-foreground mb-6 tracking-tight">Specificaties</h2>
                <div className="border border-border divide-y divide-border">
                  {specs.map((spec) => (
                    <div key={spec.label} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <spec.icon className="w-3.5 h-3.5" />
                        <span className="text-xs font-body tracking-wide">{spec.label}</span>
                      </div>
                      <span className="text-xs font-body font-medium text-foreground capitalize">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              {vehicle.opmerkingen && (
                <div className="mt-12">
                  <h2 className="text-lg font-display font-semibold text-foreground mb-4 tracking-tight">Omschrijving</h2>
                  <p className="text-sm font-body font-light text-muted-foreground leading-relaxed whitespace-pre-line">
                    {vehicle.opmerkingen}
                  </p>
                </div>
              )}

              {/* Trade-in section */}
              <div className="mt-12 border border-border p-6 bg-card">
                <h2 className="text-lg font-display font-semibold text-foreground mb-2 tracking-tight">
                  Wil je jouw auto inruilen?
                </h2>
                <p className="text-xs font-body text-muted-foreground mb-4">
                  Voer je kenteken in en ontvang een vrijblijvend bod.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="AB-123-C"
                    className="flex-1 bg-background border border-border px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground/50 uppercase tracking-widest focus:outline-none focus:border-primary transition-colors"
                  />
                  <button className="bg-foreground text-background px-5 py-2.5 text-[10px] font-body font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all">
                    Bereken
                  </button>
                </div>
              </div>
            </motion.div>

            {/* RIGHT — Sidebar (40%, sticky) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="lg:w-[40%]"
            >
              <div className="lg:sticky lg:top-28 space-y-6">
                {/* Title */}
                <div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight leading-tight">
                    {vehicle.merk} {vehicle.model}
                  </h1>
                  <p className="text-xs font-body text-muted-foreground mt-2 tracking-wide">
                    {[vehicle.bouwjaar, vehicle.kilometerstand != null ? `${vehicle.kilometerstand.toLocaleString("nl-NL")} km` : null, vehicle.brandstof]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>

                {/* Price */}
                {vehicle.verkoopprijs != null && vehicle.verkoopprijs > 0 && (
                  <p className="text-3xl md:text-4xl font-display font-bold text-foreground">
                    € {vehicle.verkoopprijs.toLocaleString("nl-NL")}
                  </p>
                )}

                {/* NAP badge */}
                <div className="flex items-center gap-1.5 bg-card border border-border px-3 py-2 w-fit">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[9px] font-body font-semibold tracking-[0.2em] uppercase text-foreground">
                    NAP Check Goedgekeurd
                  </span>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <a
                    href="tel:+31612693825"
                    className="flex items-center justify-center gap-2.5 w-full bg-foreground text-background py-3.5 text-xs font-body font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    Bel Direct — 06-12693825
                  </a>
                  <a
                    href={`https://wa.me/31612693825?text=${encodeURIComponent(`Hallo, ik heb interesse in de ${vehicle.merk} ${vehicle.model} (${vehicle.bouwjaar || ""}).`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 w-full bg-[hsl(var(--whatsapp))] text-[hsl(var(--whatsapp-foreground))] py-3.5 text-xs font-body font-semibold tracking-[0.15em] uppercase hover:opacity-90 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Stuur WhatsApp
                  </a>
                </div>

                <p className="text-[10px] font-body text-muted-foreground tracking-wide text-center">
                  Proefrit mogelijk? Neem contact op
                </p>

                {/* Quick specs in sidebar */}
                <div className="border-t border-border pt-6 space-y-3">
                  {specs.slice(0, 4).map((spec) => (
                    <div key={spec.label} className="flex items-center justify-between">
                      <span className="text-[11px] font-body text-muted-foreground">{spec.label}</span>
                      <span className="text-[11px] font-body font-medium text-foreground capitalize">{spec.value}</span>
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
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-5 right-5 text-foreground hover:text-primary transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {photoUrls.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground hover:text-primary transition-colors z-10"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground hover:text-primary transition-colors z-10"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <img
              src={photoUrls[selectedPhoto]}
              alt={`${title} foto ${selectedPhoto + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-body tracking-wider text-muted-foreground">
              {selectedPhoto + 1} / {photoUrls.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default VoertuigDetail;
