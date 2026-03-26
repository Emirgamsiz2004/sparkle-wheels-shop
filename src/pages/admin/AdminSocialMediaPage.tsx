import { useState, useEffect } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Copy, Sparkles, Loader2, Instagram, Facebook, Trash2 } from "lucide-react";

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
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [merk, setMerk] = useState("");
  const [model, setModel] = useState("");
  const [jaar, setJaar] = useState<number | "">("");
  const [km, setKm] = useState<number | "">("");
  const [prijs, setPrijs] = useState<number | "">("");
  const [transmissie, setTransmissie] = useState("Handgeschakeld");
  const [kleur, setKleur] = useState("");
  const [bijzonderheden, setBijzonderheden] = useState("");
  const [motorinhoud, setMotorinhoud] = useState("");
  const [typeAuto, setTypeAuto] = useState("Hatchback");
  const [toon, setToon] = useState("Professioneel & Nuchter");
  const [platform, setPlatform] = useState("Beide");
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<Hashtags | null>(null);
  const [activeTab, setActiveTab] = useState("caption");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("social-post-history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem("social-post-history", JSON.stringify(items));
  };

  const handleVehicleSelect = (id: string) => {
    setSelectedVehicle(id);
    const v = vehicles.find((v) => v.id === id);
    if (!v) return;
    setMerk(v.merk);
    setModel(v.model);
    setJaar(v.bouwjaar || "");
    setKm(v.kilometerstand || "");
    setPrijs(v.verkoopprijs || "");
    setKleur(v.kleur || "");
    setTransmissie("Handgeschakeld");
  };

  const generateFallback = () => {
    const c = `🚗 ${merk} ${model} | ${jaar} | ${transmissie}

Een mooie ${merk} ${model} in ${kleur || "nette staat"}.

📋 Specs:
› Bouwjaar: ${jaar}
› Kilometerstand: ± ${formatNumber(km as number)} km
› Transmissie: ${transmissie}
› Kleur: ${kleur}${bijzonderheden ? `\n› Extras: ${bijzonderheden}` : ""}

💶 Vraagprijs: € ${formatNumber(prijs as number)},-

Interesse of vragen? Stuur een DM of app ons via WhatsApp.
📍 Roelofarendsveen`;

    const merkLower = merk.toLowerCase().replace(/\s/g, "");
    const modelLower = model.toLowerCase().replace(/\s/g, "");
    const h: Hashtags = {
      merkModel: `#${merkLower} #${modelLower} #${merkLower}${modelLower}`,
      autoVerkopen: "#autotekoop #autoverkoop #occasion #occasions #tweedehandsauto #gebruikteauto #tweedehandsautotekoop #dutchcars",
      locatie: "#roelofarendsveen #kaagenbraassem #groenehart #zuidholland #amsterdam #rotterdam #denhaag #nederland",
      extra: `#carsofinstagram #cars #carphotography #autobedrijf #platinautomotive ${transmissie === "Automaat" ? "#automaat" : "#handgeschakeld"} #occasion`,
    };
    return { caption: c, hashtags: h };
  };

  const handleGenerate = async () => {
    if (!merk || !model) {
      toast.error("Vul minimaal merk en model in");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-post", {
        body: {
          merk, model, jaar, kilometerstand: formatNumber(km as number),
          prijs: formatNumber(prijs as number), transmissie, kleur,
          bijzonderheden, type_auto: typeAuto, toon, platform, motorinhoud,
        },
      });

      if (error || data?.error) {
        console.warn("AI generation failed, using fallback:", error || data?.error);
        const fb = generateFallback();
        setCaption(fb.caption);
        setHashtags(fb.hashtags);
        toast.info("Template-gebaseerde post gegenereerd (AI niet beschikbaar)");
      } else {
        setCaption(data.caption);
        setHashtags(data.hashtags);
        toast.success("Post gegenereerd!");
      }
      setActiveTab("caption");

      // Save to history
      const item: HistoryItem = {
        datum: new Date().toLocaleString("nl-NL"),
        voertuig: `${merk} ${model}`,
        platform,
        caption: data?.caption || generateFallback().caption,
        hashtags: data?.hashtags || generateFallback().hashtags,
      };
      saveHistory([item, ...history].slice(0, 10));
    } catch (e) {
      console.warn("Fallback used:", e);
      const fb = generateFallback();
      setCaption(fb.caption);
      setHashtags(fb.hashtags);
      toast.info("Template-gebaseerde post gegenereerd");
      setActiveTab("caption");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Social Media</h1>
        <p className="text-muted-foreground text-sm mt-1">Genereer posts voor Instagram en Facebook</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column — Form */}
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Voertuig selecteren</h3>
            <Select value={selectedVehicle} onValueChange={handleVehicleSelect}>
              <SelectTrigger><SelectValue placeholder="Selecteer een auto uit je voorraad" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.merk} {v.model} {v.bouwjaar ? `(${v.bouwjaar})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                of vul handmatig in
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Merk</label>
                <Input value={merk} onChange={(e) => setMerk(e.target.value)} placeholder="Volkswagen" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Model</label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Polo GTI" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Motorinhoud</label>
                <Input value={motorinhoud} onChange={(e) => setMotorinhoud(e.target.value)} placeholder="1.8 TSI" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Jaar</label>
                <Input type="number" value={jaar} onChange={(e) => setJaar(e.target.value ? Number(e.target.value) : "")} placeholder="2019" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Kilometerstand</label>
                <Input type="number" value={km} onChange={(e) => setKm(e.target.value ? Number(e.target.value) : "")} placeholder="119000" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Vraagprijs (€)</label>
                <Input type="number" value={prijs} onChange={(e) => setPrijs(e.target.value ? Number(e.target.value) : "")} placeholder="13250" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Kleur</label>
                <Input value={kleur} onChange={(e) => setKleur(e.target.value)} placeholder="Wit" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Transmissie</label>
                <Select value={transmissie} onValueChange={setTransmissie}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Automaat">Automaat</SelectItem>
                    <SelectItem value="Handgeschakeld">Handgeschakeld</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Type auto</label>
                <Select value={typeAuto} onValueChange={setTypeAuto}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Hatchback", "Sedan", "SUV / Crossover", "Stationwagon", "Cabrio", "Sportauto", "Youngtimer"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Bijzonderheden</label>
              <Textarea
                value={bijzonderheden}
                onChange={(e) => setBijzonderheden(e.target.value)}
                placeholder="Panoramadak, trekhaak, nieuw APK... of laat leeg"
                rows={2}
              />
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Instellingen</h3>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Toon</label>
              <Select value={toon} onValueChange={setToon}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professioneel & Nuchter">Professioneel & Nuchter</SelectItem>
                  <SelectItem value="Enthousiast & Energiek">Enthousiast & Energiek</SelectItem>
                  <SelectItem value="Luxe & Exclusief">Luxe & Exclusief</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Platform</label>
              <ToggleGroup type="single" value={platform} onValueChange={(v) => v && setPlatform(v)} className="justify-start">
                <ToggleGroupItem value="Instagram" className="gap-1.5 text-xs">
                  <Instagram className="w-3.5 h-3.5" /> Instagram
                </ToggleGroupItem>
                <ToggleGroupItem value="Facebook" className="gap-1.5 text-xs">
                  <Facebook className="w-3.5 h-3.5" /> Facebook
                </ToggleGroupItem>
                <ToggleGroupItem value="Beide" className="text-xs">Beide</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Genereer Post
            </Button>
          </Card>
        </div>

        {/* Right column — Output */}
        <div className="space-y-6">
          <Card className="p-5">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="caption" className="flex-1">Caption</TabsTrigger>
                  <TabsTrigger value="hashtags" className="flex-1">Hashtags</TabsTrigger>
                </TabsList>

                <TabsContent value="caption" className="space-y-3 mt-4">
                  <Textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={12}
                    placeholder="Hier verschijnt je gegenereerde caption..."
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(caption, "Caption")}
                    disabled={!caption}
                    className="gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" /> Kopieer Caption
                  </Button>
                  <p className="text-[11px] text-muted-foreground">
                    Tip: plaats de hashtags als eerste reactie op Instagram
                  </p>
                </TabsContent>

                <TabsContent value="hashtags" className="space-y-4 mt-4">
                  {hashtags ? (
                    <>
                      {[
                        { label: "Merk & Model", value: hashtags.merkModel },
                        { label: "Auto & Verkoop", value: hashtags.autoVerkopen },
                        { label: "Locatie", value: hashtags.locatie },
                        { label: "Extra", value: hashtags.extra },
                      ].map((block) => (
                        <div key={block.label} className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">{block.label}</p>
                          <p className="text-sm break-all">{block.value}</p>
                        </div>
                      ))}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(allHashtags, "Hashtags")} className="gap-1.5">
                          <Copy className="w-3.5 h-3.5" /> Kopieer Alle Hashtags
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(`${caption}\n\n${allHashtags}`, "Caption + Hashtags")} className="gap-1.5">
                          <Copy className="w-3.5 h-3.5" /> Kopieer Alles
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Genereer eerst een post om hashtags te zien.</p>
                  )}
                </TabsContent>
            </Tabs>
          </Card>

          {caption && (
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Instagram Preview</h3>
              <div className="rounded-lg border border-border bg-background p-4 space-y-2 max-w-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">PA</div>
                  <span className="text-xs font-semibold">platinautomotive</span>
                </div>
                <div className="bg-muted aspect-video rounded flex items-center justify-center text-muted-foreground text-xs">
                  📷 Foto
                </div>
                <div className="text-xs leading-relaxed whitespace-pre-wrap">
                  <span className="font-semibold">{caption.split("\n")[0]}</span>
                  {caption.split("\n").length > 1 && (
                    <span className="text-muted-foreground">{"\n" + caption.split("\n").slice(1).join("\n")}</span>
                  )}
                </div>
                {hashtags && (
                  <p className="text-[10px] text-muted-foreground break-all">{allHashtags}</p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Post History */}
      {history.length > 0 && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recente Posts</h3>
            <Button variant="ghost" size="sm" onClick={() => saveHistory([])} className="text-xs text-muted-foreground gap-1">
              <Trash2 className="w-3 h-3" /> Wis geschiedenis
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Datum</th>
                  <th className="pb-2 pr-4">Voertuig</th>
                  <th className="pb-2 pr-4">Platform</th>
                  <th className="pb-2">Actie</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-4 text-xs text-muted-foreground">{h.datum}</td>
                    <td className="py-2 pr-4 text-xs">{h.voertuig}</td>
                    <td className="py-2 pr-4 text-xs">{h.platform}</td>
                    <td className="py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1 h-7"
                        onClick={() => {
                          const allH = `${h.hashtags.merkModel}\n${h.hashtags.autoVerkopen}\n${h.hashtags.locatie}\n${h.hashtags.extra}`;
                          copyToClipboard(`${h.caption}\n\n${allH}`, "Post");
                        }}
                      >
                        <Copy className="w-3 h-3" /> Kopieer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminSocialMediaPage;
