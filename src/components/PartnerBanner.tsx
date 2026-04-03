import logoAutotrust from "@/assets/logo-autotrust.png";
import logoAutotrack from "@/assets/logo-autotrack.png";

const partners = [
  { name: "AutoTrust", logo: logoAutotrust },
  { name: "AutoTrack", logo: logoAutotrack },
  // Voeg hier meer partners toe
];

// Duplicate for seamless infinite scroll
const allPartners = [...partners, ...partners, ...partners, ...partners];

const PartnerBanner = () => {
  return (
    <section className="py-10 bg-muted/30 border-y border-border/40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <p className="text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Onze partners
        </p>
      </div>
      <div className="relative">
        <div className="flex animate-scroll-left gap-16 w-max">
          {allPartners.map((partner, i) => (
            <div
              key={`${partner.name}-${i}`}
              className="flex items-center justify-center h-14 min-w-[180px] grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={partner.logo}
                alt={`${partner.name} logo`}
                className="h-full w-auto object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerBanner;
