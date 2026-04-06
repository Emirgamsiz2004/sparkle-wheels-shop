import { useState, useEffect } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Sparkles, Loader2, Instagram, Facebook, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Hashtags {
  merkModel: string;
  autoVerkopen: string;
  locatie: string;
  extra: string;
}

interface HistoryItem {
  datum: string;
  voertuig: string;
  platform: string;
  caption: string;
  hashtags: Hashtags;
}

const formatNumber = (n: number | undefined) =>
  n ? n.toLocaleString("nl-NL") : "";

const AdminSocialMediaPage = () => {
  const { vehicles } = useVehicles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [bijzonderheden, setBijzonderheden] = useState("");
  const [toon, setToon] = useState("Professioneel & Nuchter");
  const [platform, setPlatform] = useState("Beide");
  const [loading, setLoading] = useState(false);

  // Result
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<Hashtags | null>(null);
  const [showResult, setShowResult] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("social-post-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("social-post-history", JSON.stringify(items));
  };

  const vehicle = vehicles.find((v) => v.id === selectedVehicle);

  const generateFallback = () => {
    if (!vehicle) return { caption: "", hashtags: { merkModel: "", autoVerkopen: "", locatie: "", extra: "" } };
    const merk = vehicle.merk;
    const model = vehicle.model;
    const jaar = vehicle.bouwjaar || "";
    const km = vehicle.kilometerstand || 0;
    const prijs = vehicle.verkoopprijs || 0;
    const kleur = vehicle.kleur || "";
    const transmissie = "Handgeschakeld";

    const c = `🚗 ${merk} ${model} | ${jaar} | ${transmissie}

Een mooie ${merk} ${model} in ${kleur || "nette staat"}.

📋 Specs:
› Bouwjaar: ${jaar}
› Kilometerstand: ± ${formatNumber(km)} km
› Transmissie: ${transmissie}
› Kleur: ${kleur}${bijzonderheden ? `\n› Extras: ${bijzonderheden}` : ""}

💶 Vraagprijs: € ${formatNumber(prijs)},-

Interesse of vragen? Stuur een DM of app ons via WhatsApp.
📍 Roelofarendsveen`;

    const merkLower = merk.toLowerCase().replace(/\s/g, "");
    const modelLower = model.toLowerCase().replace(/\s/g, "");
    const h: Hashtags = {
      merkModel: `#${merkLower} #${modelLower} #${merkLower}${modelLower}`,
      autoVerkopen: "#autotekoop #autoverkoop #occasion #occasions #tweedehandsauto #gebruikteauto #tweedehandsautotekoop #dutchcars",
      locatie: "#roelofarendsveen #kaagenbraassem #groenehart #zuidholland #amsterdam #rotterdam #denhaag #nederland",
      extra: `#carsofinstagram #cars #carphotography #autobedrijf #platinautomotive #occasion`,
    };
    return { caption: c, hashtags: h };
  };

  const handleGenerate = async () => {
    if (!vehicle) {
      toast.error("Selecteer eerst een voertuig");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-post", {
        body: {
          merk: vehicle.merk,
          model: vehicle.model,
          jaar: vehicle.bouwjaar,
          kilometerstand: formatNumber(vehicle.kilometerstand),
          prijs: formatNumber(vehicle.verkoopprijs),
          transmissie: "Handgeschakeld",
          kleur: vehicle.kleur || "",
          bijzonderheden,
          type_auto: "Hatchback",
          toon,
          platform,
          motorinhoud: "",
        },
      });

      if (error || data?.error) {
        const fb = generateFallback();
        setCaption(fb.caption);
        setHashtags(fb.hashtags);
        toast.info("Template-gebaseerde post gegenereerd");
      } else {
        setCaption(data.caption);
        setHashtags(data.hashtags);
        toast.success("Post gegenereerd!");
      }

      // Save to history
      const item: HistoryItem = {
        datum: new Date().toLocaleString("nl-NL"),
        voertuig: `${vehicle.merk} ${vehicle.model}`,
        platform,
        caption: data?.caption || generateFallback().caption,
        hashtags: data?.hashtags || generateFallback().hashtags,
      };
      saveHistory([item, ...history].slice(0, 20));

      setShowResult(true);
      setDialogOpen(false);
    } catch {
      const fb = generateFallback();
      setCaption(fb.caption);
      setHashtags(fb.hashtags);
      setShowResult(true);
      setDialogOpen(false);
      toast.info("Template-gebaseerde post gegenereerd");
    } finally {
      setLoading(false);
    }
  };

  const allHashtags = hashtags
    ? `${hashtags.merkModel}\n${hashtags.autoVerkopen}\n${hashtags.locatie}\n${hashtags.extra}`
    : "";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} gekopieerd!`);
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all";
  const labelCls = "block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-foreground">Social Media</h1>
          <p className="text-sm text-muted-foreground">Genereer posts voor Instagram en Facebook</p>
        </div>
        <button
          onClick={() => { setDialogOpen(true); setShowResult(false); setBijzonderheden(""); setSelectedVehicle(""); }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium bg-foreground text-background rounded-xl hover:bg-foreground/90 transition-colors active:scale-[0.97]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Genereer Post
        </button>
      </div>

      {/* Result Card */}
      <AnimatePresence>
        {showResult && caption && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-border rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Gegenereerde Post</h3>
              <button onClick={() => setShowResult(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sluiten</button>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <label className={labelCls}>Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={10}
                className={inputCls + " resize-none font-mono text-xs leading-relaxed"}
              />
              <div className="flex flex-wrap gap-2">
                <button onClick={() => copyToClipboard(caption, "Caption")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-xl hover:bg-accent/20 transition-colors">
                  <Copy className="w-3 h-3" /> Kopieer Caption
                </button>
                {hashtags && (
                  <>
                    <button onClick={() => copyToClipboard(allHashtags, "Hashtags")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-xl hover:bg-accent/20 transition-colors">
                      <Copy className="w-3 h-3" /> Kopieer Hashtags
                    </button>
                    <button onClick={() => copyToClipboard(`${caption}\n\n${allHashtags}`, "Alles")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-xl hover:bg-accent/20 transition-colors">
                      <Copy className="w-3 h-3" /> Kopieer Alles
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Hashtags */}
            {hashtags && (
              <div className="space-y-2">
                <label className={labelCls}>Hashtags</label>
                <div className="text-xs text-muted-foreground break-all leading-relaxed bg-secondary/30 rounded-xl p-3 border border-border">
                  {allHashtags}
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">Tip: plaats de hashtags als eerste reactie op Instagram</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Recente Posts</h3>
            <button onClick={() => saveHistory([])} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Trash2 className="w-3 h-3" /> Wis
            </button>
          </div>
          <div className="space-y-1.5">
            {history.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  if (expandedHistory === i) {
                    setExpandedHistory(null);
                  } else {
                    setExpandedHistory(i);
                    setCaption(item.caption);
                    setHashtags(item.hashtags);
                  }
                }}
                className="w-full text-left bg-card border border-border rounded-xl p-3 hover:bg-accent/10 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{item.voertuig}</p>
                    <p className="text-xs text-muted-foreground">{item.datum} · {item.platform}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(item.caption, "Caption"); }}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent/20 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedHistory === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{item.caption}</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const all = `${item.hashtags.merkModel}\n${item.hashtags.autoVerkopen}\n${item.hashtags.locatie}\n${item.hashtags.extra}`;
                              copyToClipboard(`${item.caption}\n\n${all}`, "Alles");
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium border border-border rounded-lg hover:bg-accent/20 transition-colors text-muted-foreground"
                          >
                            <Copy className="w-2.5 h-2.5" /> Alles kopiëren
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Generate Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-medium">Social Media Post Genereren</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Vehicle select */}
            <div>
              <label className={labelCls}>Voertuig *</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className={inputCls}
              >
                <option value="">Selecteer een auto</option>
                {vehicles.filter(v => v.status !== "verkocht").map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.merk} {v.model} {v.bouwjaar ? `(${v.bouwjaar})` : ""} {v.kenteken ? `· ${v.kenteken}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Bijzonderheden */}
            <div>
              <label className={labelCls}>Bijzonderheden</label>
              <textarea
                value={bijzonderheden}
                onChange={(e) => setBijzonderheden(e.target.value)}
                placeholder="Panoramadak, trekhaak, nieuw APK, net grote beurt gehad..."
                rows={3}
                className={inputCls + " resize-none"}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Optioneel — deze worden meegenomen in de post</p>
            </div>

            {/* Tone */}
            <div>
              <label className={labelCls}>Toon</label>
              <select value={toon} onChange={(e) => setToon(e.target.value)} className={inputCls}>
                <option value="Professioneel & Nuchter">Professioneel & Nuchter</option>
                <option value="Enthousiast & Energiek">Enthousiast & Energiek</option>
                <option value="Luxe & Exclusief">Luxe & Exclusief</option>
              </select>
            </div>

            {/* Platform */}
            <div>
              <label className={labelCls}>Platform</label>
              <div className="flex gap-2">
                {[
                  { value: "Instagram", icon: Instagram, label: "Instagram" },
                  { value: "Facebook", icon: Facebook, label: "Facebook" },
                  { value: "Beide", label: "Beide" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPlatform(opt.value)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl border transition-colors ${
                      platform === opt.value
                        ? "bg-foreground text-background border-foreground"
                        : "bg-secondary/50 text-muted-foreground border-border hover:border-foreground/30"
                    }`}
                  >
                    {opt.icon && <opt.icon className="w-3.5 h-3.5" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !selectedVehicle}
              className="w-full py-3 bg-foreground text-background text-sm font-medium rounded-xl hover:bg-foreground/90 disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? "Genereren..." : "Genereer Post"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSocialMediaPage;
