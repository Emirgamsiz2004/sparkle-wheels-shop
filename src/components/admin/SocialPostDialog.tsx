import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Sparkles, Loader2, Instagram, Facebook } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Hashtags {
  merkModel: string;
  autoVerkopen: string;
  locatie: string;
  extra: string;
}

interface VehicleInfo {
  id: string;
  merk: string;
  model: string;
  bouwjaar?: number | null;
  kilometerstand?: number | null;
  verkoopprijs?: number | null;
  kleur?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  vehicle: VehicleInfo;
}

const formatNumber = (n: number | null | undefined) =>
  n ? n.toLocaleString("nl-NL") : "";

const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary/50 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all";
const labelCls = "block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5";

const SocialPostDialog = ({ open, onOpenChange, vehicle }: Props) => {
  const [bijzonderheden, setBijzonderheden] = useState("");
  const [toon, setToon] = useState("Professioneel & Nuchter");
  const [platform, setPlatform] = useState("Beide");
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<Hashtags | null>(null);
  const [showResult, setShowResult] = useState(false);

  const generateFallback = () => {
    const { merk, model, bouwjaar, kilometerstand, verkoopprijs, kleur } = vehicle;
    const c = `🚗 ${merk} ${model} | ${bouwjaar || ""} | Handgeschakeld

Een mooie ${merk} ${model} in ${kleur || "nette staat"}.

📋 Specs:
› Bouwjaar: ${bouwjaar || ""}
› Kilometerstand: ± ${formatNumber(kilometerstand)} km
› Kleur: ${kleur || ""}${bijzonderheden ? `\n› Extras: ${bijzonderheden}` : ""}

💶 Vraagprijs: € ${formatNumber(verkoopprijs)},-

Interesse of vragen? Stuur een DM of app ons via WhatsApp.
📍 Roelofarendsveen`;

    const merkLower = merk.toLowerCase().replace(/\s/g, "");
    const modelLower = model.toLowerCase().replace(/\s/g, "");
    const h: Hashtags = {
      merkModel: `#${merkLower} #${modelLower} #${merkLower}${modelLower}`,
      autoVerkopen: "#autotekoop #autoverkoop #occasion #occasions #tweedehandsauto #gebruikteauto",
      locatie: "#roelofarendsveen #kaagenbraassem #groenehart #zuidholland #nederland",
      extra: "#carsofinstagram #cars #autobedrijf #platinautomotive",
    };
    return { caption: c, hashtags: h };
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-post", {
        body: {
          merk: vehicle.merk,
          model: vehicle.model,
          jaar: vehicle.bouwjaar,
          kilometerstand: formatNumber(vehicle.kilometerstand),
          prijs: formatNumber(vehicle.verkoopprijs),
          kleur: vehicle.kleur || "",
          bijzonderheden,
          toon,
          platform,
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
      setShowResult(true);
    } catch {
      const fb = generateFallback();
      setCaption(fb.caption);
      setHashtags(fb.hashtags);
      setShowResult(true);
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

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setShowResult(false);
      setBijzonderheden("");
      setCaption("");
      setHashtags(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            Post genereren — {vehicle.merk} {vehicle.model}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mt-2"
            >
              <div>
                <label className={labelCls}>Bijzonderheden</label>
                <textarea
                  value={bijzonderheden}
                  onChange={(e) => setBijzonderheden(e.target.value)}
                  placeholder="Panoramadak, trekhaak, nieuw APK..."
                  rows={3}
                  className={inputCls + " resize-none"}
                />
                <p className="text-[10px] text-muted-foreground mt-1">Optioneel — worden meegenomen in de post</p>
              </div>

              <div>
                <label className={labelCls}>Toon</label>
                <select value={toon} onChange={(e) => setToon(e.target.value)} className={inputCls}>
                  <option value="Professioneel & Nuchter">Professioneel & Nuchter</option>
                  <option value="Enthousiast & Energiek">Enthousiast & Energiek</option>
                  <option value="Luxe & Exclusief">Luxe & Exclusief</option>
                </select>
              </div>

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
                disabled={loading}
                className="w-full py-3 bg-foreground text-background text-sm font-medium rounded-xl hover:bg-foreground/90 disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? "Genereren..." : "Genereer Post"}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4 mt-2"
            >
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
                    <Copy className="w-3 h-3" /> Caption
                  </button>
                  {hashtags && (
                    <>
                      <button onClick={() => copyToClipboard(allHashtags, "Hashtags")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-xl hover:bg-accent/20 transition-colors">
                        <Copy className="w-3 h-3" /> Hashtags
                      </button>
                      <button onClick={() => copyToClipboard(`${caption}\n\n${allHashtags}`, "Alles")} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-xl hover:bg-accent/20 transition-colors">
                        <Copy className="w-3 h-3" /> Alles
                      </button>
                    </>
                  )}
                </div>
              </div>

              {hashtags && (
                <div className="space-y-2">
                  <label className={labelCls}>Hashtags</label>
                  <div className="text-xs text-muted-foreground break-all leading-relaxed bg-secondary/30 rounded-xl p-3 border border-border">
                    {allHashtags}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowResult(false)}
                className="w-full py-2.5 text-xs font-medium border border-border rounded-xl hover:bg-accent/20 transition-colors"
              >
                ← Opnieuw genereren
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default SocialPostDialog;
