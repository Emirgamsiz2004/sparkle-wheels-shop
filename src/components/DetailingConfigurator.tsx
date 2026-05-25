import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Car,
  CarFront,
  Truck,
  Caravan,
  Check,
  Info,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DetailingBookingDialog from "./DetailingBookingDialog";

type VehicleKey =
  | "kleine"
  | "grote"
  | "suv"
  | "pickup"
  | "bestelauto"
  | "bestelbus"
  | "caravan"
  | "vrachtwagen";

type PackageKey = "binnen" | "buiten" | "compleet";

const vehicles: { key: VehicleKey; label: string; example: string; icon: typeof Car }[] = [
  { key: "kleine", label: "Normale auto", example: "bijv. Audi A2 / A3", icon: Car },
  { key: "grote", label: "Grote auto", example: "bijv. Audi A4 / Opel Insignia", icon: CarFront },
  { key: "suv", label: "SUV / Crossover", example: "bijv. Audi Q3 / Q5", icon: CarFront },
  { key: "pickup", label: "Pick-up", example: "bijv. Dodge RAM", icon: Truck },
  { key: "bestelauto", label: "Bestelauto", example: "bijv. VW Caddy", icon: Truck },
  { key: "bestelbus", label: "Bestelbus", example: "bijv. VW Transporter", icon: Truck },
  { key: "caravan", label: "Caravan / Camper", example: "tot 7 meter", icon: Caravan },
  { key: "vrachtwagen", label: "Vrachtwagen", example: "op aanvraag", icon: Truck },
];

const prices: Record<PackageKey, Record<VehicleKey, number>> = {
  binnen: {
    kleine: 89, grote: 99, suv: 109, pickup: 119,
    bestelauto: 99, bestelbus: 109, caravan: 119, vrachtwagen: 119,
  },
  buiten: {
    kleine: 99, grote: 109, suv: 119, pickup: 139,
    bestelauto: 109, bestelbus: 119, caravan: 199, vrachtwagen: 199,
  },
  compleet: {
    kleine: 179, grote: 199, suv: 219, pickup: 249,
    bestelauto: 199, bestelbus: 219, caravan: 299, vrachtwagen: 299,
  },
};

const durations: Record<PackageKey, Record<VehicleKey, number>> = {
  binnen: {
    kleine: 60, grote: 75, suv: 90, pickup: 90,
    bestelauto: 75, bestelbus: 90, caravan: 120, vrachtwagen: 120,
  },
  buiten: {
    kleine: 70, grote: 80, suv: 90, pickup: 100,
    bestelauto: 80, bestelbus: 90, caravan: 150, vrachtwagen: 150,
  },
  compleet: {
    kleine: 130, grote: 155, suv: 180, pickup: 190,
    bestelauto: 155, bestelbus: 180, caravan: 270, vrachtwagen: 270,
  },
};

const packages: {
  key: PackageKey;
  title: string;
  subtitle: string;
  features: string[];
  badge?: string;
}[] = [
  {
    key: "binnen",
    title: "Interieur Reiniging",
    subtitle: "Alleen interieur reinigen",
    features: [
      "Stofzuigen",
      "Matten reinigen",
      "Dashboard afnemen",
      "Ramen binnen reinigen",
      "Bekerhouders & vakjes",
      "Kofferbak reinigen",
    ],
  },
  {
    key: "buiten",
    title: "Exterieur Reiniging",
    subtitle: "Wasbeurt + waxen buiten",
    features: [
      "Handwas buiten",
      "Velgen reinigen",
      "Banden behandelen",
      "Ramen buiten reinigen",
      "Kunststof verzorgen",
      "Deurlijsten reinigen",
      "Waxen",
    ],
  },
  {
    key: "compleet",
    title: "Complete Reiniging",
    subtitle: "Binnen + buiten — alles in één",
    badge: "Meest gekozen",
    features: ["Alles van interieur", "Alles van exterieur"],
  },
];

type Extra = { key: string; label: string; price: number; duur: number; info?: string };

const extrasInterieur: Extra[] = [
  { key: "vlek-std", label: "Vlekverwijdering standaard", price: 55, duur: 40, info: "Verwijdering van lichte vlekken uit bekleding en tapijt. Geschikt voor recente vlekken zoals koffie, frisdrank of modder. Resultaat afhankelijk van vlektype en duur." },
  { key: "vlek-uitg", label: "Vlekverwijdering uitgebreid", price: 110, duur: 80, info: "Intensieve behandeling voor hardnekkige, oudere of diep ingetrokken vlekken. We gebruiken professionele extractiemethoden en speciale reinigingsmiddelen voor het beste resultaat." },
  { key: "schimmel", label: "Schimmelreiniging", price: 65, duur: 40, info: "Grondige verwijdering van schimmelsporen in het interieur. Essentieel bij vochtoverlast of lang stilgestaan voertuigen. Inclusief desinfectie van het ventilatiesysteem." },
  { key: "geur", label: "Geurbehandeling", price: 69, duur: 20, info: "Neutralisatie van ongewenste geuren door ozon- of enzymbehandeling. Effectief tegen huisdiergeuren, rookresten en voedselgeuren. Laat uw auto weer fris ruiken." },
  { key: "rook", label: "Rookgeur verwijderen", price: 120, duur: 80, info: "Specialistische behandeling voor rook- en nicotinegeur. Bevat dieptereiniging van alle stoffen oppervlakken plus ozonbehandeling om geurmoleculen te neutraliseren." },
  { key: "leer", label: "Leerbehandeling", price: 69, duur: 45, info: "Reiniging, voeding en bescherming van lederen bekleding. Voorkomt uitdroging en scheuren. Geeft het leer een zachte, matte finish terug zonder glans." },
  { key: "honden", label: "Hondenharen verwijderen", price: 45, duur: 30, info: "Complete verwijdering van honden- en kattenharen uit alle interieurdelen. We gebruiken speciale borstels en extractietechnieken zelfs uit de kleinste hoekjes." },
  { key: "hemel", label: "Hemel reinigen", price: 65, duur: 40, info: "Voorzichtige reiniging van de hemelbekleding. Verwijdert vlekken, nicotine-aanslag en stof zonder het materiaal te beschadigen of los te laten." },
  { key: "braak", label: "Braaksel/ontlasting reinigen", price: 65, duur: 40, info: "Hygiënische en grondige reiniging na braaksel, urine of ontlasting. Inclusief desinfectie en geurverwijdering. Uitermate geschikt voor ouders en dierenbezitters." },
  { key: "kinderzitje", label: "Kinderzitje reinigen", price: 18, duur: 10, info: "Reiniging van stoffen en kunststof onderdelen van het kinderzitje. Verwijdert kruimels, vlekken en bacteriën voor een veilig en schoon zitje voor uw kind." },
];

const extrasExterieur: Extra[] = [
  { key: "motor", label: "Motorruimte reinigen", price: 35, duur: 25, info: "Voorzichtige reiniging van de motorruimte met ontvetter en beschermende coating. Maakt technische inspecties makkelijker en helpt corrosie te voorkomen." },
  { key: "dak", label: "Dak reinigen en waxen", price: 89, duur: 60, info: "Dieptereiniging en bescherming van cabriodaken, panoramadaken en reguliere daken. Verwijdert mos, vuil en aanslag. Afsluitend met waterafstotende wax." },
  { key: "koplamp", label: "Koplampen polijsten", price: 55, duur: 30, info: "Polijsten van vergeelde of mat geworden koplampen. Herstelt de helderheid en lichtopbrengst voor betere zichtbaarheid en een frissere uitstraling." },
];

const extrasPolijst: Extra[] = [
  { key: "pol-onderdeel", label: "Polijsten per onderdeel", price: 55, duur: 30, info: "Lokaal polijsten van één onderdeel zoals een deur, motorkap of bumper. Geschikt voor lichte krassen, wervels of matte plekken op een specifiek paneel." },
  { key: "pol-1", label: "Polijsten gehele auto (1 staps)", price: 329, duur: 210, info: "Eenstaps polijstbehandeling van de gehele auto. Verwijdert lichte wervels en krassen en geeft de lak een diepe glans terug. Inclusief voor- en nabehandeling." },
  { key: "pol-2", label: "Polijsten gehele auto (2 staps)", price: 499, duur: 330, info: "Tweestaps polijstbehandeling voor het beste resultaat. Eerst grof corrigeren, daarna fijn polijsten voor een spiegelgladde finish zonder holograms of wervels." },
  { key: "klei", label: "Kleien + polijsten", price: 499, duur: 330, info: "Combinatie van klei-behandeling en polijsten. Eerst worden vervuiling en teer met klei verwijderd, daarna wordt de lak gecorrigeerd en gepolijst voor optimaal resultaat." },
  { key: "keramiek", label: "Keramische coating", price: 549, duur: 150, info: "Professionele aanbrenging van een keramische coating. Biedt jarenlange bescherming tegen UV, chemicaliën en vuil. Extreem hydrofoob effect en diepe, langdurige glans." },
];

const allExtras = [...extrasInterieur, ...extrasExterieur, ...extrasPolijst];

const StepBadge = ({ n, label, active }: { n: number; label: string; active: boolean }) => (
  <div className="flex items-center gap-3 mb-6">
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-display font-bold transition-colors ${
        active
          ? "bg-amber-400 text-background"
          : "bg-card text-muted-foreground border border-border"
      }`}
    >
      {n}
    </span>
    <h3 className="text-lg md:text-xl font-display font-semibold text-foreground">
      {label}
    </h3>
  </div>
);

const polishKeys = new Set(extrasPolijst.map((e) => e.key));

// Groepen die elkaar uitsluiten (max 1 tegelijk selecteerbaar)
const exclusiveGroups: string[][] = [
  // Vlekverwijdering: standaard óf uitgebreid
  ["vlek-std", "vlek-uitg"],
  // Volledige polijst/coating-behandelingen: max 1
  ["pol-1", "pol-2", "klei", "keramiek"],
];

const DetailingConfigurator = ({ embedded = false }: { embedded?: boolean }) => {
  const [vehicle, setVehicle] = useState<VehicleKey | null>(null);
  const [pkg, setPkg] = useState<PackageKey | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [autoUpgraded, setAutoUpgraded] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const step2Ref = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);

  // Auto-scroll naar volgend blok op desktop (>=768px)
  useEffect(() => {
    if (!vehicle) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const t = setTimeout(() => {
      step2Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
    return () => clearTimeout(t);
  }, [vehicle]);

  useEffect(() => {
    if (!vehicle || !pkg) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const t = setTimeout(() => {
      step3Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
    return () => clearTimeout(t);
  }, [pkg, vehicle]);

  const toggleExtra = (key: string) => {
    setSelectedExtras((s) => {
      const isOn = s.includes(key);
      let next = isOn ? s.filter((k) => k !== key) : [...s, key];

      // Verwijder conflicterende opties uit dezelfde exclusieve groep
      if (!isOn) {
        const group = exclusiveGroups.find((g) => g.includes(key));
        if (group) {
          next = next.filter((k) => k === key || !group.includes(k));
        }
      }

      // Polijsten vereist een exterieur-reiniging als basis
      if (!isOn && polishKeys.has(key)) {
        if (pkg === "binnen" || pkg === null) {
          setPkg("compleet");
          setAutoUpgraded(true);
        }
      }
      return next;
    });
  };

  const basePrice = vehicle && pkg ? prices[pkg][vehicle] : 0;
  const baseDuur = vehicle && pkg ? durations[pkg][vehicle] : 0;
  const extrasTotal = useMemo(
    () =>
      selectedExtras.reduce((sum, key) => {
        const e = allExtras.find((x) => x.key === key);
        return sum + (e?.price ?? 0);
      }, 0),
    [selectedExtras],
  );
  const extrasDuur = useMemo(
    () =>
      selectedExtras.reduce((sum, key) => {
        const e = allExtras.find((x) => x.key === key);
        return sum + (e?.duur ?? 0);
      }, 0),
    [selectedExtras],
  );
  const total = basePrice + extrasTotal;
  const totalMinuten = baseDuur + extrasDuur;

  const selectedVehicle = vehicles.find((v) => v.key === vehicle);
  const selectedPackage = packages.find((p) => p.key === pkg);
  const selectedExtraObjs = selectedExtras
    .map((k) => allExtras.find((e) => e.key === k))
    .filter(Boolean) as Extra[];

  return (
    <section id="configurator" className={embedded ? "py-10 md:py-12 bg-background scroll-mt-24" : "py-16 md:py-28 bg-background scroll-mt-24"}>
      <div className={embedded ? "px-6 md:px-12 lg:px-16" : "container mx-auto px-6 lg:px-16"}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 md:mb-16"
        >
          <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
            Configurator
          </p>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-3">
            Stel uw pakket samen
          </h2>
          <p className="text-muted-foreground font-body font-light max-w-2xl">
            Kies uw voertuig, selecteer een pakket en boek direct een afspraak.
          </p>
        </motion.div>

        {/* STEP 1 */}
        <div className="mb-12">
          <StepBadge n={1} label="Selecteer uw voertuig" active={true} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {vehicles.map((v) => {
              const Icon = v.icon;
              const isSel = vehicle === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setVehicle(v.key)}
                  className={`group relative p-5 md:p-6 text-left transition-all duration-300 border ${
                    isSel
                      ? "border-amber-400 bg-amber-400/5 shadow-[0_0_0_1px_hsl(45_93%_55%/0.4)]"
                      : "border-border bg-card hover:border-foreground/30 hover:-translate-y-0.5"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 mb-3 transition-colors ${
                      isSel ? "text-amber-400" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                  />
                  <p className="text-sm font-display font-semibold text-foreground">
                    {v.label}
                  </p>
                  <p className="text-xs font-body text-muted-foreground mt-1 leading-snug">
                    {v.example}
                  </p>
                </button>
              );
            })}
          </div>
        </div>


        {/* STEP 2 */}
        <AnimatePresence>
          {vehicle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-12 scroll-mt-24"
            >
              <div ref={step2Ref} />
              <StepBadge n={2} label="Kies uw pakket" active={true} />
              <div className="grid md:grid-cols-3 gap-4 md:gap-5">
                {packages.map((p) => {
                  const isSel = pkg === p.key;
                  const price = prices[p.key][vehicle];
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => {
                        setPkg(p.key);
                        setAutoUpgraded(false);
                      }}
                      className={`relative text-left p-6 md:p-7 transition-all duration-300 border flex flex-col ${
                        isSel
                          ? "border-amber-400 bg-amber-400/5 shadow-[0_0_0_1px_hsl(45_93%_55%/0.4)]"
                          : "border-border bg-card hover:border-foreground/30 hover:-translate-y-0.5"
                      }`}
                    >
                      {p.badge && (
                        <span className="absolute -top-3 left-6 px-3 py-1 text-[10px] tracking-[0.2em] uppercase font-body font-medium bg-amber-400 text-background">
                          {p.badge}
                        </span>
                      )}
                      <h4 className="text-lg font-display font-semibold text-foreground mb-1">
                        {p.title}
                      </h4>
                      <p className="text-xs font-body text-muted-foreground mb-4">
                        {p.subtitle}
                      </p>
                      <p className="text-3xl md:text-4xl font-display font-bold text-foreground mb-5">
                        €{price}
                      </p>
                      <ul className="space-y-2 mb-2">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm font-body text-muted-foreground">
                            <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 3 */}
        <AnimatePresence>
          {vehicle && pkg && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-12 scroll-mt-24"
            >
              <div ref={step3Ref} />
              <StepBadge n={3} label="Voeg extras toe (optioneel)" active={true} />
              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                {[
                  { title: "Interieur", items: extrasInterieur },
                  { title: "Exterieur", items: extrasExterieur },
                  { title: "Polijsten & Coating", items: extrasPolijst },
                ].map((col) => (
                  <div key={col.title} className="border border-border bg-card p-5 md:p-6">
                    <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-2">
                      {col.title}
                    </p>
                    {col.title === "Polijsten & Coating" && (
                      <p className="text-[11px] font-body text-amber-400/90 leading-snug mb-4">
                        Let op: polijsten vereist een gewassen auto. We voegen
                        automatisch een buitenkant-reiniging toe als die nog
                        niet is gekozen.
                      </p>
                    )}
                    <div className="space-y-2 mt-3">
                      {col.items.map((e) => {
                        const checked = selectedExtras.includes(e.key);
                        return (
                          <div
                            key={e.key}
                            className={`w-full text-left flex items-center gap-3 px-3 py-3 border-2 transition-all ${
                              checked
                                ? "border-amber-400 bg-amber-400/10"
                                : "border-border bg-background/40 hover:border-amber-400/50 hover:bg-card"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleExtra(e.key)}
                              aria-pressed={checked}
                              className="flex-1 min-w-0 flex items-center gap-3 text-left"
                            >
                              <span
                                className={`flex-shrink-0 inline-flex items-center justify-center w-5 h-5 border-2 transition-colors ${
                                  checked
                                    ? "bg-amber-400 border-amber-400 text-background"
                                    : "border-muted-foreground/60 bg-background"
                                }`}
                              >
                                {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                              </span>
                              <span className={`flex-1 min-w-0 text-sm font-body leading-tight break-words transition-colors ${checked ? "text-foreground font-medium" : "text-foreground"}`}>
                                {e.label}
                              </span>
                            </button>
                            <span className={`flex-shrink-0 text-sm font-display font-semibold whitespace-nowrap tabular-nums ${checked ? "text-amber-400" : "text-muted-foreground"}`}>
                              +€{e.price}
                            </span>
                            {e.info ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(ev) => ev.stopPropagation()}
                                    className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full border border-border bg-card text-muted-foreground hover:text-amber-400 hover:border-amber-400/50 transition-colors"
                                    aria-label={`Meer informatie over ${e.label}`}
                                  >
                                    <Info className="w-3.5 h-3.5" />
                                  </button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md bg-card border-border">
                                  <DialogHeader>
                                    <DialogTitle className="text-foreground font-display text-lg">
                                      {e.label}
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground font-body text-sm leading-relaxed pt-2">
                                      {e.info}
                                    </DialogDescription>
                                  </DialogHeader>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="flex-shrink-0 w-7 h-7" aria-hidden />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOTAAL */}
        <AnimatePresence>
          {vehicle && pkg && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="border border-amber-400/40 bg-gradient-to-br from-amber-400/5 to-transparent p-6 md:p-8"
            >
              <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-2">
                    Uw keuze
                  </p>
                  <p className="text-base md:text-lg font-display font-semibold text-foreground">
                    {selectedPackage?.title} — {selectedVehicle?.label}
                  </p>
                  {autoUpgraded && (
                    <p className="text-xs font-body text-amber-400 mt-2">
                      ✓ Buitenkant-reiniging automatisch toegevoegd (vereist voor polijsten).
                    </p>
                  )}
                  {selectedExtraObjs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {selectedExtraObjs.map((e) => (
                        <span
                          key={e.key}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-body bg-card border border-border text-foreground"
                        >
                          {e.label}
                          <span className="text-muted-foreground">+€{e.price}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-2xl sm:text-3xl md:text-4xl font-display font-bold tracking-tight text-foreground mt-4 break-words">
                    Totaalprijs: <span className="text-amber-400">€{total}</span>
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-4 bg-amber-400 text-background font-display font-semibold text-sm hover:bg-amber-300 transition-colors"
                  >
                    Afspraak inplannen
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-xs font-body text-muted-foreground">
                    Of bel direct:{" "}
                    <a href="tel:+31620686868" className="text-foreground hover:text-amber-400 transition-colors">
                      06-20686868
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs font-body font-light text-muted-foreground mt-8 leading-relaxed">
          Alle prijzen zijn inclusief 21% BTW.
          <br />
          Afspraak op locatie: Cilinderweg 99, Roelofarendsveen.
        </p>
      </div>

      {vehicle && pkg && selectedPackage && selectedVehicle && (
        <DetailingBookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          summary={`${selectedPackage.title} — ${selectedVehicle.label}`}
          diensten={[
            `${selectedPackage.title} (${selectedVehicle.label}) — €${basePrice}`,
            ...selectedExtraObjs.map((e) => `${e.label} — €${e.price}`),
          ]}
          totalPrice={total}
          geschatteDuur={pkg === "compleet" ? 240 : 150}
        />
      )}
    </section>
  );
};

export default DetailingConfigurator;
