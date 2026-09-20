import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const pakketten = [
  {
    naam: "Compleet Reiniging",
    tag: "Binnen & buiten",
    vanaf: 189,
    duur: "± 3–4 uur",
    groepen: [
      {
        titel: "Exterieur",
        items: [
          "Handwas & zorgvuldig drogen",
          "Velgen, banden & wielkasten",
          "Ramen streeploos",
        ],
      },
      {
        titel: "Interieur",
        items: [
          "Uitzuigen incl. kieren & stoelrails",
          "Dashboard, panelen & stofvrij afnemen",
          "Matten reinigen",
        ],
      },
    ],
  },
  {
    naam: "Reiniging + Polijsten",
    tag: "Meest gekozen",
    vanaf: 449,
    duur: "± halve dag",
    populair: true,
    groepen: [
      {
        titel: "Alles van Compleet Reiniging (exterieur)",
        items: ["Volledige voorreiniging & kleibehandeling van de lak"],
      },
      {
        titel: "Polijsten",
        items: [
          "Machinale 1-staps polijst rondom",
          "Swirls & lichte krassen zichtbaar minder",
          "Kunststof exterieurdelen gevoed",
        ],
      },
      {
        titel: "Bescherming",
        items: ["Sealant — 4 tot 6 maanden bescherming"],
      },
    ],
  },
  {
    naam: "Signature Coating",
    tag: "Lakcorrectie & keramiek",
    vanaf: 1249,
    duur: "± 1,5–2 dagen",
    groepen: [
      {
        titel: "Voorbereiding",
        items: [
          "Volledige reiniging & kleibehandeling",
          "Polijstwerk als basis voor de coating",
        ],
      },
      {
        titel: "Coating",
        items: [
          "Professionele keramische coating",
          "2 tot 5 jaar bescherming",
          "Diepe glans & vuilafstotend",
        ],
      },
      {
        titel: "Nazorg",
        items: ["Onderhoudskit & advies meegegeven"],
      },
    ],
  },
];

const DetailingPakkettenSection = () => {
  return (
    <section className="py-16 md:py-24 bg-background border-t border-border">
      <div className="mx-auto px-5 md:px-[90px] max-w-[1920px]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14"
        >
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-amber-400">
                Auto Detailing
              </p>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
              Detailingpakketten
            </h2>
            <p className="text-muted-foreground font-body font-light mt-4 max-w-xl">
              Drie heldere pakketten met vaste vanaf-prijzen. Definitieve prijs
              altijd vooraf bevestigd bij de intake.
            </p>
          </div>
          <Link
            to="/diensten/auto-detailing"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] uppercase text-foreground hover:text-primary transition-colors shrink-0"
          >
            Alle pakketten & add-ons
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {pakketten.map((p, i) => (
            <motion.div
              key={p.naam}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className={`relative flex flex-col h-full rounded-xl border p-7 bg-card ${
                p.populair ? "border-amber-400/50" : "border-border"
              }`}
            >
              {p.populair && (
                <span className="absolute -top-2.5 left-7 bg-amber-400 text-background text-[10px] font-semibold tracking-[0.15em] uppercase px-2.5 py-1 rounded">
                  Meest gekozen
                </span>
              )}
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                {p.tag}
              </p>
              <h3 className="text-xl font-display font-bold text-foreground mb-3">
                {p.naam}
              </h3>
              <p className="font-display text-3xl font-bold text-foreground mb-1">
                vanaf €{p.vanaf.toLocaleString("nl-NL")}
              </p>
              <p className="text-xs text-muted-foreground mb-6">{p.duur}</p>

              <div className="space-y-5 mb-8 flex-1">
                {p.groepen.map((g) => (
                  <div key={g.titel}>
                    <p className="text-[10px] tracking-[0.25em] uppercase text-foreground/80 font-semibold mb-2">
                      {g.titel}
                    </p>
                    <ul className="space-y-2">
                      {g.items.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2.5 text-sm font-body text-muted-foreground"
                        >
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <Link
                to="/diensten/auto-detailing"
                className="group inline-flex items-center justify-center gap-2 w-full bg-foreground text-background px-5 py-3 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-lg"
              >
                Bekijk & boek
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DetailingPakkettenSection;
