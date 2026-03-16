import { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Copy, Sparkles, Loader2, Lock } from "lucide-react";
import KentekenInput from "@/components/admin/KentekenInput";
import { fetchRdwData } from "@/lib/rdw";
import { cn } from "@/lib/utils";
const formatNumber = (n: number | undefined) =>
  n ? n.toLocaleString("nl-NL") : "";

const parseMarktplaatsCaption = (text: string) => {
  const lines = text.split("\n");
  let titel = "", beschrijving = "", specificaties = "", vraagprijs = "", contact = "";
  let section = "";

  for (const line of lines) {
    if (line.startsWith("TITEL:")) { titel = line.replace("TITEL:", "").trim(); section = "titel"; continue; }
    if (line.startsWith("BESCHRIJVING:")) { section = "beschrijving"; beschrijving = line.replace("BESCHRIJVING:", "").trim(); continue; }
    if (line.startsWith("SPECIFICATIES:")) { section = "specificaties"; continue; }
    if (line.startsWith("VRAAGPRIJS:")) { vraagprijs = line.replace("VRAAGPRIJS:", "").trim(); section = "vraagprijs"; continue; }
    if (line.startsWith("CONTACT:")) { section = "contact"; contact = line.replace("CONTACT:", "").trim(); continue; }

    if (section === "beschrijving") beschrijving += (beschrijving ? "\n" : "") + line;
    if (section === "specificaties") specificaties += (specificaties ? "\n" : "") + line;
    if (section === "contact") contact += (contact ? "\n" : "") + line;
  }

  const specs = specificaties
    .split("\n")
    .map((l) => l.replace(/^-\s*/, "").trim())
    .filter(Boolean)
    .map((l) => {
      const [key, ...rest] = l.split(":");
      return { key: key?.trim(), value: rest.join(":").trim() };
    })
    .filter((s) => s.key && s.value);

  return { titel, beschrijving: beschrijving.trim(), specs, vraagprijs, contact: contact.trim() };
};

const MARKTPLAATS_ORANGE = "#e05c00";

const AdminAdvertentiesPage = () => {
  const { vehicles } = useVehicles();
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [kenteken, setKenteken] = useState("");
  const [merk, setMerk] = useState("");
  const [model, setModel] = useState("");
  const [jaar, setJaar] = useState<number | "">("");
  const [km, setKm] = useState<number | "">("");
  const [prijs, setPrijs] = useState<number | "">("");
  const [motorinhoud, setMotorinhoud] = useState("");
  const [transmissie, setTransmissie] = useState("Handgeschakeld");
  const [kleur, setKleur] = useState("");
  const [apkTot, setApkTot] = useState("");
  const [aantalEigenaren, setAantalEigenaren] = useState<number>(1);
  const [schadevrij, setSchadevrij] = useState(true);
  const [nap, setNap] = useState(true);
  const [prijsBespreekbaar, setPrijsBespreekbaar] = useState(false);
  const [bijzonderheden, setBijzonderheden] = useState("");
  const [loading, setLoading] = useState(false);
  const [rdwLoading, setRdwLoading] = useState(false);
  const [rdwFields, setRdwFields] = useState<Set<string>>(new Set());
  const [caption, setCaption] = useState("");
  const [activeChannel, setActiveChannel] = useState("marktplaats");

  const handleVehicleSelect = (id: string) => {
    setSelectedVehicle(id);
    const v = vehicles.find((v) => v.id === id);
    if (!v) return;
    setKenteken(v.kenteken || "");
    setMerk(v.merk);
    setModel(v.model);
    setJaar(v.bouwjaar || "");
    setKm(v.kilometerstand || "");
    setPrijs(v.verkoopprijs || "");
    setKleur(v.kleur || "");
    setTransmissie("Handgeschakeld");
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
          bijzonderheden, motorinhoud, platform: "Marktplaats",
          apk_geldig_tot: apkTot,
          aantal_eigenaren: aantalEigenaren,
          schadevrij: schadevrij ? "Ja" : "Nee",
          nap: nap ? "Ja" : "Nee",
          prijs_bespreekbaar: prijsBespreekbaar ? "Ja" : "Nee",
        },
      });

      if (error || data?.error) {
        console.warn("AI generation failed:", error || data?.error);
        toast.error("Genereren mislukt, probeer opnieuw");
      } else {
        setCaption(data.caption);
        toast.success("Advertentie gegenereerd!");
      }
    } catch (e) {
      console.warn("Error:", e);
      toast.error("Er ging iets mis");
    } finally {
      setLoading(false);
    }
  };

  const parsed = caption ? parseMarktplaatsCaption(caption) : null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} gekopieerd!`);
  };

  const fullBody = parsed
    ? [
        parsed.beschrijving && `BESCHRIJVING:\n${parsed.beschrijving}`,
        parsed.specs.length && `SPECIFICATIES:\n${parsed.specs.map((s) => `- ${s.key}: ${s.value}`).join("\n")}`,
        parsed.vraagprijs && `VRAAGPRIJS: ${parsed.vraagprijs}`,
        parsed.contact && `CONTACT:\n${parsed.contact}`,
      ].filter(Boolean).join("\n\n")
    : "";

  const channels = [
    { id: "marktplaats", label: "Marktplaats", active: true },
    { id: "autotrack", label: "AutoTrack", active: false },
    { id: "autoscout24", label: "AutoScout24", active: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Advertenties</h1>
        <p className="text-muted-foreground text-sm mt-1">Genereer advertenties voor Marktplaats, AutoTrack en meer</p>
      </div>

      {/* Channel tabs */}
      <div className="flex gap-2">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => ch.active && setActiveChannel(ch.id)}
            disabled={!ch.active}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeChannel === ch.id
                ? "text-white shadow-sm"
                : ch.active
                ? "bg-muted text-foreground hover:bg-accent"
                : "bg-muted/50 text-muted-foreground cursor-not-allowed"
            }`}
            style={activeChannel === ch.id ? { backgroundColor: MARKTPLAATS_ORANGE } : undefined}
          >
            {!ch.active && <Lock className="w-3 h-3" />}
            {ch.label}
            {!ch.active && <span className="text-[10px] opacity-70">soon</span>}
          </button>
        ))}
      </div>

      {activeChannel === "marktplaats" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Form */}
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
                <div className="col-span-2">
                  <KentekenInput value={kenteken} onChange={setKenteken} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Merk</label>
                  <Input value={merk} onChange={(e) => setMerk(e.target.value)} placeholder="Volkswagen" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Model</label>
                  <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Polo GTI" />
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
                  <label className="text-xs text-muted-foreground">Motorinhoud</label>
                  <Input value={motorinhoud} onChange={(e) => setMotorinhoud(e.target.value)} placeholder="1.8 TSI 192pk" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Transmissie</label>
                  <Select value={transmissie} onValueChange={setTransmissie}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Handgeschakeld">Handgeschakeld</SelectItem>
                      <SelectItem value="Automaat">Automaat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Kleur</label>
                  <Input value={kleur} onChange={(e) => setKleur(e.target.value)} placeholder="Wit" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Vraagprijs (€)</label>
                  <Input type="number" value={prijs} onChange={(e) => setPrijs(e.target.value ? Number(e.target.value) : "")} placeholder="13250" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">APK geldig tot</label>
                  <Input type="date" value={apkTot} onChange={(e) => setApkTot(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Aantal eigenaren</label>
                  <Input type="number" value={aantalEigenaren} onChange={(e) => setAantalEigenaren(Number(e.target.value) || 1)} min={1} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Switch checked={schadevrij} onCheckedChange={setSchadevrij} id="schadevrij" />
                  <Label htmlFor="schadevrij" className="text-xs">Schadevrij</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={nap} onCheckedChange={setNap} id="nap" />
                  <Label htmlFor="nap" className="text-xs">NAP</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={prijsBespreekbaar} onCheckedChange={setPrijsBespreekbaar} id="bespreekbaar" />
                  <Label htmlFor="bespreekbaar" className="text-xs">Bespreekbaar</Label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Bijzonderheden</label>
                <Textarea
                  value={bijzonderheden}
                  onChange={(e) => setBijzonderheden(e.target.value)}
                  placeholder="Panoramadak, trekhaak, nieuw APK..."
                  rows={2}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full text-white font-semibold"
                style={{ backgroundColor: MARKTPLAATS_ORANGE }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Genereer advertentie
              </Button>
            </Card>
          </div>

          {/* Right — Preview */}
          <div className="space-y-4">
            {parsed ? (
              <Card className="overflow-hidden">
                {/* Marktplaats-style header bar */}
                <div className="px-5 py-3 flex items-center gap-2" style={{ backgroundColor: MARKTPLAATS_ORANGE }}>
                  <span className="text-white font-bold text-sm">Marktplaats</span>
                  <span className="text-white/70 text-xs">Preview</span>
                </div>

                <div className="p-5 space-y-4 bg-white text-black">
                  {/* Title */}
                  <h2 className="text-lg font-bold leading-tight">{parsed.titel}</h2>

                  {/* Price */}
                  {parsed.vraagprijs && (
                    <p className="text-xl font-bold" style={{ color: MARKTPLAATS_ORANGE }}>
                      {parsed.vraagprijs}
                    </p>
                  )}

                  <Separator className="bg-gray-200" />

                  {/* Description */}
                  {parsed.beschrijving && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Beschrijving</h4>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{parsed.beschrijving}</p>
                    </div>
                  )}

                  {/* Specs table */}
                  {parsed.specs.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Kenmerken</h4>
                      <div className="rounded border border-gray-200 overflow-hidden">
                        {parsed.specs.map((s, i) => (
                          <div
                            key={i}
                            className={`flex justify-between px-3 py-2 text-sm ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                          >
                            <span className="text-gray-600">{s.key}</span>
                            <span className="font-medium">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  {parsed.contact && (
                    <div className="rounded-lg bg-gray-50 p-4">
                      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Contact</h4>
                      <p className="text-sm whitespace-pre-wrap">{parsed.contact}</p>
                    </div>
                  )}
                </div>

                {/* Copy buttons */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(parsed.titel, "Titel")}
                    className="gap-1.5 text-xs"
                  >
                    <Copy className="w-3.5 h-3.5" /> Kopieer titel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(fullBody, "Advertentie")}
                    className="gap-1.5 text-xs text-white"
                    style={{ backgroundColor: MARKTPLAATS_ORANGE }}
                  >
                    <Copy className="w-3.5 h-3.5" /> Kopieer advertentie
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Vul de gegevens in en klik op "Genereer advertentie" om een preview te zien.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdvertentiesPage;
