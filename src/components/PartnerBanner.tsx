import logoAutotrust from "@/assets/logo-autotrust.png";
import logoAutotrack from "@/assets/logo-autotrack.svg";
import logoMarktplaats from "@/assets/logo-marktplaats.svg";
import logoAutoscout24 from "@/assets/logo-autoscout24.svg";
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
    <section className="py-8 md:py-10 bg-muted/30 border-y border-border/40 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-5">
        <p className="text-center text-xs md:text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Onze partners
        </p>
      </div>
      <div className="relative">
        <div className="flex animate-scroll-left items-center gap-10 md:gap-20 w-max">
          {allPartners.map((partner, i) => (
            <div
              key={`${partner.name}-${i}`}
              className="flex items-center justify-center h-8 md:h-10 min-w-[100px] md:min-w-[140px] grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={partner.logo}
                alt={`${partner.name} logo`}
                className="h-full w-auto object-contain max-w-[120px] md:max-w-[160px]"
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
