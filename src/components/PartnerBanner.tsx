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

const repeatedPartners = [...partners, ...partners];

const PartnerTrack = ({ ariaHidden = false }: { ariaHidden?: boolean }) => (
  <div
    aria-hidden={ariaHidden}
    className="flex shrink-0 items-center gap-4 pr-4 md:gap-10 md:pr-10 lg:gap-12 lg:pr-12"
  >
    {repeatedPartners.map((partner, index) => (
      <div
        key={`${partner.name}-${ariaHidden ? "clone" : "main"}-${index}`}
        className="group flex h-[48px] w-[148px] shrink-0 items-center justify-center px-4 transition-all duration-500 md:h-[64px] md:w-[210px] md:px-5 lg:h-[72px] lg:w-[240px]"
      >
        <img
          src={partner.logo}
          alt={`${partner.name} logo`}
          className="max-h-full max-w-full object-contain opacity-80 transition-opacity duration-500 group-hover:opacity-100"
          loading="lazy"
          width={196}
          height={58}
        />
      </div>
    ))}
  </div>
);

const PartnerBanner = () => {
  return (
    <section className="partner-banner overflow-hidden border-y border-border/40 bg-muted/30 py-8 md:py-12">
      <div className="mx-auto mb-6 max-w-7xl px-4 md:mb-8">
        <p className="text-center text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground md:text-xs">
          Onze partners
        </p>
      </div>

      <div className="relative mx-auto max-w-6xl overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent md:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent md:w-40" />

        <div className="flex w-max items-center will-change-transform animate-[scroll-left_60s_linear_infinite] motion-reduce:animate-none">
          <PartnerTrack />
          <PartnerTrack ariaHidden />
        </div>
      </div>
    </section>
  );
};

export default PartnerBanner;
