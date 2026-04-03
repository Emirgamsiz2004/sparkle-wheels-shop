import logoAutotrust from "@/assets/logo-autotrust.png";
import logoAutotrack from "@/assets/logo-autotrack.png";
import logoMarktplaats from "@/assets/logo-marktplaats.png";
import logoAutoscout24 from "@/assets/logo-autoscout24.png";
import logoFinanciallease from "@/assets/logo-financiallease.png";

const partners = [
  { name: "AutoTrust", logo: logoAutotrust },
  { name: "AutoTrack", logo: logoAutotrack },
  { name: "Marktplaats", logo: logoMarktplaats },
  { name: "AutoScout24", logo: logoAutoscout24 },
  { name: "FinancialLease.nl", logo: logoFinanciallease },
];

// Duplicate for seamless infinite scroll
const allPartners = [...partners, ...partners];

const PartnerBanner = () => {
  return (
    <section className="py-8 md:py-12 bg-muted/30 border-y border-border/40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-6 md:mb-8">
        <p className="text-center text-[10px] md:text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Onze partners
        </p>
      </div>
      <div className="relative mx-auto max-w-6xl">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />
        
        <div className="flex animate-scroll-left items-center gap-8 md:gap-14 lg:gap-20 w-max">
          {allPartners.map((partner, i) => (
            <div
              key={`${partner.name}-${i}`}
              className="flex items-center justify-center w-[120px] md:w-[160px] lg:w-[180px] h-[36px] md:h-[44px] shrink-0"
            >
              <img
                src={partner.logo}
                alt={`${partner.name} logo`}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
                width={180}
                height={44}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnerBanner;
