import { useEffect, useRef, useState } from "react";
import { User, Building2, FileText, Loader2, Check, Download, Printer, Info as InfoIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buildInkoopverklaringPdf } from "@/lib/inkoopverklaringPdf";
import { buildInkoopfactuurPdf } from "@/lib/inkoopfactuurPdf";
import { printPdfBlob, reprintPdf } from "@/lib/printPdf";
import { formatKenteken } from "@/lib/kenteken";
import { GeboortedatumInputs } from "@/components/admin/GeboortedatumInputs";

const inputCls =
  "w-full h-10 px-3 bg-background border border-border rounded-[10px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors";
const labelCls = "block text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5";

type DocType = "particulier" | "zakelijk";
type Betaalwijze = "verrekend" | "contant" | "overboeking";

export interface Stap6Props {
  verkoopId: string | null;
  inruil: boolean;
  // Inruil voertuig (uit stap 1)
  inruilKenteken: string;
  inruilMerk: string;
  inruilModel: string;
  inruilKm: number | "";
  inruilWaarde: number | "";
  inruilType: DocType; // particulier|zakelijk uit stap 1

  // Particulier verkoper-velden (state in wizard)
  verkoperVoornaam: string; setVerkoperVoornaam: (v: string) => void;
  verkoperAchternaam: string; setVerkoperAchternaam: (v: string) => void;
  verkoperGeboortedatum: string; setVerkoperGeboortedatum: (v: string) => void;
  verkoperAdres: string; setVerkoperAdres: (v: string) => void;
  verkoperPostcode: string; setVerkoperPostcode: (v: string) => void;
  verkoperWoonplaats: string; setVerkoperWoonplaats: (v: string) => void;
  verkoperTelefoon: string; setVerkoperTelefoon: (v: string) => void;

  // Zakelijk
  bedrijfsnaam: string; setBedrijfsnaam: (v: string) => void;
  kvk: string; setKvk: (v: string) => void;
  btw: string; setBtw: (v: string) => void;
  contactpersoon: string; setContactpersoon: (v: string) => void;
  bedrijfAdres: string; setBedrijfAdres: (v: string) => void;
  bedrijfPostcode: string; setBedrijfPostcode: (v: string) => void;
  bedrijfWoonplaats: string; setBedrijfWoonplaats: (v: string) => void;

  // Betaalwijze inruil
  inruilBetaalwijze: Betaalwijze | ""; setInruilBetaalwijze: (v: Betaalwijze) => void;

  // Doc type override (start = inruilType uit stap 1)
  docType: DocType; setDocType: (v: DocType) => void;

  inkoopverklaringId: string | null;
  setInkoopverklaringId: (id: string | null) => void;

  // Klantgegevens uit stap 3 (voor auto-fill van particuliere verkoper)
  klantVoornaam?: string;
  klantAchternaam?: string;
  klantGeboortedatum?: string;
  klantAdres?: string;
  klantPostcode?: string;
  klantWoonplaats?: string;
  klantTelefoon?: string;

  onAutoSave: () => Promise<void> | void;
}

const formatEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(n);

export default function Stap6InruilDocument(p: Stap6Props) {
  const [generating, setGenerating] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [lastPdfUrl, setLastPdfUrl] = useState<string | null>(null);
  const autoFilledRef = useRef(false);

  // Auto-fill verkoper-velden (particulier) met klantgegevens uit stap 3 — slechts één keer,
  // en alleen als de velden nog leeg zijn. Velden blijven daarna bewerkbaar.
  useEffect(() => {
    if (!p.inruil) return;
    if (p.docType !== "particulier") return;
    if (autoFilledRef.current) return;

    const allEmpty =
      !p.verkoperVoornaam &&
      !p.verkoperAchternaam &&
      !p.verkoperGeboortedatum &&
      !p.verkoperAdres &&
      !p.verkoperPostcode &&
      !p.verkoperWoonplaats &&
      !p.verkoperTelefoon;

    const hasKlantData =
      !!(p.klantVoornaam || p.klantAchternaam || p.klantAdres || p.klantPostcode || p.klantWoonplaats || p.klantTelefoon || p.klantGeboortedatum);

    if (allEmpty && hasKlantData) {
      if (p.klantVoornaam) p.setVerkoperVoornaam(p.klantVoornaam);
      if (p.klantAchternaam) p.setVerkoperAchternaam(p.klantAchternaam);
      if (p.klantGeboortedatum) p.setVerkoperGeboortedatum(p.klantGeboortedatum);
      if (p.klantAdres) p.setVerkoperAdres(p.klantAdres);
      if (p.klantPostcode) p.setVerkoperPostcode(p.klantPostcode);
      if (p.klantWoonplaats) p.setVerkoperWoonplaats(p.klantWoonplaats);
      if (p.klantTelefoon) p.setVerkoperTelefoon(p.klantTelefoon);
      autoFilledRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.inruil, p.docType, p.klantVoornaam, p.klantAchternaam, p.klantGeboortedatum, p.klantAdres, p.klantPostcode, p.klantWoonplaats, p.klantTelefoon]);

  // Niet van toepassing
  if (!p.inruil) {
    return (
      <div className="rounded-[14px] border border-border bg-card p-8 text-center space-y-2">
        <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
        <p className="text-sm font-medium text-foreground">Niet van toepassing</p>
        <p className="text-xs text-muted-foreground">
          Geen inruil bij deze verkoop. Klik op <span className="font-medium">Volgende</span> om door te gaan.
        </p>
      </div>
    );
  }

  const inruilWaardeNum = p.inruilWaarde === "" ? 0 : Number(p.inruilWaarde);
  const inruilKmNum = p.inruilKm === "" ? 0 : Number(p.inruilKm);

  const verkoperNaam = `${p.verkoperVoornaam} ${p.verkoperAchternaam}`.trim();
  const verkoperVolledigAdres = `${p.verkoperAdres}`.trim();
  const verkoperVolledigeWoonplaats = `${p.verkoperPostcode} ${p.verkoperWoonplaats}`.trim();
  const bedrijfVolledigeWoonplaats = `${p.bedrijfPostcode} ${p.bedrijfWoonplaats}`.trim();

  const betaalwijzeLabel = (b: Betaalwijze | ""): string => {
    if (b === "verrekend") return "Verrekend met verkoopprijs";
    if (b === "contant") return "Contant uitbetaald";
    if (b === "overboeking") return "Overboeking";
    return "—";
  };

  const handleGenerate = async () => {
    if (p.docType === "particulier") {
      if (!p.verkoperVoornaam || !p.verkoperAchternaam) return toast.error("Vul voor- en achternaam in");
      if (!p.verkoperAdres) return toast.error("Vul adres in");
      if (!p.verkoperPostcode || !p.verkoperWoonplaats) return toast.error("Vul postcode en woonplaats in");
    } else {
      if (!p.bedrijfsnaam) return toast.error("Vul bedrijfsnaam in");
      if (!p.kvk) return toast.error("Vul KVK-nummer in");
      if (!p.bedrijfAdres || !p.bedrijfPostcode || !p.bedrijfWoonplaats) return toast.error("Vul bedrijfsadres in");
    }
    if (!p.inruilBetaalwijze) return toast.error("Kies een betaalwijze voor de inruil");
    if (p.inruilWaarde === "" || Number(p.inruilWaarde) < 0) return toast.error("Inruilwaarde ontbreekt — vul deze in stap 1 in");

    setGenerating(true);
    try {
      await p.onAutoSave();
      const datum = new Date().toISOString().slice(0, 10);
      let pdfBlob: Blob;
      let documentNaam: string;

      if (p.docType === "particulier") {
        const doc = buildInkoopverklaringPdf({
          verkoper: {
            naam: verkoperNaam,
            telefoon: p.verkoperTelefoon || "",
            adres: verkoperVolledigAdres,
            woonplaats: verkoperVolledigeWoonplaats,
          },
          voertuig: {
            kenteken: p.inruilKenteken || undefined,
            merk: p.inruilMerk || "—",
            model: p.inruilModel || "—",
            kilometerstand: inruilKmNum || undefined,
          },
          legitimatie: { type: "—", nummer: "—" },
          inkoopprijs: inruilWaardeNum,
          datum,
          documentNaam: `Inkoopverklaring inruil ${p.inruilKenteken || verkoperNaam}`,
        });
        try { (doc as any).autoPrint?.(); } catch {}
        pdfBlob = doc.output("blob");
        documentNaam = `Inkoopverklaring ${p.inruilKenteken || verkoperNaam} ${datum}.pdf`;

        // Opslaan in inkoopverklaringen tabel
        const { data: ins, error: insErr } = await supabase
          .from("inkoopverklaringen")
          .insert({
            document_naam: documentNaam,
            verkoper_naam: verkoperNaam,
            verkoper_telefoon: p.verkoperTelefoon || "",
            verkoper_adres: verkoperVolledigAdres,
            verkoper_woonplaats: verkoperVolledigeWoonplaats,
            kenteken: p.inruilKenteken || null,
            merk: p.inruilMerk || "—",
            model: p.inruilModel || "—",
            kilometerstand: inruilKmNum || null,
            legitimatie_type: "—",
            legitimatie_nummer: "—",
            inkoopprijs: inruilWaardeNum,
            datum,
          })
          .select("id")
          .single();
        if (insErr) throw insErr;
        p.setInkoopverklaringId(ins.id);
      } else {
        // Inkoopfactuur (zakelijk)
        const factuurnummer = `IF-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
        const doc = buildInkoopfactuurPdf({
          bedrijf: {
            naam: p.bedrijfsnaam,
            kvk: p.kvk,
            btw: p.btw || undefined,
            contactpersoon: p.contactpersoon || undefined,
            adres: p.bedrijfAdres,
            postcode: p.bedrijfPostcode,
            woonplaats: p.bedrijfWoonplaats,
          },
          voertuig: {
            kenteken: p.inruilKenteken || undefined,
            merk: p.inruilMerk || "—",
            model: p.inruilModel || "—",
            kilometerstand: inruilKmNum || undefined,
          },
          bedragInclBtw: inruilWaardeNum,
          btwPercentage: 21,
          betaalwijze: betaalwijzeLabel(p.inruilBetaalwijze),
          datum,
          factuurnummer,
        });
        pdfBlob = doc.output("blob");
        documentNaam = `Inkoopfactuur ${p.bedrijfsnaam} ${datum}.pdf`;
      }

      // Print direct vanuit verborgen iframe — geen nieuw tabblad
      const url = printPdfBlob(pdfBlob, "inruil-print-frame");
      setLastPdfUrl(url);

      setGeneratedAt(new Date().toISOString());
      toast.success("Document gegenereerd — printvenster opent automatisch");
    } catch (err: any) {
      console.error(err);
      toast.error("Kon document niet genereren: " + (err.message || "onbekende fout"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Inruil samenvatting */}
      <div className="rounded-[14px] border border-border bg-card p-5">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
          Inruilauto (uit stap 1)
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <Info label="Kenteken" value={p.inruilKenteken || "—"} mono />
          <Info label="Merk" value={p.inruilMerk || "—"} />
          <Info label="Model" value={p.inruilModel || "—"} />
          <Info label="Km-stand" value={inruilKmNum ? `${inruilKmNum.toLocaleString("nl-NL")} km` : "—"} />
          <Info label="Inruilwaarde" value={formatEur(inruilWaardeNum)} />
        </div>
      </div>

      {/* Document type kaarten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DocCard
          active={p.docType === "particulier"}
          onClick={() => p.setDocType("particulier")}
          icon={<User className="w-5 h-5" />}
          title="Inkoopverklaring"
          description="Voor aankoop van particulier"
        />
        <DocCard
          active={p.docType === "zakelijk"}
          onClick={() => p.setDocType("zakelijk")}
          icon={<Building2 className="w-5 h-5" />}
          title="Inkoopfactuur"
          description="Voor aankoop van zakelijke partij"
        />
      </div>

      {/* Velden particulier */}
      {p.docType === "particulier" && (
        <div className="rounded-[14px] border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Verkoper (vorige eigenaar)
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-[10px] border border-border/60 bg-muted/30 px-3 py-2">
            <InfoIcon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Automatisch ingevuld vanuit klantgegevens — aanpasbaar indien de verkoper iemand anders is.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Voornaam *</label>
              <input className={inputCls} value={p.verkoperVoornaam} onChange={(e) => p.setVerkoperVoornaam(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Achternaam *</label>
              <input className={inputCls} value={p.verkoperAchternaam} onChange={(e) => p.setVerkoperAchternaam(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Geboortedatum</label>
              <GeboortedatumInputs
                value={p.verkoperGeboortedatum}
                onChange={p.setVerkoperGeboortedatum}
                showSegmentLabels
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Telefoon</label>
              <input className={inputCls} value={p.verkoperTelefoon} onChange={(e) => p.setVerkoperTelefoon(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Adres *</label>
              <input className={inputCls} value={p.verkoperAdres} onChange={(e) => p.setVerkoperAdres(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Postcode *</label>
              <input className={inputCls} value={p.verkoperPostcode} onChange={(e) => p.setVerkoperPostcode(e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className={labelCls}>Woonplaats *</label>
              <input className={inputCls} value={p.verkoperWoonplaats} onChange={(e) => p.setVerkoperWoonplaats(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Velden zakelijk */}
      {p.docType === "zakelijk" && (
        <div className="rounded-[14px] border border-border bg-card p-5 space-y-4">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Verkopende onderneming
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Bedrijfsnaam *</label>
              <input className={inputCls} value={p.bedrijfsnaam} onChange={(e) => p.setBedrijfsnaam(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>KVK-nummer *</label>
              <input className={inputCls} value={p.kvk} onChange={(e) => p.setKvk(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>BTW-nummer</label>
              <input className={inputCls} value={p.btw} onChange={(e) => p.setBtw(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Contactpersoon</label>
              <input className={inputCls} value={p.contactpersoon} onChange={(e) => p.setContactpersoon(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Adres *</label>
              <input className={inputCls} value={p.bedrijfAdres} onChange={(e) => p.setBedrijfAdres(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Postcode *</label>
              <input className={inputCls} value={p.bedrijfPostcode} onChange={(e) => p.setBedrijfPostcode(e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className={labelCls}>Woonplaats *</label>
              <input className={inputCls} value={p.bedrijfWoonplaats} onChange={(e) => p.setBedrijfWoonplaats(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Betaalwijze inruil */}
      <div className="rounded-[14px] border border-border bg-card p-5">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
          Hoe wordt de inruilwaarde verrekend?
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            { k: "verrekend", label: "Verrekend met verkoopprijs" },
            { k: "contant", label: "Contant uitbetaald" },
            { k: "overboeking", label: "Overboeking" },
          ] as const).map((opt) => (
            <button
              key={opt.k}
              type="button"
              onClick={() => p.setInruilBetaalwijze(opt.k)}
              className={`px-4 h-10 text-sm rounded-[10px] border transition-colors ${
                p.inruilBetaalwijze === opt.k
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background hover:bg-accent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genereer knop */}
      <div className="flex items-center justify-between rounded-[14px] border border-border bg-card p-5">
        <div className="text-sm">
          <div className="font-medium text-foreground">
            {p.docType === "particulier" ? "Inkoopverklaring genereren" : "Inkoopfactuur genereren"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            PDF wordt gedownload {p.docType === "particulier" ? "en gearchiveerd" : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 h-10 px-4 text-sm rounded-[10px] bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors font-medium"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : generatedAt ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {generating ? "Genereren…" : generatedAt ? "Opnieuw genereren" : "Genereren (PDF)"}
        </button>
      </div>
    </div>
  );
}

const Info = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    <div className={`text-sm text-foreground ${mono ? "font-mono uppercase" : ""}`}>{value}</div>
  </div>
);

const DocCard = ({
  active,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left rounded-[14px] border p-5 transition-all ${
      active
        ? "border-foreground bg-accent/30 shadow-sm"
        : "border-border bg-card hover:border-foreground/40 hover:bg-accent/10"
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
      </div>
      {active && <Check className="w-4 h-4 text-foreground mt-1" />}
    </div>
  </button>
);
