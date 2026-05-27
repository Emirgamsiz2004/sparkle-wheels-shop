import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ChevronDown, Phone, CalendarCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const sections: { title: string; content: React.ReactNode }[] = [
  {
    title: "Wat doet Platin Automotive voor u?",
    content: (
      <div className="space-y-3">
        <p>Platin Automotive verzorgt het volledige verkooptraject van uw voertuig, waaronder:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Grondige technische inspectie</li>
          <li>Professionele fotografie</li>
          <li>Grondige interieur- en exterieurreiniging</li>
          <li>Adverteren op Marktplaats, AutoScout24, AutoTrack, Gaspedaal en Autoweek</li>
          <li>Klantcontact, bezichtigingen en onderhandelingen</li>
          <li>Volledige verkoopdocumentatie en afhandeling</li>
        </ul>
      </div>
    ),
  },
  {
    title: "Uw voertuig blijft uw eigendom",
    content: (
      <p>
        Uw voertuig blijft gedurende het gehele traject volledig uw eigendom totdat de verkoop definitief is afgerond
        en de koopsom volledig is voldaan. Platin Automotive treedt op als bemiddelaar en verkoopt het voertuig op
        eigen naam, zodat u als eigenaar nergens naar om hoeft te kijken. Wij zijn het aanspreekpunt voor de koper voor
        alle zaken rondom de verkoop.
      </p>
    ),
  },
  {
    title: "Technische inspectie",
    content: (
      <p>
        Voorafgaand aan de consignatieperiode voeren wij een grondige technische inspectie uit, vergelijkbaar met een
        aankoopkeuring. Wij staan uitsluitend achter voertuigen die wij technisch verantwoord achten om te verkopen.
        Zijn er gebreken? Dan bespreken wij dit altijd vooraf met u. Herstel van gebreken is voor rekening van de
        eigenaar en wordt uitgevoerd in overleg.
      </p>
    ),
  },
  {
    title: "Verkoopprijs en commissie",
    content: (
      <p>
        U spreekt samen met ons een minimale verkoopprijs af. Wij verkopen uw voertuig nooit onder deze prijs zonder
        uw toestemming. U kunt de minimumprijs tussentijds aanpassen in overleg met ons. Bij succesvolle verkoop
        ontvangt Platin Automotive een commissie van 10% over de verkoopprijs, tenzij schriftelijk anders
        overeengekomen. U ontvangt het restbedrag binnen 5 werkdagen na verkoop via bankoverschrijving.
      </p>
    ),
  },
  {
    title: "Looptijd en verlenging",
    content: (
      <p>
        De standaard looptijd is 3 maanden. Is uw voertuig na 3 maanden niet verkocht? Dan krijgt u uw auto kosteloos
        terug — u betaalt niets. Wilt u verlengen? Dat kan in onderling overleg voor eenzelfde of kortere periode.
      </p>
    ),
  },
  {
    title: "Tussentijds opzeggen",
    content: (
      <div className="space-y-3">
        <p>
          Tussentijds beëindigen kan met een schriftelijke opzegtermijn van 7 dagen. Bij tussentijdse opzegging brengen
          wij uitsluitend de werkelijk gemaakte kosten in rekening:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Advertentiekosten op alle platforms (op basis van een gespecificeerde factuur)</li>
          <li>Poetsbeurt exterieur: €150,00 incl. BTW, indien uitgevoerd</li>
          <li>
            Grondige interieurreiniging: €100,00 incl. BTW, alleen indien noodzakelijk en vooraf schriftelijk
            overeengekomen
          </li>
        </ul>
        <p>Is de overeenkomst op natuurlijke wijze verlopen en de auto niet verkocht? Dan betaalt u niets.</p>
      </div>
    ),
  },
  {
    title: "Garantie",
    content: (
      <p>
        Wij bieden kopers de mogelijkheid een garantiepakket af te sluiten via Autotrust. De garantieafhandeling loopt
        volledig via Platin Automotive — u hoeft hier als eigenaar niets voor te doen. De garantiekosten worden altijd
        vooraf met u besproken en verrekend met uw uitbetaling.
      </p>
    ),
  },
  {
    title: "APK",
    content: (
      <p>
        Wij adviseren een geldige APK bij aanvang van de consignatieperiode. Is de APK verlopen of bijna verlopen? Dan
        bespreken wij dit vooraf en kunnen wij de APK-keuring in overleg regelen. De kosten hiervan worden verrekend
        met de uitbetaling aan de eigenaar. Voertuigen op ons terrein zijn gedekt via onze handelaarsverzekering.
      </p>
    ),
  },
  {
    title: "Uitbetaling",
    content: (
      <p>
        Na definitieve verkoop betalen wij het nettobedrag — verkoopprijs minus commissie en eventuele verrekende
        kosten — binnen 5 werkdagen aan u over via bankoverschrijving op het door u opgegeven rekeningnummer.
      </p>
    ),
  },
];

const ConsignatieVoorwaarden = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Consignatievoorwaarden | Platin Automotive</title>
        <meta
          name="description"
          content="Alles wat u moet weten over het consignatietraject bij Platin Automotive: commissie, looptijd, garantie, uitbetaling en meer."
        />
        <link rel="canonical" href="https://platinautomotive.nl/consignatie-voorwaarden" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-background border-b border-border">
        <div className="container mx-auto px-6 lg:px-16 max-w-3xl text-center">
          <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-4">
            Voorwaarden
          </p>
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight mb-4">
            Consignatievoorwaarden
          </h1>
          <p className="text-sm md:text-base font-body font-light text-muted-foreground">
            Alles wat u moet weten over ons consignatietraject
          </p>
        </div>
      </section>

      {/* Introductie */}
      <section className="py-14">
        <div className="container mx-auto px-6 lg:px-16 max-w-3xl">
          <p className="text-sm md:text-base font-body font-light text-muted-foreground leading-relaxed">
            Platin Automotive verzorgt het volledige verkooptraject van uw voertuig. Uw auto blijft uw eigendom totdat
            deze verkocht is. Wij verkopen de auto op onze naam zodat u nergens naar om hoeft te kijken — wij zijn het
            aanspreekpunt voor de koper voor alles, inclusief garantie en eventuele klachten.
          </p>
        </div>
      </section>

      {/* Accordion */}
      <section className="pb-20">
        <div className="container mx-auto px-6 lg:px-16 max-w-3xl">
          <div className="border-t border-border">
            {sections.map((s, i) => {
              const open = openIndex === i;
              return (
                <div key={i} className="border-b border-border">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="w-full flex items-center gap-4 py-5 text-left group"
                  >
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-[11px] font-body font-medium transition-colors ${
                        open
                          ? "border-foreground text-foreground"
                          : "border-border text-muted-foreground group-hover:border-foreground/40"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-sm md:text-base font-display font-semibold text-foreground">
                      {s.title}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
                        open ? "rotate-180 text-foreground" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-6 pl-12 pr-2 text-sm font-body font-light text-muted-foreground leading-relaxed">
                        {s.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20 bg-card/30">
        <div className="container mx-auto px-6 lg:px-16 max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-3">
            Interesse in consignatie?
          </h2>
          <p className="text-sm font-body font-light text-muted-foreground mb-8">
            Neem contact met ons op voor een vrijblijvende taxatie en kennismaking.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/afspraak"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[10px] tracking-[0.2em] uppercase font-body font-medium bg-foreground text-background hover:bg-foreground/90 transition-all"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              Maak een afspraak
            </Link>
            <a
              href="tel:+31717812525"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[10px] tracking-[0.2em] uppercase font-body font-medium border border-border text-foreground hover:border-foreground/40 transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              Bel ons: 071-781 25 25
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ConsignatieVoorwaarden;
