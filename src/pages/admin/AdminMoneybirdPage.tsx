import { useState, useEffect } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { useMoneybird } from "@/hooks/useMoneybird";
import { formatEuroDecimal } from "@/types/vehicle";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, Upload, RefreshCw, CheckCircle, ExternalLink, FileText } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const AdminMoneybirdPage = () => {
  const { vehicles, loading: vLoading } = useVehicles();
  const { loading: mbLoading, getAdministration, createVehicleInvoice, syncVehicleCosts, getSalesInvoices } = useMoneybird();
  const [admin, setAdmin] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tab, setTab] = useState<"facturen" | "kosten" | "overzicht">("facturen");
  const [syncing, setSyncing] = useState<string | null>(null);

  // Load admin info on mount
  useEffect(() => {
    getAdministration()
      .then(setAdmin)
      .catch(() => {});
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await getSalesInvoices();
      setInvoices(Array.isArray(data) ? data : []);
    } catch {}
  };

  useEffect(() => {
    if (tab === "overzicht") loadInvoices();
  }, [tab]);

  const verkochteVoertuigen = vehicles.filter((v) => v.status === "verkocht");
  const alleVoertuigen = vehicles.filter((v) => v.kosten.length > 0);

  const handleCreateInvoice = async (v: any) => {
    if (!v.koperNaam) {
      toast.error("Geen koper gegevens ingevuld voor dit voertuig");
      return;
    }
    setSyncing(v.id);
    try {
      await createVehicleInvoice(v, v.koperNaam, v.koperEmail, v.koperTelefoon);
      toast.success(`Factuur aangemaakt voor ${v.merk} ${v.model}`);
    } catch {} finally {
      setSyncing(null);
    }
  };

  const handleSyncCosts = async (v: any) => {
    setSyncing(v.id);
    try {
      const result = await syncVehicleCosts(v);
      toast.success(`${result.synced} kosten gesynchroniseerd naar Moneybird`);
    } catch {} finally {
      setSyncing(null);
    }
  };

  const loading = vLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Moneybird Koppeling</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {admin ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Verbonden met: {admin.name || admin.company_name || "Moneybird"}
              </span>
            ) : (
              "Facturen aanmaken en kosten synchroniseren"
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { key: "facturen", label: "Verkoopfacturen", icon: FileText },
          { key: "kosten", label: "Kosten Sync", icon: Upload },
          { key: "overzicht", label: "Factuuroverzicht", icon: ExternalLink },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Verkoopfacturen tab */}
      {tab === "facturen" && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {verkochteVoertuigen.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                Geen verkochte voertuigen om te factureren.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary border-b border-border">
                      {["Voertuig", "Koper", "Verkoopprijs", "Datum", "Actie"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {verkochteVoertuigen.map((v) => (
                      <tr key={v.id} className="border-b border-border hover:bg-secondary/50">
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                          {v.merk} {v.model} ({v.bouwjaar})
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {v.koperNaam || <span className="text-red-400 text-xs">Geen koper</span>}
                        </td>
                        <td className="px-4 py-3 text-foreground">{formatEuroDecimal(v.verkoopprijs)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {v.verkoopDatum ? new Date(v.verkoopDatum).toLocaleDateString("nl-NL") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleCreateInvoice(v)}
                            disabled={mbLoading || syncing === v.id || !v.koperNaam}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-medium rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
                          >
                            {syncing === v.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Factuur Aanmaken
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Kosten sync tab */}
      {tab === "kosten" && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {alleVoertuigen.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                Geen voertuigen met kosten om te synchroniseren.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary border-b border-border">
                      {["Voertuig", "Status", "Aantal kosten", "Totaal", "Actie"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alleVoertuigen.map((v) => {
                      const totalKosten = v.kosten.reduce((s, k) => s + k.amount, 0);
                      return (
                        <tr key={v.id} className="border-b border-border hover:bg-secondary/50">
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                            {v.merk} {v.model} ({v.bouwjaar})
                          </td>
                          <td className="px-4 py-3 text-muted-foreground capitalize">{v.status.replace("_", " ")}</td>
                          <td className="px-4 py-3 text-foreground">{v.kosten.length}</td>
                          <td className="px-4 py-3 text-foreground">{formatEuroDecimal(totalKosten)}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleSyncCosts(v)}
                              disabled={mbLoading || syncing === v.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-medium rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
                            >
                              {syncing === v.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                              Sync naar Moneybird
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Factuuroverzicht tab */}
      {tab === "overzicht" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={loadInvoices}
              disabled={mbLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-card text-foreground text-sm font-medium border border-border hover:bg-secondary disabled:opacity-50"
            >
              {mbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Vernieuwen
            </button>
          </div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {mbLoading && invoices.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="px-6 py-16 text-center text-sm text-muted-foreground">
                  Geen facturen gevonden in Moneybird.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary border-b border-border">
                        {["Factuurnr", "Klant", "Datum", "Bedrag", "Status"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-widest whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv: any) => (
                        <tr key={inv.id} className="border-b border-border hover:bg-secondary/50">
                          <td className="px-4 py-3 font-medium text-foreground">{inv.invoice_id || inv.id?.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{inv.contact?.company_name || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString("nl-NL") : "—"}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {inv.total_price_incl_tax ? formatEuroDecimal(Number(inv.total_price_incl_tax)) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                              inv.state === "open" ? "bg-amber-500/20 text-amber-400" :
                              inv.state === "paid" || inv.state === "late" ? "bg-emerald-500/20 text-emerald-400" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {inv.state || "onbekend"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminMoneybirdPage;
