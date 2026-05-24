import { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Copy, Sparkles, Loader2, Lock, Info } from "lucide-react";
import KentekenInput from "@/components/admin/KentekenInput";
import { fetchRdwData } from "@/lib/rdw";
import { cn } from "@/lib/utils";
import { capitalizeMerk, capitalizeModel, capitalizeKleur } from "@/lib/capitalize";
const formatNumber = (n: number | undefined) =>
  n ? n.toLocaleString("nl-NL") : "";

const parseMarktplaatsCaption = (text: string) => {
  const lines = text.split("\n");
  let titel = "", beschrijving = "", specificaties = "", vraagprijs = "", contact = "", opvaltekst = "";
  let section = "";

  for (const line of lines) {
    if (line.startsWith("TITEL:")) { titel = line.replace("TITEL:", "").trim(); section = "titel"; continue; }
    if (line.startsWith("OPVALTEKST:")) { section = "opvaltekst"; opvaltekst = line.replace("OPVALTEKST:", "").trim(); continue; }
    if (line.startsWith("BESCHRIJVING:")) { section = "beschrijving"; beschrijving = line.replace("BESCHRIJVING:", "").trim(); continue; }
    if (line.startsWith("SPECIFICATIES:")) { section = "specificaties"; continue; }
    if (line.startsWith("VRAAGPRIJS:")) { vraagprijs = line.replace("VRAAGPRIJS:", "").trim(); section = "vraagprijs"; continue; }
    if (line.startsWith("CONTACT:")) { section = "contact"; contact = line.replace("CONTACT:", "").trim(); continue; }

    if (section === "opvaltekst") opvaltekst += (opvaltekst ? "\n" : "") + line;
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

  return { titel, opvaltekst: opvaltekst.trim(), beschrijving: beschrijving.trim(), specs, vraagprijs, contact: contact.trim() };
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
  const [vermogen, setVermogen] = useState<number | "">("");
  const [uitvoering, setUitvoering] = useState("");
  const [transmissie, setTransmissie] = useState("Handgeschakeld");
  const [kleur, setKleur] = useState("");
  const [apkTot, setApkTot] = useState("");
  const [aantalEigenaren, setAantalEigenaren] = useState<number>(1);
  const [schadevrij, setSchadevrij] = useState(true);
  const [nap, setNap] = useState(true);
  const [prijsBespreekbaar, setPrijsBespreekbaar] = useState(false);
  const [bijzonderheden, setBijzonderheden] = useState("");
  const [brandstof, setBrandstof] = useState("");
  const [carrosserie, setCarrosserie] = useState("");
  const [aantalDeuren, setAantalDeuren] = useState<number | "">("");
  const [aantalZitplaatsen, setAantalZitplaatsen] = useState<number | "">("");
  const [gewicht, setGewicht] = useState<number | "">("");
  const [catalogusprijs, setCatalogusprijs] = useState<number | "">("");
  const [aantalCilinders, setAantalCilinders] = useState<number | "">("");
  const [chassisnummer, setChassisnummer] = useState("");
  const [metallicLak, setMetallicLak] = useState<"ja" | "nee" | "onbekend">("onbekend");
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

  const handleRdwLookup = async (kenteken: string) => {
    setRdwLoading(true);
    const data = await fetchRdwData(kenteken);
    if (data) {
      const filled = new Set<string>();
      if (data.merk) { setMerk(data.merk); filled.add("merk"); }
      if (data.model) { setModel(data.model); filled.add("model"); }
      if (data.bouwjaar) { setJaar(data.bouwjaar); filled.add("jaar"); }
      if (data.kleur) { setKleur(data.kleur); filled.add("kleur"); }
      if (data.motorinhoud) { setMotorinhoud(data.motorinhoud); filled.add("motorinhoud"); }
      if (data.apkTot) { setApkTot(data.apkTot); filled.add("apkTot"); }
      if (data.vermogen) { setVermogen(data.vermogen); filled.add("vermogen"); }
      if (data.brandstof) { setBrandstof(data.brandstof); filled.add("brandstof"); }
      if (data.carrosserie) { setCarrosserie(data.carrosserie); filled.add("carrosserie"); }
      if (data.aantalDeuren) { setAantalDeuren(data.aantalDeuren); filled.add("aantalDeuren"); }
      if (data.aantalZitplaatsen) { setAantalZitplaatsen(data.aantalZitplaatsen); filled.add("aantalZitplaatsen"); }
      if (data.gewicht) { setGewicht(data.gewicht); filled.add("gewicht"); }
      if (data.catalogusprijs) { setCatalogusprijs(data.catalogusprijs); filled.add("catalogusprijs"); }
      if (data.aantalCilinders) { setAantalCilinders(data.aantalCilinders); filled.add("aantalCilinders"); }
      if (data.aantalHouders) { setAantalEigenaren(data.aantalHouders); filled.add("aantalEigenaren"); }
      if (data.chassisnummer) { setChassisnummer(data.chassisnummer); filled.add("chassisnummer"); }
      setRdwFields(filled);
    }
    setRdwLoading(false);
  };

  const clearRdw = (key: string) => {
    setRdwFields((prev) => { const next = new Set(prev); next.delete(key); return next; });
  };

  const rdwBg = (key: string) => rdwFields.has(key) ? "bg-accent/40 border-primary/30 text-foreground" : "";

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
          uitvoering,
          vermogen: vermogen || undefined,
          brandstof: brandstof || undefined,
          carrosserie: carrosserie || undefined,
          aantal_deuren: aantalDeuren || undefined,
          aantal_zitplaatsen: aantalZitplaatsen || undefined,
          gewicht: gewicht || undefined,
          nieuwprijs: catalogusprijs || undefined,
          aantal_cilinders: aantalCilinders || undefined,
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
        parsed.opvaltekst && `OPVALTEKST:\n${parsed.opvaltekst}`,
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
                  <KentekenInput value={kenteken} onChange={setKenteken} onValidKenteken={handleRdwLookup} loading={rdwLoading} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Merk</label>
                  <Input value={merk} onChange={(e) => { setMerk(capitalizeMerk(e.target.value)); clearRdw("merk"); }} placeholder="Volkswagen" className={rdwBg("merk")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Model</label>
                  <Input value={model} onChange={(e) => { setModel(capitalizeModel(e.target.value)); clearRdw("model"); }} placeholder="Polo GTI" className={rdwBg("model")} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs text-muted-foreground">Uitvoering</label>
                  <Input value={uitvoering} onChange={(e) => setUitvoering(e.target.value)} placeholder="GTI / AMG Line / M-Sport / S-Line" className={rdwBg("uitvoering")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Jaar</label>
                  <Input type="number" value={jaar} onChange={(e) => { setJaar(e.target.value ? Number(e.target.value) : ""); clearRdw("jaar"); }} placeholder="2019" className={rdwBg("jaar")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Kilometerstand</label>
                  <Input type="number" value={km} onChange={(e) => setKm(e.target.value ? Number(e.target.value) : "")} placeholder="119000" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Motorinhoud</label>
                  <Input value={motorinhoud} onChange={(e) => { setMotorinhoud(e.target.value); clearRdw("motorinhoud"); }} placeholder="1.8" className={rdwBg("motorinhoud")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Vermogen (pk)</label>
                  <Input type="number" value={vermogen} onChange={(e) => { setVermogen(e.target.value ? Number(e.target.value) : ""); clearRdw("vermogen"); }} placeholder="192" className={rdwBg("vermogen")} />
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
                  <Input value={kleur} onChange={(e) => { setKleur(capitalizeKleur(e.target.value)); clearRdw("kleur"); }} placeholder="Wit" className={rdwBg("kleur")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Brandstof</label>
                  <Input value={brandstof} onChange={(e) => { setBrandstof(e.target.value); clearRdw("brandstof"); }} placeholder="Benzine" className={rdwBg("brandstof")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Carrosserie</label>
                  <Input value={carrosserie} onChange={(e) => { setCarrosserie(e.target.value); clearRdw("carrosserie"); }} placeholder="Hatchback" className={rdwBg("carrosserie")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Vraagprijs (€)</label>
                  <Input type="number" value={prijs} onChange={(e) => setPrijs(e.target.value ? Number(e.target.value) : "")} placeholder="13250" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">APK geldig tot</label>
                  <Input type="date" value={apkTot} onChange={(e) => { setApkTot(e.target.value); clearRdw("apkTot"); }} className={rdwBg("apkTot")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Aantal deuren</label>
                  <Input type="number" value={aantalDeuren} onChange={(e) => { setAantalDeuren(e.target.value ? Number(e.target.value) : ""); clearRdw("aantalDeuren"); }} placeholder="5" className={rdwBg("aantalDeuren")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Aantal zitplaatsen</label>
                  <Input type="number" value={aantalZitplaatsen} onChange={(e) => { setAantalZitplaatsen(e.target.value ? Number(e.target.value) : ""); clearRdw("aantalZitplaatsen"); }} placeholder="5" className={rdwBg("aantalZitplaatsen")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Gewicht (kg)</label>
                  <Input type="number" value={gewicht} onChange={(e) => { setGewicht(e.target.value ? Number(e.target.value) : ""); clearRdw("gewicht"); }} placeholder="1250" className={rdwBg("gewicht")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Nieuwprijs (€)</label>
                  <Input type="number" value={catalogusprijs} onChange={(e) => { setCatalogusprijs(e.target.value ? Number(e.target.value) : ""); clearRdw("catalogusprijs"); }} placeholder="32000" className={rdwBg("catalogusprijs")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Aantal eigenaren</label>
                  <Input type="number" value={aantalEigenaren} onChange={(e) => { setAantalEigenaren(Number(e.target.value) || 1); clearRdw("aantalEigenaren"); }} min={1} className={rdwBg("aantalEigenaren")} />
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
              <>
                {/* TITEL */}
                <Card className="overflow-hidden">
                  <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: MARKTPLAATS_ORANGE }}>
                    <span className="text-white font-bold text-xs uppercase tracking-wider">Titel (max 60 tekens)</span>
                    <button onClick={() => copyToClipboard(parsed.titel, "Titel")} className="text-white/70 hover:text-white transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-4 bg-white text-black">
                    <p className="text-base font-bold leading-tight">{parsed.titel}</p>
                    <p className="text-[10px] mt-1.5" style={{ color: parsed.titel.length > 60 ? "#dc2626" : "#9ca3af" }}>
                      {parsed.titel.length} / 60 tekens
                    </p>
                  </div>
                </Card>

                {/* OPVALTEKST */}
                {parsed.opvaltekst && (
                  <Card className="overflow-hidden" style={{ border: `2px solid ${MARKTPLAATS_ORANGE}` }}>
                    <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: MARKTPLAATS_ORANGE }}>
                      <span className="text-white font-bold text-xs uppercase tracking-wider">Opvaltekst (50-208 tekens)</span>
                      <button onClick={() => copyToClipboard(parsed.opvaltekst, "Opvaltekst")} className="text-white/70 hover:text-white transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-4" style={{ backgroundColor: "#fff5ef" }}>
                      <p className="text-sm leading-relaxed text-black">{parsed.opvaltekst}</p>
                      <p className="text-[10px] mt-1.5" style={{ color: parsed.opvaltekst.length > 208 ? "#dc2626" : parsed.opvaltekst.length < 50 ? "#f59e0b" : "#9ca3af" }}>
                        {parsed.opvaltekst.length} / 208 tekens
                      </p>
                    </div>
                  </Card>
                )}

                {/* ADVERTENTIETEKST */}
                <Card className="overflow-hidden">
                  <div className="px-4 py-2.5 flex items-center justify-between bg-gray-800">
                    <span className="text-white font-bold text-xs uppercase tracking-wider">Advertentietekst</span>
                    <button onClick={() => {
                      const adText = [
                        parsed.beschrijving,
                        parsed.specs.length ? "\n" + parsed.specs.map((s) => `- ${s.key}: ${s.value}`).join("\n") : "",
                        parsed.vraagprijs ? `\nVraagprijs: ${parsed.vraagprijs}` : "",
                        parsed.contact ? `\n${parsed.contact}` : "",
                      ].filter(Boolean).join("\n");
                      copyToClipboard(adText, "Advertentietekst");
                    }} className="text-white/70 hover:text-white transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-4 bg-white text-black space-y-3">
                    {parsed.beschrijving && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{parsed.beschrijving}</p>
                    )}
                    {parsed.specs.length > 0 && (
                      <div className="rounded border border-gray-200 overflow-hidden">
                        {parsed.specs.map((s, i) => (
                          <div key={i} className={`flex justify-between px-3 py-1.5 text-sm ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                            <span className="text-gray-600">{s.key}</span>
                            <span className="font-medium">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {parsed.vraagprijs && (
                      <p className="text-lg font-bold" style={{ color: MARKTPLAATS_ORANGE }}>{parsed.vraagprijs}</p>
                    )}
                    {parsed.contact && (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-sm whitespace-pre-wrap">{parsed.contact}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* VWE INVULHULP */}
                <Card className="overflow-hidden" style={{ border: "2px solid #D98A3C" }}>
                  <div className="px-4 py-2.5 flex items-center justify-between" style={{ backgroundColor: "#D98A3C" }}>
                    <span className="text-white font-bold text-xs uppercase tracking-wider">VWE Invulhulp</span>
                    <button onClick={() => {
                      const vweText = [
                        `Kenteken: ${kenteken || "—"}`,
                        `Chassisnummer: ${chassisnummer || "handmatig invullen"}`,
                        `Kleur: ${kleur || "—"}`,
                        `Metallic: ${metallicLak === "ja" ? "Ja" : metallicLak === "nee" ? "Nee" : "Onbekend"}`,
                        `Aantal eigenaren: ${aantalEigenaren || "—"}`,
                        `APK tot: ${apkTot || "—"}`,
                        `NAP: ${nap ? "Ja" : "Nee"}`,
                        `Schadevrij: ${schadevrij ? "Ja" : "Nee"}`,
                      ].join("\n");
                      copyToClipboard(vweText, "VWE invulhulp");
                    }} className="text-white/70 hover:text-white transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-0 bg-white text-black">
                    {[
                      { label: "Kenteken", value: kenteken || "—" },
                      { label: "Chassisnummer", value: chassisnummer || "handmatig invullen" },
                      { label: "Kleur", value: kleur || "—" },
                      { label: "Metallic", value: metallicLak === "ja" ? "Ja" : metallicLak === "nee" ? "Nee" : "Onbekend" },
                      { label: "Aantal eigenaren", value: String(aantalEigenaren || "—") },
                      { label: "APK tot", value: apkTot || "—" },
                      { label: "NAP", value: nap ? "Ja" : "Nee" },
                      { label: "Schadevrij", value: schadevrij ? "Ja" : "Nee" },
                    ].map((row, i) => (
                      <div key={i} className={`flex items-center justify-between px-4 py-2 text-sm ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                        <span className="text-gray-500">{row.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{row.value}</span>
                          <button onClick={() => copyToClipboard(row.value, row.label)} className="text-gray-300 hover:text-gray-600 transition-colors">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Kopieer alles */}
                <Button
                  onClick={() => {
                    const fullOutput = [
                      `TITEL:\n${parsed.titel}`,
                      parsed.opvaltekst ? `OPVALTEKST:\n${parsed.opvaltekst}` : "",
                      `ADVERTENTIETEKST:\n${parsed.beschrijving}`,
                      parsed.specs.length ? parsed.specs.map((s) => `- ${s.key}: ${s.value}`).join("\n") : "",
                      parsed.vraagprijs ? `Vraagprijs: ${parsed.vraagprijs}` : "",
                      parsed.contact ? parsed.contact : "",
                      `\nVWE INVULHULP:\nKenteken: ${kenteken || "—"}\nChassisnummer: ${chassisnummer || "handmatig invullen"}\nKleur: ${kleur || "—"}\nMetallic: ${metallicLak === "ja" ? "Ja" : metallicLak === "nee" ? "Nee" : "Onbekend"}\nAantal eigenaren: ${aantalEigenaren || "—"}\nAPK tot: ${apkTot || "—"}\nNAP: ${nap ? "Ja" : "Nee"}\nSchadevrij: ${schadevrij ? "Ja" : "Nee"}`,
                    ].filter(Boolean).join("\n\n");
                    copyToClipboard(fullOutput, "Volledige output");
                  }}
                  className="w-full gap-2 text-white font-semibold"
                  style={{ backgroundColor: MARKTPLAATS_ORANGE }}
                >
                  <Copy className="w-4 h-4" /> Kopieer alles
                </Button>
              </>
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
