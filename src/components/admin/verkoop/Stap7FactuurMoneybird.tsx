import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Loader2,
  Check,
  ExternalLink,
  Mail,
  Download,
  Info as InfoIcon,
  Receipt,
  AlertCircle,
  Send,
  HandCoins,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMoneybird } from "@/hooks/useMoneybird";
import { formatKenteken } from "@/lib/kenteken";

const inputCls =
  "w-full h-10 px-3 bg-background border border-border rounded-[10px] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors";
const labelCls = "block text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5";

const MB_ADMIN_ID = "481405116676573138";
const WORKFLOW_IDS = {
  marge_geen: "482837428008126425",
  marge_autotrust: "482840482335950088",
  btw_geen: "482840757707736664",
  btw_autotrust: "482840705683686879",
} as const;
const BTW_WORKFLOW_IDS: ReadonlySet<string> = new Set([
  WORKFLOW_IDS.btw_geen,
  WORKFLOW_IDS.btw_autotrust,
]);

// BTW 21% (hoog) tax_rate_id voor administratie 481405116676573138.
// Alleen toegepast op de voertuigregel bij BTW-workflows.
const BTW_21_TAX_RATE_ID = "482047796720142370";

// Custom field IDs (Moneybird)
const CUSTOM_FIELD_IDS = {
  kenteken: "482048786214946071",
  chassisnummer: "483758257936008582",
  bouwjaar: "482838097400169743",
  kilometerstand: "482048832877627078",
  merk_model: "482838073633146484",
  garantie: "482848149761419699",
} as const;

type VoertuigType = "marge" | "btw" | "consignatie";
type GarantieType = "geen" | "autotrust";

export interface Stap7Props {
  verkoopId: string | null;

  // Voertuig (uit stap 1)
  voertuigKenteken: string;
  voertuigMerk: string;
  voertuigModel: string;
  voertuigBouwjaar?: number | null;
  voertuigChassisnummer?: string | null;
  voertuigKilometerstand?: number | null;
  voertuigType: VoertuigType;

  // Bedragen
  verkoopprijs: number | "";
  afleverkosten: number | "";
  leges: number | "";
  aanbetalingBedrag: number | "";

  // Garantie (uit stap 4)
  garantieType: GarantieType;
  garantiePakket: string;
  garantieLooptijd: number | "";
  garantiePrijs: number | "";

  // Klant (uit stap 3)
  klantVoornaam: string;
  klantAchternaam: string;
  klantBedrijfsnaam?: string;
  klantZakelijk: boolean;
  klantAdres: string;
  klantPostcode: string;
  klantWoonplaats: string;
  klantLand?: string;
  klantTelefoon: string;
  klantEmail: string;
  klantKvk?: string;
  klantBtw?: string;
  customerId: string | null;

  // Reeds opgeslagen factuur (hydration)
  initialFactuurId?: string | null;
  initialFactuurUrl?: string | null;
  initialFactuurNummer?: string | null;
  initialFactuurdatum?: string | null;
  initialReferentie?: string | null;
  initialEmailVerzondenOp?: string | null;
  initialFactuurVerstuurd?: boolean | null;
  initialFactuurEmail?: string | null;

  onSaved: (extra: Record<string, any>) => Promise<void> | void;
}

const formatEur = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);

const today = () => new Date().toISOString().slice(0, 10);

export default function Stap7FactuurMoneybird(p: Stap7Props) {
  const { invoke } = useMoneybird();

  const [factuurdatum, setFactuurdatum] = useState<string>(p.initialFactuurdatum || today());
  const [referentie, setReferentie] = useState<string>(
    p.initialReferentie || (p.voertuigKenteken ? formatKenteken(p.voertuigKenteken) : "")
  );

  const [factuurId, setFactuurId] = useState<string | null>(p.initialFactuurId || null);
  const [factuurUrl, setFactuurUrl] = useState<string | null>(p.initialFactuurUrl || null);
  const [factuurNummer, setFactuurNummer] = useState<string | null>(p.initialFactuurNummer || null);
  const [emailVerzondenOp, setEmailVerzondenOp] = useState<string | null>(p.initialEmailVerzondenOp || null);
  const [factuurVerstuurd, setFactuurVerstuurd] = useState<boolean>(!!p.initialFactuurVerstuurd);
  const [emailAdres, setEmailAdres] = useState<string>(p.initialFactuurEmail || p.klantEmail || "");
  // (verzendkeuze toggle vervangen door 2 directe knoppen)

  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [bevestigd, setBevestigd] = useState(!!p.initialFactuurVerstuurd);

  // Workflow automatisch bepalen
  const workflowId = useMemo<string>(() => {
    const isBtw = p.voertuigType === "btw";
    const hasAutotrust = p.garantieType === "autotrust";
    if (isBtw && hasAutotrust) return WORKFLOW_IDS.btw_autotrust;
    if (isBtw) return WORKFLOW_IDS.btw_geen;
    if (hasAutotrust) return WORKFLOW_IDS.marge_autotrust;
    return WORKFLOW_IDS.marge_geen;
  }, [p.voertuigType, p.garantieType]);

  const workflowLabel = useMemo<string>(() => {
    const isBtw = p.voertuigType === "btw";
    const hasAutotrust = p.garantieType === "autotrust";
    return `${isBtw ? "BTW" : "Marge"} · ${hasAutotrust ? "met Autotrust" : "geen garantie"}`;
  }, [p.voertuigType, p.garantieType]);

  const num = (v: number | "" | null | undefined) => (typeof v === "number" ? v : 0);

  const factuurRegels = useMemo(() => {
    type Kind = "voertuig" | "garantie" | "afleverkosten" | "leges" | "aanbetaling";
    const regels: Array<{ kind: Kind; description: string; price: number; amount: string }> = [];
    const kenteken = p.voertuigKenteken ? formatKenteken(p.voertuigKenteken) : "";
    const bouwjaar = p.voertuigBouwjaar ? ` (${p.voertuigBouwjaar})` : "";
    regels.push({
      kind: "voertuig",
      description: `Voertuig ${kenteken} ${p.voertuigMerk} ${p.voertuigModel}${bouwjaar}`.trim(),
      price: num(p.verkoopprijs),
      amount: "1 x",
    });
    if (p.garantieType === "autotrust" && num(p.garantiePrijs) > 0) {
      const looptijd = num(p.garantieLooptijd);
      const pakket = p.garantiePakket || "Autotrust";
      regels.push({
        kind: "garantie",
        description: `Garantie ${pakket}${looptijd ? ` · ${looptijd} maanden` : ""} via Autotrust`,
        price: num(p.garantiePrijs),
        amount: "1 x",
      });
    }
    if (num(p.afleverkosten) > 0) {
      regels.push({ kind: "afleverkosten", description: "Afleverkosten", price: num(p.afleverkosten), amount: "1 x" });
    }
    if (num(p.leges) > 0) {
      regels.push({ kind: "leges", description: "Leges / tenaamstelling", price: num(p.leges), amount: "1 x" });
    }
    if (num(p.aanbetalingBedrag) > 0) {
      regels.push({ kind: "aanbetaling", description: "Aanbetaling (reeds voldaan)", price: -num(p.aanbetalingBedrag), amount: "1 x" });
    }
    return regels;
  }, [p]);

  const totaal = useMemo(() => factuurRegels.reduce((s, r) => s + r.price, 0), [factuurRegels]);

  // Klantnaam tonen
  const klantNaam = p.klantZakelijk && p.klantBedrijfsnaam
    ? p.klantBedrijfsnaam
    : `${p.klantVoornaam} ${p.klantAchternaam}`.trim() || "—";
  const klantAdresRegel = [p.klantAdres, [p.klantPostcode, p.klantWoonplaats].filter(Boolean).join("  ")]
    .filter(Boolean)
    .join(" · ");

  // ─── Verificatie: bestaat factuur nog in Moneybird? ───
  // Returns true als factuur nog bestaat, anders reset state en toont melding.
  const verifyInvoiceExists = async (): Promise<boolean> => {
    if (!factuurId) return false;
    try {
      const res = await invoke("check_invoice_exists", { invoice_id: factuurId });
      if (res?.exists === false) {
        // Reset DB
        if (p.verkoopId) {
          await supabase
            .from("vehicle_sales")
            .update({ moneybird_factuur_id: null })
            .eq("id", p.verkoopId);
        }
        await p.onSaved({
          moneybird_factuur_id: null,
          moneybird_factuur_url: null,
          moneybird_factuur_nummer: null,
          factuur_verstuurd: false,
          factuur_email_verzonden_op: null,
          factuur_status: null,
          stap7_afgerond: false,
        });
        // Reset lokale wizard state
        setFactuurId(null);
        setFactuurUrl(null);
        setFactuurNummer(null);
        setEmailVerzondenOp(null);
        setFactuurVerstuurd(false);
        setBevestigd(false);
        toast.error("De factuur bestaat niet meer in Moneybird. Je kunt een nieuwe factuur aanmaken.");
        return false;
      }
      return true;
    } catch (e: any) {
      console.error("Factuurcheck mislukt:", e);
      // Bij netwerk-/serverfout: niet resetten, gewoon doorlaten zodat onderliggende actie de echte fout toont.
      return true;
    }
  };

  // Open factuur in Moneybird, maar verifieer eerst dat hij nog bestaat.
  const handleOpenInMoneybird = async () => {
    if (!factuurUrl) return;
    if (!(await verifyInvoiceExists())) return;
    window.open(factuurUrl, "_blank", "noopener,noreferrer");
  };

  // ─── Acties ───
  const handleAanmaken = async () => {
    if (!p.verkoopId) {
      toast.error("Geen verkoop-id beschikbaar");
      return;
    }
    if (!klantNaam || klantNaam === "—") {
      toast.error("Klantgegevens ontbreken — vul stap 3 eerst in");
      return;
    }
    if (factuurRegels.length === 0) {
      toast.error("Geen factuurregels");
      return;
    }
    setCreating(true);
    try {
      // Haal evt. bestaande moneybird_contact_id op
      let moneybirdContactId: string | null = null;
      if (p.customerId) {
        const { data: cust } = await supabase
          .from("customers")
          .select("moneybird_contact_id")
          .eq("id", p.customerId)
          .maybeSingle();
        moneybirdContactId = cust?.moneybird_contact_id || null;
      }

      const contactPayload = {
        company_name: p.klantZakelijk ? p.klantBedrijfsnaam : `${p.klantVoornaam} ${p.klantAchternaam}`.trim(),
        firstname: p.klantZakelijk ? undefined : p.klantVoornaam,
        lastname: p.klantZakelijk ? undefined : p.klantAchternaam,
        email: p.klantEmail,
        phone: p.klantTelefoon,
        address1: p.klantAdres,
        zipcode: p.klantPostcode,
        city: p.klantWoonplaats,
        country: p.klantLand || "NL",
        chamber_of_commerce: p.klantKvk || undefined,
        tax_number: p.klantBtw || undefined,
      };

      const isBtwWorkflow = BTW_WORKFLOW_IDS.has(workflowId);

      // Garantie waarde bepalen op basis van stap 4 keuze
      let garantieValue = "";
      if (p.garantieType === "geen") {
        garantieValue = "Geen garantie";
      } else if (p.garantieType === "autotrust") {
        const looptijd = num(p.garantieLooptijd);
        const pakket = (p.garantiePakket || "").trim();
        if (pakket && looptijd > 0) {
          garantieValue = `${pakket} · ${looptijd} maanden via Autotrust`;
        }
      }

      // Chassisnummer ophalen uit voertuigdata (vehicles.chassis_nummer)
      const chassisValue = (p.voertuigChassisnummer || "").trim();

      const customFields = [
        { id: CUSTOM_FIELD_IDS.kenteken, value: p.voertuigKenteken ? formatKenteken(p.voertuigKenteken) : "" },
        { id: CUSTOM_FIELD_IDS.chassisnummer, value: chassisValue },
        { id: CUSTOM_FIELD_IDS.bouwjaar, value: p.voertuigBouwjaar ? String(p.voertuigBouwjaar) : "" },
        { id: CUSTOM_FIELD_IDS.kilometerstand, value: p.voertuigKilometerstand ? String(p.voertuigKilometerstand) : "" },
        { id: CUSTOM_FIELD_IDS.merk_model, value: `${p.voertuigMerk || ""} ${p.voertuigModel || ""}`.trim() },
        { id: CUSTOM_FIELD_IDS.garantie, value: garantieValue },
      ];

      const res = await invoke("create_wizard_invoice", {
        contact_id: moneybirdContactId || undefined,
        contact_payload: moneybirdContactId ? undefined : contactPayload,
        workflow_id: workflowId,
        reference: referentie || undefined,
        invoice_date: factuurdatum,
        prices_are_incl_tax: true,
        details_attributes: factuurRegels.map((r) => {
          // Voertuigregel: 21% BTW alleen bij BTW-workflow. Garantie + aanbetaling: nooit BTW.
          const taxRateId = r.kind === "voertuig" && isBtwWorkflow ? BTW_21_TAX_RATE_ID : undefined;
          return {
            description: r.description,
            price: r.price,
            amount: "1",
            ...(taxRateId ? { tax_rate_id: taxRateId } : {}),
          };
        }),
        custom_fields_attributes: customFields,
      });

      const invoice = res?.invoice;
      const url = res?.moneybird_url;
      const contact = res?.contact;
      if (!invoice?.id) throw new Error("Geen factuur-id ontvangen");

      // Sla moneybird_contact_id op klant op (indien nieuw)
      if (p.customerId && contact?.id && !moneybirdContactId) {
        await supabase
          .from("customers")
          .update({ moneybird_contact_id: String(contact.id) })
          .eq("id", p.customerId);
      }

      const nummer = invoice.invoice_id || invoice.reference || null;
      setFactuurId(String(invoice.id));
      setFactuurUrl(url);
      setFactuurNummer(nummer);

      await p.onSaved({
        moneybird_factuur_id: String(invoice.id),
        moneybird_factuur_url: url,
        moneybird_factuur_nummer: nummer,
        factuurdatum,
        factuur_referentie: referentie || null,
      });

      toast.success("Factuur aangemaakt in Moneybird");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Aanmaken factuur mislukt");
    } finally {
      setCreating(false);
    }
  };

  // Verzenden per e-mail (maakt factuur definitief via send_invoice)
  const handleEmailen = async () => {
    if (!factuurId) return;
    if (!(await verifyInvoiceExists())) return;
    setSending(true);
    try {
      const res = await invoke("send_sales_invoice", {
        invoice_id: factuurId,
        delivery_method: "Email",
      });
      const newState = res?.state || res?.invoice?.state;
      if (newState && newState === "draft") {
        throw new Error("Factuur is niet definitief gemaakt door Moneybird");
      }
      const ts = new Date().toISOString();
      const targetEmail = emailAdres.trim() || p.klantEmail || "";
      setEmailVerzondenOp(ts);
      setFactuurVerstuurd(true);
      setBevestigd(true);
      await p.onSaved({
        factuur_email_verzonden_op: ts,
        factuur_verstuurd: true,
        factuur_email: targetEmail || null,
        factuur_status: newState || "open",
        stap7_afgerond: true,
      });
      toast.success("Factuur verstuurd per e-mail ✓");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "E-mailen mislukt");
    } finally {
      setSending(false);
    }
  };

  // Handmatig verzonden — maakt factuur definitief (Manual delivery)
  const handleManueel = async () => {
    if (!factuurId) return;
    if (!(await verifyInvoiceExists())) return;
    setMarking(true);
    try {
      const res = await invoke("send_sales_invoice", {
        invoice_id: factuurId,
        delivery_method: "Manual",
      });
      const newState = res?.state || res?.invoice?.state;
      if (newState && newState === "draft") {
        throw new Error("Factuur is niet definitief gemaakt door Moneybird");
      }
      setFactuurVerstuurd(true);
      setBevestigd(true);
      await p.onSaved({
        factuur_verstuurd: true,
        factuur_status: newState || "open",
        stap7_afgerond: true,
      });
      toast.success("Factuur gemarkeerd als verzonden ✓");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Markeren mislukt");
    } finally {
      setMarking(false);
    }
  };

  const handleDownload = async () => {
    if (!factuurId) return;
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Niet ingelogd");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/moneybird`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: "download_invoice_pdf_blob",
            invoice_id: factuurId,
            kenteken: p.voertuigKenteken || "factuur",
            datum: factuurdatum || new Date().toISOString().slice(0, 10),
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const safeKenteken = (p.voertuigKenteken || "factuur").replace(/[^A-Za-z0-9-]/g, "");
      const filename = `Factuur-${safeKenteken}-${factuurdatum}.pdf`;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success("PDF gedownload");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Downloaden mislukt");
    } finally {
      setDownloading(false);
    }
  };

  const handleBevestig = async (checked: boolean) => {
    setBevestigd(checked);
    await p.onSaved({ stap7_afgerond: factuurVerstuurd && checked });
  };

  return (
    <div className="space-y-6">
      {/* Sectie 1 — Factuuroverzicht */}
      <section className="rounded-[10px] border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight">Factuuroverzicht</h3>
          <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-primary/10 text-primary text-[11px] font-medium uppercase tracking-wide">
            {workflowLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className={labelCls}>Klant</div>
            <div className="font-medium">{klantNaam}</div>
            {klantAdresRegel && <div className="text-xs text-muted-foreground mt-0.5">{klantAdresRegel}</div>}
            {p.klantEmail && <div className="text-xs text-muted-foreground">{p.klantEmail}</div>}
          </div>
          <div>
            <div className={labelCls}>Voertuig</div>
            <div className="font-medium">
              {p.voertuigMerk} {p.voertuigModel}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {p.voertuigKenteken ? formatKenteken(p.voertuigKenteken) : "—"}
              {p.voertuigBouwjaar ? ` · ${p.voertuigBouwjaar}` : ""}
            </div>
          </div>
        </div>

        {/* Factuurregels */}
        <div className="rounded-[8px] border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {factuurRegels.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2 text-foreground">{r.description}</td>
                  <td className="px-3 py-2 text-right tabular-nums w-32">{formatEur(r.price)}</td>
                </tr>
              ))}
              <tr className="bg-muted/30">
                <td className="px-3 py-2.5 font-semibold">Totaal incl. BTW</td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatEur(totaal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Sectie 2 — Factuurinstellingen */}
      <section className="rounded-[10px] border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight">Factuurinstellingen</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Factuurdatum</label>
            <input
              type="date"
              className={inputCls}
              value={factuurdatum}
              onChange={(e) => setFactuurdatum(e.target.value)}
              disabled={!!factuurId}
            />
          </div>
          <div>
            <label className={labelCls}>Referentie</label>
            <input
              type="text"
              className={inputCls}
              value={referentie}
              onChange={(e) => setReferentie(e.target.value)}
              placeholder={p.voertuigKenteken ? formatKenteken(p.voertuigKenteken) : "Kenteken"}
              disabled={!!factuurId}
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
          <InfoIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
          Workflow wordt automatisch gekozen op basis van voertuigtype en garantie.
        </p>
      </section>

      {/* Sectie 3 — Acties */}
      <section className="rounded-[10px] border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold tracking-tight">Acties</h3>
        </div>

        {/* STAP A — Factuur aanmaken (concept) */}
        {!factuurId && (
          <button
            type="button"
            onClick={handleAanmaken}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[10px] bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
            {creating ? "Aanmaken in Moneybird…" : "Factuur aanmaken in Moneybird"}
          </button>
        )}

        {/* Concept aangemaakt — controleren + verzendopties */}
        {factuurId && !factuurVerstuurd && (
          <div className="space-y-4">
            <div className="rounded-[8px] border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center gap-2.5 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-amber-700 dark:text-amber-400">
                Concept aangemaakt{factuurNummer ? ` · ${factuurNummer}` : ""} — controleer en kies hoe te verzenden
              </span>
            </div>

            {/* Controleren */}
            {factuurUrl && (
              <button
                type="button"
                onClick={handleOpenInMoneybird}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] border border-border bg-background text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Factuur bekijken in Moneybird
              </button>
            )}

            {/* E-mailadres veld (vooraf gevuld) */}
            <div>
              <label className={labelCls}>E-mailadres klant (Moneybird contact)</label>
              <input
                type="email"
                className={inputCls}
                value={emailAdres}
                onChange={(e) => setEmailAdres(e.target.value)}
                placeholder="naam@voorbeeld.nl"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
                <InfoIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Moneybird verstuurt naar het e-mailadres dat aan het contact gekoppeld is. Pas dit eerst aan in het Moneybird-contact als het anders moet zijn.
              </p>
            </div>

            {/* Twee verzendknoppen */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleEmailen}
                disabled={sending || marking}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[10px] bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Versturen…" : "Verzenden per e-mail"}
              </button>
              <button
                type="button"
                onClick={handleManueel}
                disabled={sending || marking}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[10px] border border-border bg-background text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-60"
              >
                {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <HandCoins className="h-4 w-4" />}
                {marking ? "Verwerken…" : "Handmatig verzonden"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <InfoIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
              Beide opties maken de factuur definitief in Moneybird (geen concept meer).
            </p>
          </div>
        )}

        {/* STAP C — Na verzending */}
        {factuurId && factuurVerstuurd && (
          <>
            <div className="rounded-[8px] border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 flex items-center gap-2.5 text-sm">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                {emailVerzondenOp
                  ? `Factuur verstuurd naar ${p.initialFactuurEmail || emailAdres}`
                  : "Factuur gemarkeerd als verzonden"}
                {factuurNummer ? ` · ${factuurNummer}` : ""}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {factuurUrl && (
                <button
                  type="button"
                  onClick={handleOpenInMoneybird}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] border border-border bg-background text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Bekijken in Moneybird
                </button>
              )}
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] border border-border bg-background text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-60"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Downloaden als PDF
              </button>
              {emailVerzondenOp && (
                <button
                  type="button"
                  onClick={handleEmailen}
                  disabled={sending}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] border border-border bg-background text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-60"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Factuur opnieuw mailen
                </button>
              )}
            </div>

            {emailVerzondenOp && (
              <p className="text-[11px] text-muted-foreground">
                Laatst verstuurd op {new Date(emailVerzondenOp).toLocaleString("nl-NL")}
              </p>
            )}
          </>
        )}
      </section>

      {/* Sectie 4 — Bevestiging */}
      <section className="rounded-[10px] border border-border bg-card p-5">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 rounded-[4px] border-border accent-primary"
            checked={bevestigd}
            onChange={(e) => handleBevestig(e.target.checked)}
            disabled={!factuurVerstuurd}
          />
          <div>
            <div className="text-sm font-medium">
              Factuur is verstuurd of meegegeven aan klant
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Wordt automatisch aangevinkt na verzending.
            </div>
          </div>
        </label>
      </section>
    </div>
  );
}
