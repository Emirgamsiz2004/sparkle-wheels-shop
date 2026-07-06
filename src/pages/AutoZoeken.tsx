import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { ArrowRight, Search, Send, Car, MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceSEOContent from "@/components/ServiceSEOContent";
import verkoopImg from "@/assets/verkoop.jpg";

const zoekSchema = z.object({
  naam: z.string().trim().min(1, "Vul uw naam in").max(100),
  telefoon: z.string().trim().min(1, "Vul uw telefoonnummer in").max(20),
  merk: z.string().trim().min(1, "Vul een merk in").max(100),
  model: z.string().trim().max(100).optional(),
  bouwjaar: z.string().trim().max(20).optional(),
  budget: z.string().trim().max(50).optional(),
  wensen: z.string().trim().max(1000).optional(),
});

const AutoZoeken = () => {
  const [formData, setFormData] = useState({ naam: "", telefoon: "", merk: "", model: "", bouwjaar: "", budget: "", wensen: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = zoekSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const d = result.data;
    const parts = [
      `Hallo, ik ben op zoek naar een auto.`,
      ``,
      `Naam: ${d.naam}`,
      `Telefoon: ${d.telefoon}`,
      `Merk: ${d.merk}`,
      d.model ? `Model: ${d.model}` : "",
      d.bouwjaar ? `Bouwjaar: ${d.bouwjaar}` : "",
      d.budget ? `Budget: ${d.budget}` : "",
      d.wensen ? `\nWensen: ${d.wensen}` : "",
    ].filter(Boolean).join("\n");

    const message = encodeURIComponent(parts);
    window.open(`https://wa.me/31717812525?text=${message}`, "_blank");

    setSubmitted(true);
    toast({ title: "Zoekopdracht verstuurd!", description: "We gaan voor u op zoek." });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Auto Zoeken op Maat | Platin Automotive Roelofarendsveen</title>
        <meta name="description" content="Kunnen we jouw droomauto niet vinden? Platin Automotive zoekt hem voor jou! Gratis zoekopdracht in heel Nederland. Vertel ons wat je zoekt." />
        <link rel="canonical" href="https://platinautomotive.nl/diensten/auto-zoeken" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Auto Zoeken op Maat | Platin Automotive Roelofarendsveen" />
        <meta property="og:description" content="Kunnen we jouw droomauto niet vinden? Platin Automotive zoekt hem voor jou! Gratis zoekopdracht in heel Nederland. Vertel ons wat je zoekt." />
        <meta property="og:url" content="https://platinautomotive.nl/diensten/auto-zoeken" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Auto Zoeken op Maat | Platin Automotive Roelofarendsveen" />
        <meta name="twitter:description" content="Kunnen we jouw droomauto niet vinden? Platin Automotive zoekt hem voor jou! Gratis zoekopdracht in heel Nederland. Vertel ons wat je zoekt." />

      </Helmet>
      <Navbar />

      {/* Hero */}
      <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${verkoopImg})` }}>
          <div className="absolute inset-0 bg-background/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col justify-end h-full container mx-auto px-6 lg:px-16 pb-12 md:pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <Link to="/" className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              Terug naar home
            </Link>
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">Diensten</p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">Auto Zoeken</h1>
          </motion.div>
        </div>
      </section>

      {/* Intro + Form */}
      <section className="py-16 md:py-28 bg-card">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground tracking-tight mb-6 leading-tight">
                Op zoek naar
                <br />
                uw droomauto?
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Heeft u een specifieke auto in gedachten maar staat deze niet in onze voorraad? Geen probleem. 
                  Vertel ons waar u naar zoekt en wij gaan voor u op zoek.
                </p>
                <p className="text-muted-foreground font-body font-light leading-relaxed">
                  Dankzij ons uitgebreide netwerk kunnen wij vrijwel elke auto voor u vinden. 
                  U geeft aan wat u zoekt — wij regelen de rest. Vrijblijvend en zonder verplichtingen.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-px bg-border mt-8">
                {[
                  { icon: Search, label: "Wij zoeken" },
                  { icon: Car, label: "Uw wensen" },
                  { icon: Send, label: "Vrijblijvend" },
                ].map((item) => (
                  <div key={item.label} className="bg-background p-5 md:p-6 flex flex-col items-center text-center">
                    <item.icon className="w-5 h-5 text-muted-foreground mb-3" />
                    <span className="text-[10px] tracking-[0.15em] uppercase font-body font-medium text-muted-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="bg-background p-6 md:p-10 border border-border">
              <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-2">Zoekopdracht</p>
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2">Wat zoekt u?</h3>
              <p className="text-xs font-body font-light text-muted-foreground leading-relaxed mb-8">
                Vul onderstaand formulier in en wij gaan direct voor u op zoek.
              </p>

              {submitted ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 border-2 border-foreground flex items-center justify-center mb-4">
                    <Search className="w-5 h-5 text-foreground" />
                  </div>
                  <p className="text-foreground font-display font-semibold mb-2">Bedankt voor uw zoekopdracht!</p>
                  <p className="text-muted-foreground font-body text-sm font-light">Wij gaan voor u op zoek en nemen contact op zodra we iets vinden.</p>
                  <button onClick={() => { setSubmitted(false); setFormData({ naam: "", telefoon: "", merk: "", model: "", bouwjaar: "", budget: "", wensen: "" }); }} className="mt-6 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Nog een zoekopdracht
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Naam *</label>
                      <input type="text" name="naam" value={formData.naam} onChange={handleChange} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors" placeholder="Uw naam" />
                      {errors.naam && <p className="text-xs text-red-400 mt-1 font-body">{errors.naam}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Telefoon *</label>
                      <input type="tel" name="telefoon" value={formData.telefoon} onChange={handleChange} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors" placeholder="06 - 0000 0000" />
                      {errors.telefoon && <p className="text-xs text-red-400 mt-1 font-body">{errors.telefoon}</p>}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Merk *</label>
                      <input type="text" name="merk" value={formData.merk} onChange={handleChange} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors" placeholder="Bijv. BMW" />
                      {errors.merk && <p className="text-xs text-red-400 mt-1 font-body">{errors.merk}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Model</label>
                      <input type="text" name="model" value={formData.model} onChange={handleChange} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors" placeholder="Bijv. 3-serie" />
                    </div>
                    <div>
                      <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Bouwjaar</label>
                      <input type="text" name="bouwjaar" value={formData.bouwjaar} onChange={handleChange} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors" placeholder="Bijv. 2020" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Budget (indicatie)</label>
                    <input type="text" name="budget" value={formData.budget} onChange={handleChange} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors" placeholder="Bijv. €15.000 - €20.000" />
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Overige wensen</label>
                    <textarea name="wensen" value={formData.wensen} onChange={handleChange} rows={3} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors resize-none" placeholder="Bijv. kleur, uitvoering, automaat, max km-stand..." />
                  </div>
                  <button type="submit" className="group inline-flex items-center gap-3 bg-foreground text-background px-7 py-3.5 text-xs font-semibold tracking-[0.15em] uppercase hover:bg-foreground/90 transition-all duration-300">
                    <Search className="w-3.5 h-3.5" />
                    Zoekopdracht Versturen
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-[10px] font-body text-muted-foreground/60 font-light">Uw zoekopdracht wordt via WhatsApp verstuurd. Vrijblijvend en zonder verplichtingen.</p>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Snel contact */}
      <section className="py-16 md:py-28 bg-background">
        <div className="container mx-auto px-6 lg:px-16 max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-3">Snel contact</p>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground tracking-tight mb-4">Liever direct contact?</h2>
            <p className="text-muted-foreground font-body font-light leading-relaxed mb-8">Bel ons of stuur een WhatsApp berichtje.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+31717812525" className="group inline-flex items-center justify-center gap-3 border border-border px-6 py-3.5 hover:border-foreground/30 transition-all duration-300">
                <Phone className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-xs font-body font-medium text-foreground">071-781 25 25</span>
              </a>
              <a href="https://wa.me/31717812525?text=Hallo%2C%20ik%20ben%20op%20zoek%20naar%20een%20auto." target="_blank" rel="noopener noreferrer" className="group inline-flex items-center justify-center gap-3 border border-border px-6 py-3.5 hover:border-foreground/30 transition-all duration-300">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs font-body font-medium text-foreground">WhatsApp</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <ServiceSEOContent
        sections={[
          {
            heading: "Auto op aanvraag — wij vinden uw droomauto",
            paragraphs: [
              "Zoekt u een specifieke auto die u nergens kunt vinden? Of wilt u juist niet zelf eindeloos doorklikken op Marktplaats en AutoScout24? Bij Platin Automotive in Roelofarendsveen nemen wij de zoektocht uit handen. Wij gebruiken onze brede contacten, taxatie-tools en jarenlange ervaring om binnen uw budget de perfecte auto voor u te vinden — vaak sneller en goedkoper dan u zelf zou kunnen.",
              "Of het nu gaat om een nieuwe Audi A6 Avant met luchtvering, een Porsche 911 met handbak, een BMW M3 Touring, een degelijke gezinsauto of een specifieke kleurstelling in een Range Rover Sport — vertel ons uw wensen en wij gaan op zoek. Werkgebied: heel Nederland, met levering en aflevering in Roelofarendsveen, Alphen, Leiden, Den Haag, Amsterdam en de rest van de Randstad.",
            ],
          },
          {
            heading: "Hoe werkt 'auto zoeken' bij Platin Automotive?",
            paragraphs: [
              "Stap 1 — Wensen in kaart brengen: tijdens een persoonlijk gesprek bespreken wij merk, model, bouwjaar, kilometerstand, uitvoering, opties, kleur en uw maximale budget. Hoe concreter uw wens, hoe sneller wij een match vinden. Twijfelt u tussen modellen? Wij adviseren u graag over restwaarde, onderhoudskosten en betrouwbaarheid.",
              "Stap 2 — Actief zoeken: wij doorzoeken openbare platformen én ons eigen handelsnetwerk van importeurs, dealers, leasemaatschappijen en collega's. Veel auto's verkopen wij voordat ze ooit publiek te koop staan.",
              "Stap 3 — Inspectie en aankoop: zodra wij een potentiële match vinden, controleren wij de auto fysiek op staat, RDW-historie, NAP, schadeverleden en originaliteit. Pas na uw goedkeuring kopen wij de auto namens u in. U weet dus altijd vooraf wat u krijgt.",
              "Stap 4 — Aflevering: wij maken de auto rijklaar, voorzien hem van een poetsbeurt, regelen de tenaamstelling en leveren hem bij u thuis af of u haalt hem op in onze showroom.",
            ],
          },
          {
            heading: "Wat zoeken klanten zoal aan ons over te laten?",
            paragraphs: [
              "Onze klanten vragen ons regelmatig om specifieke uitvoeringen: handbak in een tijd waarin alles automaat wordt, youngtimers tussen 15 en 25 jaar oud, importauto's uit Duitsland of België, low-mileage exemplaren, eerste-eigenaar occasions, of juist een specifiek opbouwjaar met een gewilde optie zoals panoramadak of head-up display.",
              "Ook voor elektrische auto's zoals Tesla Model 3, Polestar 2 en Hyundai Ioniq 5 zoeken wij regelmatig op aanvraag, inclusief informatie over de actuele batterijgezondheid en laadcapaciteit.",
            ],
          },
          {
            heading: "Persoonlijk advies en eerlijke prijzen",
            paragraphs: [
              "U betaalt geen verborgen kosten — onze marge is transparant en wij geven van tevoren aan welke vergoeding wij rekenen. Daarmee voorkomt u onverwachte tegenvallers. Dankzij ons inkoopnetwerk en bulkkortingen bij detailing en transport komen wij vaak op een totaalprijs uit die lager ligt dan particuliere aankoop.",
              "Wij denken bovendien mee over financiering, lease, inruil van uw huidige auto en garantie. Een complete service onder één dak.",
            ],
          },
          {
            heading: "Garantie en service inbegrepen",
            paragraphs: [
              "Elke auto die wij voor u inkopen, krijgt standaard AutoTrust garantie (6 tot 24 maanden) en wordt door onze monteurs rijklaar afgeleverd. Eventuele technische onvolkomenheden worden vooraf opgelost. Zo voorkomt u verrassingen achteraf en geniet u vanaf dag één zorgeloos van uw nieuwe auto.",
            ],
          },
          {
            heading: "Werkgebied en bereikbaarheid",
            paragraphs: [
              "Wij zoeken auto's in heel Nederland, België en Duitsland. Onze klanten komen uit Roelofarendsveen, Alphen aan den Rijn, Leiden, Hoofddorp, Amsterdam, Den Haag, Utrecht, Zoetermeer, Haarlem en verder. Levering op locatie is altijd mogelijk in overleg.",
            ],
          },
          {
            heading: "Start vandaag uw zoekopdracht",
            paragraphs: [
              "Vul het formulier op deze pagina in met uw wensen of bel/WhatsApp 071-781 25 25 voor een snel persoonlijk gesprek. U kunt ook langskomen in onze showroom aan de Cilinderweg 99 in Roelofarendsveen om kennis te maken. Wij reageren altijd binnen één werkdag.",
            ],
          },
        ]}
      />

      <Footer />
    </div>
  );
};

export default AutoZoeken;
