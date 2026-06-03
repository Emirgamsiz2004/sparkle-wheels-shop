import { useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { formatEuroDecimal } from "@/types/vehicle";
import { cn } from "@/lib/utils";
import HandmatigeVerkoopDialog from "./HandmatigeVerkoopDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SoldVehicleRow {
  id: string;
  merk: string;
  model: string;
  kenteken: string;
  verkoop_datum: string;
  inkoopprijs: number;
  verkoopprijs: number;
  kostenTotaal: number;
  bouwjaar?: number | null;
  kilometerstand?: number | null;
  brandstof?: string | null;
  verkoop_type?: string | null;
  btw_marge_type?: string | null;
  koper_naam?: string | null;
  inruil_waarde?: number | null;
  isConsignatie?: boolean;
  consignatie_perc?: number;
  bruto_verkoopprijs?: number;
  isHandmatig?: boolean;
}


interface Props {
  vehicles: SoldVehicleRow[];
  monthLabel: string;
  defaultDate?: string;
  onChanged?: () => void;
}

const formatDate = (d?: string) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
};

const escapeCsv = (val: string | number) => {
  const s = String(val ?? "");
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const VerkopenSheet = ({ vehicles, monthLabel, defaultDate, onChanged }: Props) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const totals = vehicles.reduce(
    (acc, v) => {
      const marge = v.verkoopprijs - v.inkoopprijs;
      acc.inkoop += v.inkoopprijs;
      acc.verkoop += v.verkoopprijs;
      acc.marge += marge;
      return acc;
    },
    { inkoop: 0, verkoop: 0, marge: 0 }
  );

  const avgMarge = vehicles.length > 0 ? totals.marge / vehicles.length : 0;

  const handleDelete = async (v: SoldVehicleRow) => {
    if (!v.isHandmatig) return;
    if (!confirm(`Verkoop "${v.merk} ${v.model}" verwijderen?`)) return;
    const realId = v.id.replace(/^hm-/, "");
    const { error } = await supabase.from("handmatige_verkopen" as any).delete().eq("id", realId);
    if (error) {
      toast.error("Verwijderen mislukt: " + error.message);
      return;
    }
    toast.success("Verkoop verwijderd");
    onChanged?.();
  };

  const downloadCsv = () => {
    const headers = [
      "Datum", "Kenteken", "Merk", "Model", "Bouwjaar", "KM",
      "Brandstof", "Type", "BTW/Marge", "Koper",
      "Inkoop", "Verkoop", "Marge",
    ];
    const rows = vehicles.map(v => {
      const marge = v.verkoopprijs - v.inkoopprijs;
      return [
        formatDate(v.verkoop_datum),
        v.kenteken,
        v.merk,
        v.model,
        v.bouwjaar ?? "",
        v.kilometerstand ?? "",
        v.brandstof ?? "",
        v.verkoop_type ?? "",
        v.btw_marge_type ?? "",
        v.koper_naam ?? "",
        v.inkoopprijs.toFixed(2).replace(".", ","),
        v.verkoopprijs.toFixed(2).replace(".", ","),
        marge.toFixed(2).replace(".", ","),
      ];
    });
    const totalsRow = [
      "TOTAAL", "", "", "", "", "", "", "", "", `${vehicles.length} auto's`,
      totals.inkoop.toFixed(2).replace(".", ","),
      totals.verkoop.toFixed(2).replace(".", ","),
      totals.marge.toFixed(2).replace(".", ","),
    ];
    const csv = [headers, ...rows, totalsRow]
      .map(r => r.map(escapeCsv).join(";"))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `verkopen-${monthLabel.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {vehicles.length > 0 ? (
            <>
              <span className="text-foreground font-semibold tabular-nums">{vehicles.length}</span> voertuig{vehicles.length === 1 ? "" : "en"} verkocht ·
              gem. marge <span className={cn("font-medium tabular-nums", avgMarge >= 0 ? "text-emerald-500" : "text-red-500")}>{avgMarge >= 0 ? "+" : "−"}{formatEuroDecimal(Math.abs(avgMarge))}</span>
            </>
          ) : (
            <>Geen voertuigen in {monthLabel}</>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-border rounded-[3px] hover:bg-muted/40 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Verkoop toevoegen
          </button>
          {vehicles.length > 0 && (
            <button
              onClick={downloadCsv}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-border rounded-[3px] hover:bg-muted/40 transition-colors"
            >
              <Download className="h-3 w-3" />
              Excel/CSV
            </button>
          )}
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center border border-border rounded-[3px]">
          Geen voertuigen verkocht in {monthLabel}
        </div>
      ) : (
      <div className="overflow-x-auto border border-border rounded-[3px]">
        <table className="w-full text-[13px] tabular-nums table-fixed">
          <colgroup>
            <col className="w-[110px]" />
            <col className="w-[110px]" />
            <col />
            <col className="w-[64px]" />
            <col className="w-[90px]" />
            <col className="w-[120px]" />
            <col className="w-[120px]" />
            <col className="w-[120px]" />
            <col className="w-[120px]" />
            <col className="w-[40px]" />
          </colgroup>
          <thead className="bg-muted/30 text-muted-foreground border-b border-border">
            <tr className="text-left">
              <th className="px-4 h-12 font-medium whitespace-nowrap">Datum</th>
              <th className="px-4 h-12 font-medium whitespace-nowrap">Kenteken</th>
              <th className="px-4 h-12 font-medium whitespace-nowrap">Voertuig</th>
              <th className="px-4 h-12 font-medium text-right whitespace-nowrap">Bj.</th>
              <th className="px-4 h-12 font-medium text-right whitespace-nowrap">KM</th>
              <th className="px-4 h-12 font-medium whitespace-nowrap">Type</th>
              <th className="px-4 h-12 font-medium text-right whitespace-nowrap">Inkoop</th>
              <th className="px-4 h-12 font-medium text-right whitespace-nowrap">Verkoop</th>
              <th className="px-4 h-12 font-medium text-right whitespace-nowrap">Marge</th>
              <th className="px-4 h-12 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {vehicles.map(v => {
              const marge = v.verkoopprijs - v.inkoopprijs;
              return (
                <tr key={v.id} className="h-14 hover:bg-muted/20 transition-colors group">
                  <td className="px-4 whitespace-nowrap text-muted-foreground">{formatDate(v.verkoop_datum)}</td>
                  <td className="px-4 whitespace-nowrap font-mono uppercase text-foreground">{v.kenteken || "—"}</td>
                  <td className="px-4 truncate text-foreground" title={`${v.merk} ${v.model}${v.koper_naam ? ` · ${v.koper_naam}` : ""}`}>
                    <span className="font-medium">{v.merk} {v.model}</span>
                    {v.koper_naam && <span className="text-muted-foreground"> · {v.koper_naam}</span>}
                    {v.isHandmatig && <span className="ml-1.5 text-[10px] uppercase text-muted-foreground/70">· handm.</span>}
                  </td>
                  <td className="px-4 text-right text-muted-foreground whitespace-nowrap">{v.bouwjaar ?? "—"}</td>
                  <td className="px-4 text-right text-muted-foreground whitespace-nowrap">{v.kilometerstand ? v.kilometerstand.toLocaleString("nl-NL") : "—"}</td>
                  <td className="px-4 text-muted-foreground capitalize whitespace-nowrap truncate">
                    {(v.verkoop_type || "regulier").replace(/_/g, " ")}
                    {v.isConsignatie && v.consignatie_perc ? (
                      <span className="ml-1 text-[10px] uppercase text-muted-foreground/70">· {v.consignatie_perc}%</span>
                    ) : v.btw_marge_type ? (
                      <span className="ml-1 text-[10px] uppercase text-muted-foreground/70">· {v.btw_marge_type}</span>
                    ) : null}
                  </td>
                  <td className="px-4 text-right text-foreground whitespace-nowrap">{v.isConsignatie ? "—" : formatEuroDecimal(v.inkoopprijs)}</td>
                  <td
                    className="px-4 text-right text-foreground font-medium whitespace-nowrap"
                    title={v.isConsignatie && v.bruto_verkoopprijs ? `Bruto verkoop ${formatEuroDecimal(v.bruto_verkoopprijs)} · commissie ${v.consignatie_perc}%` : undefined}
                  >
                    {formatEuroDecimal(v.verkoopprijs)}
                    {v.isConsignatie && <span className="ml-1 text-[10px] text-muted-foreground/70">comm.</span>}
                  </td>
                  <td className={cn("px-4 text-right font-semibold whitespace-nowrap", marge >= 0 ? "text-emerald-500" : "text-red-500")}>
                    {marge >= 0 ? "+" : "−"}{formatEuroDecimal(Math.abs(marge))}
                  </td>
                  <td className="px-2 text-right">
                    {v.isHandmatig && (
                      <button
                        onClick={() => handleDelete(v)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
                        title="Verwijderen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="h-14 bg-muted/40 font-semibold text-foreground border-t border-border">
              <td className="px-4 whitespace-nowrap" colSpan={6}>TOTAAL · {vehicles.length} auto{vehicles.length === 1 ? "" : "'s"}</td>
              <td className="px-4 text-right whitespace-nowrap">{formatEuroDecimal(totals.inkoop)}</td>
              <td className="px-4 text-right whitespace-nowrap">{formatEuroDecimal(totals.verkoop)}</td>
              <td className={cn("px-4 text-right whitespace-nowrap", totals.marge >= 0 ? "text-emerald-500" : "text-red-500")}>
                {totals.marge >= 0 ? "+" : "−"}{formatEuroDecimal(Math.abs(totals.marge))}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      )}

      <HandmatigeVerkoopDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => onChanged?.()}
        defaultDate={defaultDate}
      />
    </div>
  );
};

export default VerkopenSheet;
