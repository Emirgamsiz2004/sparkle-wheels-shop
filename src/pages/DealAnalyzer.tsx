import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Loader2, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Clock, ShieldCheck, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.svg";

interface ScoreFactoren {
  marge_potentieel: number;
  markt_liquiditeit: number;
  risico_factor: number;
  seizoen_timing: number;
}

interface DealResult {
  kenteken: string;
  merk: string;
  model: string;
  bouwjaar: string | null;
  brandstof: string | null;
  km_stand: string | null;
  vwe_inkoopwaarde: number | null;
  vwe_verkoopwaarde: number | null;
  vwe_handelsprijs: number | null;
  vwe_nieuwprijs: number | null;
  markt_analyse_tekst: string;
  markt_bronnen: string[];
  inkoopprijs_klant: number | null;
  deal_score: number;
  ai_advies: string;
  score_factoren: ScoreFactoren;
  geschatte_verkoopprijs: number | null;
  geschatte_standtijd: string | null;
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

const DealAnalyzer = () => {
  const [kenteken, setKenteken] = useState("");
  const [vraagprijs, setVraagprijs] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState<DealResult | null>(null);
  const navigate = useNavigate();

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kenteken.trim()) return;

    setLoading(true);
    setResult(null);

    const steps = [
      "VWE taxatie ophalen...",
      "Marktprijzen doorzoeken...",
      "AI-analyse genereren...",
    ];

    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setLoadingStep(steps[stepIndex]);
      }
    }, 4000);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-deal", {
        body: { kenteken: kenteken.trim(), vraagprijs: vraagprijs.trim() || null },
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

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            Deal Analyzer
          </h1>
          <p className="text-sm font-body text-muted-foreground mb-8">
            Voer een kenteken in voor een volledig automatische deal-analyse met VWE-taxatie, marktonderzoek en AI-scoring.
          </p>

          <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-[9px] font-body tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">
                Kenteken
              </label>
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
              <label className="text-[9px] font-body tracking-[0.2em] uppercase text-muted-foreground mb-1.5 block">
                Vraagprijs klant (optioneel)
              </label>
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
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                Analyseer
              </button>
            </div>
          </form>
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm font-body text-muted-foreground animate-pulse">
                {loadingStep}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Score Hero */}
              <div className={`p-8 border ${getScoreBg(result.deal_score)} text-center`}>
                <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-3">
                  Deal Score
                </p>
                <div className={`text-6xl font-display font-black ${getScoreColor(result.deal_score)} mb-2`}>
                  {result.deal_score}
                </div>
                <p className={`text-sm font-body font-medium ${getScoreColor(result.deal_score)}`}>
                  {getScoreLabel(result.deal_score)}
                </p>
              </div>

              {/* Vehicle Info + Advice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-card border border-border">
                  <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-4">
                    Voertuig
                  </p>
                  <h3 className="text-lg font-display font-bold text-foreground mb-2">
                    {result.merk} {result.model}
                  </h3>
                  <p className="text-xs font-body text-muted-foreground">
                    {result.bouwjaar || "—"} · {result.km_stand || "—"} km · {result.brandstof || "—"}
                  </p>
                  <span className="inline-block mt-3 px-3 py-1 bg-background text-xs tracking-[0.15em] uppercase font-body font-medium text-foreground border border-border">
                    {result.kenteken}
                  </span>
                </div>

                <div className="p-6 bg-card border border-border">
                  <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-4">
                    AI Advies
                  </p>
                  <p className="text-sm font-body text-foreground leading-relaxed">
                    {result.ai_advies}
                  </p>
                  {result.geschatte_standtijd && (
                    <p className="text-xs font-body text-muted-foreground mt-3">
                      Geschatte standtijd: {result.geschatte_standtijd}
                    </p>
                  )}
                </div>
              </div>

              {/* Waarden Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 bg-card border border-border">
                  <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider mb-1">VWE Inkoop</p>
                  <p className="text-lg font-display font-bold text-foreground">{formatCurrency(result.vwe_inkoopwaarde)}</p>
                </div>
                <div className="p-5 bg-card border border-border">
                  <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider mb-1">VWE Verkoop</p>
                  <p className="text-lg font-display font-bold text-foreground">{formatCurrency(result.vwe_verkoopwaarde)}</p>
                </div>
                <div className="p-5 bg-card border border-border">
                  <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider mb-1">Handelsprijs</p>
                  <p className="text-lg font-display font-bold text-foreground">{formatCurrency(result.vwe_handelsprijs)}</p>
                </div>
                <div className="p-5 bg-card border border-border">
                  <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider mb-1">
                    {result.inkoopprijs_klant ? "Vraagprijs klant" : "Geschatte verkoop"}
                  </p>
                  <p className="text-lg font-display font-bold text-foreground">
                    {formatCurrency(result.inkoopprijs_klant || result.geschatte_verkoopprijs)}
                  </p>
                </div>
              </div>

              {/* Score Factoren */}
              {result.score_factoren && (
                <div className="p-6 bg-card border border-border">
                  <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-5">
                    Score Factoren
                  </p>
                  <div className="space-y-4">
                    <ScoreBar label="Marge potentieel" value={result.score_factoren.marge_potentieel} max={25} icon={TrendingUp} />
                    <ScoreBar label="Markt liquiditeit" value={result.score_factoren.markt_liquiditeit} max={25} icon={BarChart3} />
                    <ScoreBar label="Risico (hoger = veiliger)" value={result.score_factoren.risico_factor} max={25} icon={ShieldCheck} />
                    <ScoreBar label="Seizoen & timing" value={result.score_factoren.seizoen_timing} max={25} icon={Sun} />
                  </div>
                </div>
              )}

              {/* Markt Analyse */}
              <div className="p-6 bg-card border border-border">
                <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-4">
                  Marktanalyse
                </p>
                <p className="text-sm font-body text-muted-foreground leading-relaxed whitespace-pre-line">
                  {result.markt_analyse_tekst}
                </p>
                {result.markt_bronnen && result.markt_bronnen.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-[9px] font-body tracking-[0.15em] uppercase text-muted-foreground mb-2">Bronnen</p>
                    <div className="flex flex-wrap gap-2">
                      {result.markt_bronnen.map((bron, i) => (
                        <a
                          key={i}
                          href={bron}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-body text-muted-foreground hover:text-foreground underline transition-colors"
                        >
                          {new URL(bron).hostname}
                        </a>
                      ))}
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
