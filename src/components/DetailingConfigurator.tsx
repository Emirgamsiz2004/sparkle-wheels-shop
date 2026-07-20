import { useEffect, useMemo, useState } from "react";
import { Check, MessageCircle, Phone, Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import DetailingBookingDialog from "./DetailingBookingDialog";

type SizeKey = "normaal" | "grootSuv" | "busPickup";
type TabKey = "compleet" | "exterieur" | "interieur" | "polijsten";
type Side = "interieur" | "exterieur" | "beide";

const SIZES: { key: SizeKey; label: string; short: string }[] = [
  { key: "normaal", label: "Normaal", short: "Normaal" },
  { key: "grootSuv", label: "Groot & SUV", short: "Groot / SUV" },
  { key: "busPickup", label: "Bus & Pick-up", short: "Bus / Pick-up" },
];

interface Pkg {
  id: string;
  tab: TabKey;
  side: Side;
  level: 1 | 2 | 3 | null; // null = speciaal
  levelLabel: string;
  name: string;
  forWho: string;
  duration: string;
  totalMinuten: number;
  prices: Record<SizeKey, number>;
  features: string[];
  popular?: boolean;
  tip?: { text: string; to: string };
}

const PKGS: Pkg[] = [
  // Compleet
  {
    id: "compleet-reiniging",
    tab: "compleet", side: "beide", level: 1, levelLabel: "Niveau 1",
    name: "Compleet Reiniging",
    forWho: "Uw auto binnen én buiten weer fris en schoon.",
    duration: "± 3–4 uur", totalMinuten: 210,
    prices: { normaal: 169, grootSuv: 199, busPickup: 219 },
    features: [
      "Handwas met foam & drogen",
      "Velgen, banden & deurstijlen",
      "Ramen binnen en buiten",
      "Interieur stofzuigen incl. kofferbak",
      "Dashboard & kunststoffen reinigen en voeden",
      "Matten reinigen",
      "Spraywax afwerking",
    ],
  },
  {
    id: "compleet-premium",
    tab: "compleet", side: "beide", level: 2, levelLabel: "Niveau 2",
    name: "Compleet Premium",
    forWho: "Diepe glans buiten, dieptereiniging binnen. Ons meest complete dagpakket.",
    duration: "± 1 dag", totalMinuten: 480,
    prices: { normaal: 549, grootSuv: 629, busPickup: 679 },
    popular: true,
    features: [
      "Alles van Compleet Reiniging",
      "Kleibehandeling van de lak",
      "1-staps machinale polijst (swirls & lichte krassen)",
      "Sealant voor maandenlange lakbescherming",
      "Stoelen & bekleding shampooën óf leer reinigen en voeden",
      "Naden, kieren & hemelbekleding",
      "Uitgebreide vlekverwijdering",
    ],
  },
  {
    id: "compleet-signature",
    tab: "compleet", side: "beide", level: 3, levelLabel: "Niveau 3",
    name: "Compleet Signature",
    forWho: "Maximale correctie en jarenlange bescherming met keramische coating.",
    duration: "± 1,5–2 dagen", totalMinuten: 900,
    prices: { normaal: 1099, grootSuv: 1249, busPickup: 1349 },
    features: [
      "Alles van Compleet Premium",
      "Digitale lakdiktemeting vooraf",
      "2-staps lakcorrectie voor maximaal glansherstel",
      "Keramische coating",
      "Velgen- en glascoating",
      "Onderhoudsadvies voor uw coating",
    ],
  },
  {
    id: "verkoopklaar",
    tab: "compleet", side: "beide", level: null, levelLabel: "Speciaal",
    name: "Verkoopklaar",
    forWho: "Uw auto op z'n best voor verkoop of inruil — verdient zichzelf terug in de verkoopprijs.",
    duration: "± 1 dag", totalMinuten: 480,
    prices: { normaal: 499, grootSuv: 569, busPickup: 619 },
    features: [
      "Complete reiniging binnen & buiten",
      "Kleibehandeling + 1-staps polijst",
      "Dieptereiniging interieur",
      "Presentatie-afwerking voor bezichtiging",
      "Optioneel: professionele verkoopfoto's",
    ],
    tip: { text: "Uw auto direct bij ons inruilen kan ook", to: "/#inruil" },
  },
  // Exterieur
  {
    id: "ext-reiniging",
    tab: "exterieur", side: "exterieur", level: 1, levelLabel: "Niveau 1",
    name: "Exterieur Reiniging",
    forWho: "Grondige handwas — de veilige basis voor elke auto.",
    duration: "± 1,5–2 uur", totalMinuten: 120,
    prices: { normaal: 99, grootSuv: 119, busPickup: 129 },
    features: [
      "Handwas met foam & drogen",
      "Velgen & banden reinigen",
      "Bandendressing",
      "Deurstijlen & tankklep",
      "Ramen buiten",
      "Spraywax afwerking",
    ],
  },
  {
    id: "ext-premium",
    tab: "exterieur", side: "exterieur", level: 2, levelLabel: "Niveau 2",
    name: "Exterieur Premium",
    forWho: "Swirls en lichte krassen weg, diepe glans terug.",
    duration: "± halve tot hele dag", totalMinuten: 360,
    prices: { normaal: 399, grootSuv: 449, busPickup: 499 },
    popular: true,
    features: [
      "Alles van Exterieur Reiniging",
      "Kleibehandeling (verwijdert aanslag uit de lak)",
      "1-staps machinale polijst",
      "Sealant voor maandenlange bescherming",
      "Kunststof exterieurdelen voeden",
    ],
  },
  {
    id: "ext-signature",
    tab: "exterieur", side: "exterieur", level: 3, levelLabel: "Niveau 3",
    name: "Exterieur Signature",
    forWho: "Volledige lakcorrectie afgesloten met keramische coating.",
    duration: "± 1,5–2 dagen", totalMinuten: 900,
    prices: { normaal: 999, grootSuv: 1099, busPickup: 1199 },
    features: [
      "Alles van Exterieur Premium",
      "Digitale lakdiktemeting vooraf",
      "2-staps lakcorrectie",
      "Keramische coating",
      "Velgen- en glascoating",
      "Onderhoudsadvies",
    ],
  },
  // Interieur
  {
    id: "int-reiniging",
    tab: "interieur", side: "interieur", level: 1, levelLabel: "Niveau 1",
    name: "Interieur Reiniging",
    forWho: "Fris en stofvrij interieur, klaar in een ochtend.",
    duration: "± 1,5–2 uur", totalMinuten: 120,
    prices: { normaal: 89, grootSuv: 109, busPickup: 109 },
    features: [
      "Interieur stofzuigen incl. kofferbak",
      "Dashboard & kunststoffen reinigen en voeden",
      "Ramen binnen",
      "Matten reinigen",
      "Instaplijsten",
    ],
  },
  {
    id: "int-diepte",
    tab: "interieur", side: "interieur", level: 2, levelLabel: "Niveau 2",
    name: "Interieur Dieptereiniging",
    forWho: "Stoelen, bekleding en naden écht schoon — als nieuw van binnen.",
    duration: "± halve dag", totalMinuten: 240,
    prices: { normaal: 189, grootSuv: 219, busPickup: 229 },
    popular: true,
    features: [
      "Alles van Interieur Reiniging",
      "Stoelen & bekleding shampooën óf leer reinigen en voeden",
      "Naden & kieren detailen",
      "Hemelbekleding oppervlakkig reinigen",
      "Uitgebreide vlekverwijdering",
      "Kofferbak dieptereiniging",
    ],
  },
];

interface AddOn {
  id: string;
  name: string;
  price: number;
}
const INT_ADDONS: AddOn[] = [
  { id: "rookgeur", name: "Rookgeur verwijderen (incl. ozon)", price: 120 },
  { id: "geur-ozon", name: "Geurbehandeling / ozon", price: 69 },
  { id: "schimmel", name: "Schimmelreiniging", price: 65 },
  { id: "braaksel", name: "Braaksel / ontlasting reinigen", price: 65 },
  { id: "hemel", name: "Hemelbekleding intensief reinigen", price: 65 },
  { id: "honden", name: "Hondenharen verwijderen", price: 45 },
  { id: "leer", name: "Leerbehandeling (reinigen + voeden)", price: 69 },
  { id: "vlek", name: "Extra vlekverwijdering (per zone)", price: 55 },
  { id: "kinderzitje", name: "Kinderzitje reinigen", price: 18 },
];
const EXT_ADDONS: AddOn[] = [
  { id: "motorruimte", name: "Motorruimte reinigen & detailen", price: 49 },
  { id: "dak", name: "Dak reinigen & waxen (hoge voertuigen)", price: 89 },
  { id: "koplampen", name: "Koplampen polijsten (set)", price: 55 },
  { id: "spot", name: "Polijsten per onderdeel (spot-correctie)", price: 55 },
];

const WHATSAPP = "https://wa.me/31717812525";

const DetailingConfigurator = () => {
  const [size, setSize] = useState<SizeKey>("normaal");
  const [tab, setTab] = useState<TabKey>("compleet");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addons, setAddons] = useState<Set<string>>(new Set());
  const [bookingOpen, setBookingOpen] = useState(false);

  const selected = useMemo(() => PKGS.find((p) => p.id === selectedId) || null, [selectedId]);

  const intAllowed = selected?.side === "interieur" || selected?.side === "beide";
  const extAllowed = selected?.side === "exterieur" || selected?.side === "beide";

  // Wanneer een pakket geen kant meer dekt, vink die add-ons automatisch uit.
  useEffect(() => {
    if (!selected) { setAddons(new Set()); return; }
    setAddons((prev) => {
      const next = new Set(prev);
      if (!intAllowed) INT_ADDONS.forEach((a) => next.delete(a.id));
      if (!extAllowed) EXT_ADDONS.forEach((a) => next.delete(a.id));
      return next;
    });
  }, [selected, intAllowed, extAllowed]);

  const visiblePackages = useMemo(() => PKGS.filter((p) => p.tab === tab), [tab]);

  const addonsSum = useMemo(() => {
    let sum = 0;
    [...INT_ADDONS, ...EXT_ADDONS].forEach((a) => {
      if (addons.has(a.id)) sum += a.price;
    });
    return sum;
  }, [addons]);

  const total = (selected?.prices[size] ?? 0) + addonsSum;

  const sizeLabel = SIZES.find((s) => s.key === size)!.label;

  const selectedAddonNames = useMemo(
    () => [...INT_ADDONS, ...EXT_ADDONS].filter((a) => addons.has(a.id)).map((a) => a.name),
    [addons],
  );

  const whatsappHref = useMemo(() => {
    if (!selected) return WHATSAPP;
    const msg = `Hoi! Ik wil graag een afspraak maken voor detailing. Pakket: ${selected.name} (${sizeLabel}). Add-ons: ${selectedAddonNames.length ? selectedAddonNames.join(", ") : "geen"}. Richtprijs: vanaf €${total}.`;
    return `${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  }, [selected, sizeLabel, selectedAddonNames, total]);

  const toggleAddon = (id: string) => {
    setAddons((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bookingSummary = selected
    ? `${selected.name} — ${sizeLabel}${selectedAddonNames.length ? ` + ${selectedAddonNames.length} extra's` : ""}`
    : "";

  return (
    <section id="configurator" className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-6 lg:px-16 max-w-6xl">
        {/* Intro */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">
            Detailing pakketten
          </p>
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground mb-4 tracking-tight">
            Kies uw pakket. Wij regelen de rest.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Duidelijke pakketten met vaste vanaf-prijzen. Al het voorbereidende werk (wassen, kleien,
            lakdiktemeting) zit standaard in elk polijst- en coatingpakket.
          </p>
        </div>

        {/* Sticky voertuigmaat */}
        <div className="sticky top-16 z-30 -mx-6 lg:-mx-16 px-6 lg:px-16 bg-background/90 backdrop-blur-md border-y border-white/5 py-4 mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.14em] uppercase text-muted-foreground mb-2 font-semibold">
                Voertuigmaat
              </p>
              <div className="inline-flex bg-card border border-white/10 rounded-xl p-1 w-full md:w-auto">
                {SIZES.map((s) => {
                  const active = size === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setSize(s.key)}
                      className={cn(
                        "flex-1 md:flex-none px-4 md:px-5 py-2 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap",
                        active
                          ? "bg-amber-400 text-background shadow-sm"
                          : "text-white/70 hover:text-white",
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground md:text-right">
              Camper, caravan of vrachtwagen?{" "}
              <a href={WHATSAPP} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline font-medium">
                Vraag een prijs op maat
              </a>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {([
            { key: "compleet", label: "Compleet" },
            { key: "exterieur", label: "Alleen exterieur" },
            { key: "interieur", label: "Alleen interieur" },
          ] as { key: TabKey; label: string }[]).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium transition-all border",
                  active
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-transparent text-white/60 border-white/10 hover:text-white hover:border-white/20",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Cards */}
        <div className="grid gap-5 md:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {visiblePackages.map((p) => {
            const active = selectedId === p.id;
            const price = p.prices[size];
            return (
              <article
                key={p.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-6 transition-all bg-card",
                  p.popular ? "border-amber-400/40" : "border-white/10",
                  active && "ring-2 ring-amber-400 border-amber-400",
                )}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-6 inline-flex items-center gap-1 px-3 py-1 bg-amber-400 text-background rounded-full text-[10px] font-bold tracking-[0.14em] uppercase">
                    <Sparkles className="w-3 h-3" /> Meest gekozen
                  </span>
                )}
                <p className="text-[10px] tracking-[0.14em] uppercase text-amber-400/80 font-semibold mb-2">
                  {p.levelLabel}
                </p>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">{p.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{p.forWho}</p>

                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs text-white/50">vanaf</span>
                  <span key={`${p.id}-${size}`} className="font-display text-3xl font-bold text-foreground animate-in fade-in duration-300">
                    €{price.toLocaleString("nl-NL")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-5">{p.duration}</p>

                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map((f) => {
                    const dim = f.toLowerCase().startsWith("alles van");
                    return (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className={cn("w-4 h-4 mt-0.5 flex-shrink-0", dim ? "text-white/40" : "text-amber-400")} />
                        <span className={cn(dim ? "text-white/55 italic" : "text-white/85")}>{f}</span>
                      </li>
                    );
                  })}
                </ul>

                {p.tip && (
                  <p className="text-xs text-muted-foreground mb-4 pb-4 border-b border-white/5">
                    {p.tip.text} —{" "}
                    <Link to={p.tip.to} className="text-amber-400 hover:underline">meer info</Link>
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedId(active ? null : p.id)}
                  className={cn(
                    "w-full py-3 rounded-xl text-sm font-semibold transition-colors",
                    active
                      ? "bg-white/10 text-white hover:bg-white/15"
                      : "bg-amber-400 text-background hover:bg-amber-300",
                  )}
                >
                  {active ? "Gekozen — klik om te wisselen" : "Kies dit pakket"}
                </button>
              </article>
            );
          })}
        </div>

        {/* Add-ons */}
        <div className="mb-12">
          <h3 className="font-display text-xl md:text-2xl font-semibold text-foreground mb-1">
            Extra's toevoegen
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Selecteer een pakket om extra opties toe te voegen. Prijzen tellen live mee.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            <AddonGroup
              title="Interieur & geur"
              hint="i.c.m. een interieur- of compleet pakket"
              allowed={intAllowed}
              lockedText="Kies eerst een pakket met interieur om deze opties toe te voegen."
              options={INT_ADDONS}
              selected={addons}
              onToggle={toggleAddon}
            />
            <AddonGroup
              title="Exterieur & lak"
              hint="i.c.m. een exterieur- of compleet pakket"
              allowed={extAllowed}
              lockedText="Kies eerst een pakket met exterieur om deze opties toe te voegen."
              options={EXT_ADDONS}
              selected={addons}
              onToggle={toggleAddon}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl mx-auto text-center mb-16 px-4">
          Alle prijzen zijn vanaf-prijzen bij gemiddelde vervuiling. Bij de intake bekijken we uw auto samen
          en bevestigen we de definitieve prijs — vóórdat we beginnen. Polijst- en coatingpakketten zijn altijd
          inclusief volledige exterieurreiniging en kleibehandeling: noodzakelijke voorbereiding voor een
          veilig en duurzaam resultaat.
        </p>

        {/* Zo werkt het */}
        <div>
          <h3 className="font-display text-xl md:text-2xl font-semibold text-foreground text-center mb-8">
            Zo werkt het
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: 1, t: "Kies & boek", d: "Selecteer uw pakket en eventuele extra's en plan uw afspraak in." },
              { n: 2, t: "Intake bij aankomst", d: "We lopen de auto samen na en bevestigen de definitieve prijs vooraf." },
              { n: 3, t: "Wij gaan aan de slag", d: "Onze detailers behandelen uw auto met professionele producten en apparatuur." },
              { n: 4, t: "Oplevering", d: "U ontvangt uw auto terug met onderhoudsadvies om het resultaat lang mooi te houden." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-card p-6">
                <div className="w-9 h-9 rounded-full bg-amber-400 text-background inline-flex items-center justify-center font-bold text-sm mb-3">
                  {s.n}
                </div>
                <h4 className="font-display text-base font-semibold text-foreground mb-2">{s.t}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      {selected && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0c]/95 backdrop-blur border-t border-white/10 shadow-2xl">
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] tracking-[0.14em] uppercase text-white/50 font-semibold">
                  Uw selectie
                </p>
                <p className="text-sm md:text-base text-white font-medium truncate">
                  {selected.name} · {sizeLabel}
                  {selectedAddonNames.length > 0 && (
                    <span className="text-white/60"> · +{selectedAddonNames.length} extra{selectedAddonNames.length === 1 ? "" : "'s"}</span>
                  )}
                </p>
              </div>
              <div className="flex items-baseline gap-2 md:border-l md:border-white/10 md:pl-6">
                <span className="text-xs text-white/50">vanaf</span>
                <span className="font-display text-2xl md:text-3xl font-bold text-amber-400">
                  €{total.toLocaleString("nl-NL")}
                </span>
              </div>
              <div className="grid grid-cols-3 md:flex gap-2 md:gap-3">
                <button
                  type="button"
                  onClick={() => setBookingOpen(true)}
                  className="col-span-3 md:col-span-1 px-5 py-3 rounded-xl bg-amber-400 text-background text-sm font-semibold hover:bg-amber-300 transition-colors"
                >
                  Boek online
                </button>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
                <a
                  href="tel:+31717812525"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  <Phone className="w-4 h-4" /> <span className="hidden sm:inline">071-781 25 25</span><span className="sm:hidden">Bellen</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking dialog (bestaand) */}
      {selected && (
        <DetailingBookingDialog
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          summary={bookingSummary}
          voertuigType={sizeLabel}
          pakket={selected.name}
          extras={selectedAddonNames}
          diensten={[selected.name, ...selectedAddonNames]}
          totalPrice={total}
          totalMinuten={selected.totalMinuten}
        />
      )}
    </section>
  );
};

interface AddonGroupProps {
  title: string;
  hint: string;
  allowed: boolean;
  lockedText: string;
  options: AddOn[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}

const AddonGroup = ({ title, hint, allowed, lockedText, options, selected, onToggle }: AddonGroupProps) => (
  <div
    className={cn(
      "rounded-2xl border p-5 transition-opacity",
      allowed ? "border-white/10 bg-card" : "border-white/5 bg-card/40 opacity-60",
    )}
  >
    <div className="flex items-start justify-between gap-3 mb-1">
      <h4 className="font-display text-base font-semibold text-foreground">{title}</h4>
      {!allowed && <Lock className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />}
    </div>
    <p className="text-xs text-muted-foreground mb-4">{hint}</p>
    {!allowed && (
      <p className="text-xs text-white/50 italic mb-3">{lockedText}</p>
    )}
    <ul className="space-y-1.5">
      {options.map((o) => {
        const checked = selected.has(o.id);
        return (
          <li key={o.id}>
            <button
              type="button"
              disabled={!allowed}
              onClick={() => onToggle(o.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors border",
                !allowed && "cursor-not-allowed border-transparent",
                allowed && checked && "bg-amber-400/10 border-amber-400/40 text-white",
                allowed && !checked && "border-white/5 hover:border-white/15 hover:bg-white/[0.03] text-white/85",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
                  checked ? "bg-amber-400 border-amber-400" : "border-white/25",
                )}
              >
                {checked && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
              </span>
              <span className="flex-1">{o.name}</span>
              <span className={cn("tabular-nums font-medium", checked ? "text-amber-400" : "text-white/60")}>
                €{o.price}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  </div>
);

export default DetailingConfigurator;
