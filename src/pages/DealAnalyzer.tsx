import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Loader2, TrendingUp, BarChart3, ShieldCheck, Sun, ExternalLink, Package, AlertCircle, Car, Hash, Calendar, Fuel, Gauge, Users, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.svg";

interface ScoreFactoren {
  marge_potentieel: number;
  markt_liquiditeit: number;
  risico_factor: number;
  seizoen_timing: number;
}

interface MarktListing {
  titel: string;
  url: string;
  bron: string;
  beschrijving: string;
  content_snippet: string;
}

interface Optie {
  code: string | null;
  omschrijving: string;
}

interface DealResult {
  kenteken: string;
  merk: string;
  model: string;
  bouwjaar: string | null;
  brandstof: string | null;
  km_stand: string | null;
  kleur: string | null;
  carrosserie: string | null;
  vermogen: string | null;
  vin: string | null;
  aantal_eigenaren: string | null;
  apk_status: string | null;
  voertuig_opties: Optie[];
  vwe_inkoopwaarde: number | null;
  vwe_verkoopwaarde: number | null;
  vwe_handelsprijs: number | null;
  vwe_nieuwprijs: number | null;
  markt_analyse_tekst: string;
  markt_bronnen: string[];
  markt_listings: MarktListing[];
  gemiddelde_marktprijs: number | null;
  aantal_vergelijkbaar: number | null;
  inkoopprijs_klant: number | null;
  deal_score: number;
  ai_advies: string;
  score_factoren: ScoreFactoren;
  geschatte_verkoopprijs: number | null;
  geschatte_standtijd: string | null;
  opties_analyse: string | null;
  aandachtspunten: string[];
}

const formatCurrency = (value: number | null) => {
  if (!value) return "—";
  return `€ ${value.toLocaleString("nl-NL")}`;
};

const getScoreColor = (score: number) => {
  if (score >= 75) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  if (score >= 25) return "text-orange-500";
  return "text-destructive";
};

const getScoreBg = (score: number) => {
  if (score >= 75) return "bg-green-500/10 border-green-500/20";
  if (score >= 50) return "bg-yellow-500/10 border-yellow-500/20";
  if (score >= 25) return "bg-orange-500/10 border-orange-500/20";
  return "bg-destructive/10 border-destructive/20";
};

const getScoreLabel = (score: number) => {
  if (score >= 75) return "Uitstekende deal";
  if (score >= 50) return "Redelijke deal";
  if (score >= 25) return "Matige deal";
  return "Slechte deal";
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-4">
    {children}
  </p>
);

const ScoreBar = ({ label, value, max, icon: Icon }: { label: string; value: number; max: number; icon: any }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] font-body tracking-[0.1em] uppercase text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-display font-bold text-foreground">{value}/{max}</span>
    </div>
    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className={`h-full rounded-full ${value / max >= 0.7 ? "bg-green-500" : value / max >= 0.4 ? "bg-yellow-500" : "bg-destructive"}`}
      />
    </div>
  </div>
);

const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <div>
        <p className="text-[9px] font-body tracking-[0.15em] uppercase text-muted-foreground">{label}</p>
        <p className="text-sm font-body text-foreground">{value}</p>
      </div>
    </div>
  );
};

const ToggleChip = ({ label, active, onClick, disabled }: { label: string; active: boolean | null; onClick: () => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1.5 text-[10px] font-body tracking-[0.1em] uppercase border transition-all disabled:opacity-50 ${
      active === true
        ? "bg-foreground text-background border-foreground"
        : active === false
        ? "bg-destructive/10 text-destructive border-destructive/30"
        : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
    }`}
  >
    {label}
  </button>
);

const DealAnalyzer = () => {
  const [kenteken, setKenteken] = useState("");
  const [vraagprijs, setVraagprijs] = useState("");
  const [kmStand, setKmStand] = useState("");
  const [staat, setStaat] = useState<string>("");
  const [schadevrij, setSchadevrij] = useState<boolean | null>(null);
  const [onderhoudsboekje, setOnderhoudsboekje] = useState<boolean | null>(null);
  const [rookvrij, setRookvrij] = useState<boolean | null>(null);
  const [aantalSleutels, setAantalSleutels] = useState("");
  const [bandenprofiel, setBandenprofiel] = useState<string>("");
  const [opmerkingen, setOpmerkingen] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState<DealResult | null>(null);
  const navigate = useNavigate();

  const toggleBool = (val: boolean | null) => {
    if (val === null) return true;
    if (val === true) return false;
    return null;
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kenteken.trim()) return;

    setLoading(true);
    setResult(null);

    const steps = [
      "RDW voertuigdata ophalen...",
      "VWE taxatie & opties ophalen...",
      "Marktplaats & AutoScout24 doorzoeken...",
      "Perplexity marktanalyse uitvoeren...",
      "AI deal-score berekenen...",
    ];

    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setLoadingStep(steps[stepIndex]);
      }
    }, 5000);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-deal", {
        body: {
          kenteken: kenteken.trim(),
          vraagprijs: vraagprijs.trim() || null,
          km_stand: kmStand.trim() || null,
          staat: staat || null,
          schadevrij,
          onderhoudsboekje,
          rookvrij,
          aantal_sleutels: aantalSleutels.trim() || null,
          bandenprofiel: bandenprofiel || null,
          opmerkingen: opmerkingen.trim() || null,
        },
      });

      clearInterval(stepInterval);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Analyse mislukt");

      setResult(data.data);
      toast.success("Analyse compleet");
    } catch (err: any) {
      console.error("Analyze error:", err);
      toast.error(err.message || "Fout bij analyseren");
    }

    clearInterval(stepInterval);
    setLoading(false);
    setLoadingStep("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="flex items-center justify-between px-6 lg:px-10 py-4">
          <div className="flex items-center gap-6">
            <img src={logo} alt="PLA Auto's" className="h-8 w-auto" />
            <span className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground">
              Deal Analyzer
            </span>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Input Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">Deal Analyzer</h1>
          <p className="text-sm font-body text-muted-foreground mb-8">
            Voer een kenteken in voor een uitgebreide analyse: RDW data, VWE taxatie, opties, live marktprijzen en AI-scoring.
          </p>

          <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[9px] font-body tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Kenteken</label>
              <input
                type="text"
                value={kenteken}
                onChange={(e) => setKenteken(e.target.value.toUpperCase())}
                placeholder="XX-999-X"
                className="w-full bg-transparent border-b border-border py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/50 transition-colors tracking-widest"
                disabled={loading}
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="text-[9px] font-body tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">Vraagprijs klant (optioneel)</label>
              <input
                type="number"
                value={vraagprijs}
                onChange={(e) => setVraagprijs(e.target.value)}
                placeholder="€ 0"
                className="w-full bg-transparent border-b border-border py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/50 transition-colors"
                disabled={loading}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || !kenteken.trim()}
                className="flex items-center gap-2 px-8 py-3 bg-foreground text-background text-[10px] tracking-[0.15em] uppercase font-body font-semibold hover:bg-foreground/90 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Analyseer
              </button>
            </div>
          </form>
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm font-body text-muted-foreground animate-pulse">{loadingStep}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
              {/* Score Hero */}
              <div className={`p-8 border ${getScoreBg(result.deal_score)} text-center`}>
                <SectionTitle>Deal Score</SectionTitle>
                <div className={`text-6xl font-display font-black ${getScoreColor(result.deal_score)} mb-2`}>
                  {result.deal_score}
                </div>
                <p className={`text-sm font-body font-medium ${getScoreColor(result.deal_score)}`}>
                  {getScoreLabel(result.deal_score)}
                </p>
              </div>

              {/* Vehicle Info + VIN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-card border border-border">
                  <SectionTitle>Voertuig</SectionTitle>
                  <h3 className="text-lg font-display font-bold text-foreground mb-3">
                    {result.merk} {result.model}
                  </h3>
                  <div className="space-y-0">
                    <InfoItem icon={Hash} label="VIN / Chassisnummer" value={result.vin} />
                    <InfoItem icon={Calendar} label="Bouwjaar" value={result.bouwjaar} />
                    <InfoItem icon={Fuel} label="Brandstof" value={result.brandstof} />
                    <InfoItem icon={Gauge} label="KM-stand" value={result.km_stand ? `${result.km_stand} km` : null} />
                    <InfoItem icon={Car} label="Carrosserie" value={result.carrosserie} />
                    <InfoItem icon={Users} label="Aantal eigenaren" value={result.aantal_eigenaren} />
                    <InfoItem icon={Shield} label="APK geldig tot" value={result.apk_status} />
                  </div>
                  <span className="inline-block mt-3 px-3 py-1 bg-background text-xs tracking-[0.15em] uppercase font-body font-medium text-foreground border border-border">
                    {result.kenteken}
                  </span>
                </div>

                <div className="p-6 bg-card border border-border">
                  <SectionTitle>AI Advies</SectionTitle>
                  <p className="text-sm font-body text-foreground leading-relaxed mb-4">{result.ai_advies}</p>
                  {result.geschatte_standtijd && (
                    <p className="text-xs font-body text-muted-foreground mb-3">
                      Geschatte standtijd: {result.geschatte_standtijd}
                    </p>
                  )}
                  {result.aandachtspunten && result.aandachtspunten.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-[9px] font-body tracking-[0.15em] uppercase text-muted-foreground mb-2">Aandachtspunten</p>
                      <ul className="space-y-1.5">
                        {result.aandachtspunten.map((punt, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs font-body text-muted-foreground">
                            <AlertCircle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                            {punt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Waarden Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "VWE Inkoop", value: result.vwe_inkoopwaarde },
                  { label: "VWE Verkoop", value: result.vwe_verkoopwaarde },
                  { label: "Handelsprijs", value: result.vwe_handelsprijs },
                  { label: "Gem. Marktprijs", value: result.gemiddelde_marktprijs },
                  { label: result.inkoopprijs_klant ? "Vraagprijs klant" : "Geschatte verkoop", value: result.inkoopprijs_klant || result.geschatte_verkoopprijs },
                ].map((item, i) => (
                  <div key={i} className="p-5 bg-card border border-border">
                    <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-lg font-display font-bold text-foreground">{formatCurrency(item.value)}</p>
                  </div>
                ))}
              </div>

              {/* Score Factoren */}
              {result.score_factoren && (
                <div className="p-6 bg-card border border-border">
                  <SectionTitle>Score Factoren</SectionTitle>
                  <div className="space-y-4">
                    <ScoreBar label="Marge potentieel" value={result.score_factoren.marge_potentieel} max={25} icon={TrendingUp} />
                    <ScoreBar label="Markt liquiditeit" value={result.score_factoren.markt_liquiditeit} max={25} icon={BarChart3} />
                    <ScoreBar label="Risico (hoger = veiliger)" value={result.score_factoren.risico_factor} max={25} icon={ShieldCheck} />
                    <ScoreBar label="Seizoen & timing" value={result.score_factoren.seizoen_timing} max={25} icon={Sun} />
                  </div>
                </div>
              )}

              {/* Opties */}
              {result.voertuig_opties && result.voertuig_opties.length > 0 && (
                <div className="p-6 bg-card border border-border">
                  <SectionTitle>Voertuig Opties ({result.voertuig_opties.length})</SectionTitle>
                  {result.opties_analyse && (
                    <p className="text-sm font-body text-foreground mb-4 leading-relaxed">{result.opties_analyse}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {result.voertuig_opties.map((optie, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border text-xs font-body text-foreground">
                        <Package className="w-3 h-3 text-muted-foreground" />
                        {optie.omschrijving}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Markt Listings */}
              {result.markt_listings && result.markt_listings.length > 0 && (
                <div className="p-6 bg-card border border-border">
                  <SectionTitle>Vergelijkbare Advertenties ({result.markt_listings.length})</SectionTitle>
                  <div className="space-y-3">
                    {result.markt_listings.map((listing, i) => (
                      <a
                        key={i}
                        href={listing.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-background border border-border hover:border-foreground/20 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-body font-medium text-foreground truncate group-hover:text-foreground/80">
                              {listing.titel || "Advertentie"}
                            </p>
                            <p className="text-xs font-body text-muted-foreground mt-1 line-clamp-2">
                              {listing.beschrijving}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[9px] font-body tracking-[0.1em] uppercase text-muted-foreground px-2 py-0.5 border border-border">
                              {listing.bron}
                            </span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Markt Analyse */}
              <div className="p-6 bg-card border border-border">
                <SectionTitle>Uitgebreide Marktanalyse</SectionTitle>
                <p className="text-sm font-body text-muted-foreground leading-relaxed whitespace-pre-line">
                  {result.markt_analyse_tekst}
                </p>
                {result.markt_bronnen && result.markt_bronnen.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-[9px] font-body tracking-[0.15em] uppercase text-muted-foreground mb-2">Bronnen</p>
                    <div className="flex flex-wrap gap-2">
                      {[...new Set(result.markt_bronnen)].map((bron, i) => {
                        try {
                          return (
                            <a key={i} href={bron} target="_blank" rel="noopener noreferrer" className="text-[10px] font-body text-muted-foreground hover:text-foreground underline transition-colors">
                              {new URL(bron).hostname}
                            </a>
                          );
                        } catch { return null; }
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DealAnalyzer;
