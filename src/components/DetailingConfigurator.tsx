import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Car,
  CarFront,
  Truck,
  Caravan,
  Check,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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

const packages: {
  key: PackageKey;
  title: string;
  features: string[];
  badge?: string;
}[] = [
  {
    key: "binnen",
    title: "Alleen Binnenkant",
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
    title: "Alleen Buitenkant",
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
    title: "Compleet",
    badge: "Meest gekozen",
    features: ["Alles van binnenkant", "Alles van buitenkant"],
  },
];

type Extra = { key: string; label: string; price: number };

const extrasInterieur: Extra[] = [
  { key: "vlek-std", label: "Vlekverwijdering standaard", price: 55 },
  { key: "vlek-uitg", label: "Vlekverwijdering uitgebreid", price: 110 },
  { key: "schimmel", label: "Schimmelreiniging", price: 65 },
  { key: "geur", label: "Geurbehandeling", price: 69 },
  { key: "rook", label: "Rookgeur verwijderen", price: 120 },
  { key: "leer", label: "Leerbehandeling", price: 69 },
  { key: "honden", label: "Hondenharen verwijderen", price: 45 },
  { key: "hemel", label: "Hemel reinigen", price: 65 },
  { key: "braak", label: "Braaksel/ontlasting reinigen", price: 65 },
  { key: "kinderzitje", label: "Kinderzitje reinigen", price: 18 },
];

const extrasExterieur: Extra[] = [
  { key: "motor", label: "Motorruimte reinigen", price: 35 },
  { key: "dak", label: "Dak reinigen en waxen", price: 89 },
  { key: "koplamp", label: "Koplampen polijsten", price: 55 },
];

const extrasPolijst: Extra[] = [
  { key: "pol-onderdeel", label: "Polijsten per onderdeel", price: 55 },
  { key: "pol-1", label: "Polijsten gehele auto (1 staps)", price: 329 },
  { key: "pol-2", label: "Polijsten gehele auto (2 staps)", price: 499 },
  { key: "klei", label: "Kleien + polijsten", price: 499 },
  { key: "keramiek", label: "Keramische coating", price: 549 },
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

const DetailingConfigurator = () => {
  const [vehicle, setVehicle] = useState<VehicleKey | null>(null);
  const [pkg, setPkg] = useState<PackageKey | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  const toggleExtra = (key: string) =>
    setSelectedExtras((s) =>
      s.includes(key) ? s.filter((k) => k !== key) : [...s, key],
    );

  const basePrice = vehicle && pkg ? prices[pkg][vehicle] : 0;
  const extrasTotal = useMemo(
    () =>
      selectedExtras.reduce((sum, key) => {
        const e = allExtras.find((x) => x.key === key);
        return sum + (e?.price ?? 0);
      }, 0),
    [selectedExtras],
  );
  const total = basePrice + extrasTotal;

  const selectedVehicle = vehicles.find((v) => v.key === vehicle);
  const selectedPackage = packages.find((p) => p.key === pkg);
  const selectedExtraObjs = selectedExtras
    .map((k) => allExtras.find((e) => e.key === k))
    .filter(Boolean) as Extra[];

  return (
    <section className="py-16 md:py-28 bg-background">
      <div className="container mx-auto px-6 lg:px-16">
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
              className="mb-12"
            >
              <StepBadge n={2} label="Kies uw pakket" active={true} />
              <div className="grid md:grid-cols-3 gap-4 md:gap-5">
                {packages.map((p) => {
                  const isSel = pkg === p.key;
                  const price = prices[p.key][vehicle];
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPkg(p.key)}
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
                      <h4 className="text-lg font-display font-semibold text-foreground mb-2">
                        {p.title}
                      </h4>
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
              className="mb-12"
            >
              <StepBadge n={3} label="Voeg extras toe (optioneel)" active={true} />
              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                {[
                  { title: "Interieur", items: extrasInterieur },
                  { title: "Exterieur", items: extrasExterieur },
                  { title: "Polijsten & Coating", items: extrasPolijst },
                ].map((col) => (
                  <div key={col.title} className="border border-border bg-card p-5 md:p-6">
                    <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-4">
                      {col.title}
                    </p>
                    <div className="space-y-3">
                      {col.items.map((e) => {
                        const checked = selectedExtras.includes(e.key);
                        return (
                          <label
                            key={e.key}
                            className="flex items-start gap-3 cursor-pointer group"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleExtra(e.key)}
                              className="mt-0.5 border-border data-[state=checked]:bg-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:text-background"
                            />
                            <div className="flex-1 flex items-baseline justify-between gap-2">
                              <span className="text-sm font-body text-foreground group-hover:text-amber-400 transition-colors">
                                {e.label}
                              </span>
                              <span className="text-sm font-display font-semibold text-muted-foreground whitespace-nowrap">
                                +€{e.price}
                              </span>
                            </div>
                          </label>
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
                  <p className="text-3xl md:text-4xl font-display font-bold text-foreground mt-4">
                    Totaalprijs: <span className="text-amber-400">€{total}</span>
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-2">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-6 py-4 bg-amber-400 text-background font-display font-semibold text-sm hover:bg-amber-300 transition-colors"
                  >
                    Afspraak maken
                    <ArrowRight className="w-4 h-4" />
                  </Link>
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
    </section>
  );
};

export default DetailingConfigurator;
