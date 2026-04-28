import { useMemo } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { useInkoopverklaringen } from "@/hooks/useInkoopverklaringen";
import { formatEuro } from "@/hooks/useKosten";
import { TrendingUp, TrendingDown, Award, BarChart3, Handshake } from "lucide-react";

const VoertuigMargesTab = () => {
  const { vehicles, loading } = useVehicles();
  const { verklaringen } = useInkoopverklaringen();

  const enriched = useMemo(() => {
    return [...vehicles]
      .sort((a: any, b: any) => {
        const da = new Date(a.verkoopDatum || a.inkoopDatum || 0).getTime();
        const db = new Date(b.verkoopDatum || b.inkoopDatum || 0).getTime();
        return db - da;
      })
      .map((v: any) => {
        const iv = verklaringen.find(
          (x) =>
            (x.vehicleId && x.vehicleId === v.id) ||
            (x.kenteken && v.kenteken && x.kenteken.replace(/-/g, "").toLowerCase() === v.kenteken.replace(/-/g, "").toLowerCase())
        );
        const isConsignatie = v.verkoopType === "consignatie" || v.status === "consignatie";
        const inkoopprijs = isConsignatie ? 0 : (Number(v.inkoopprijs || 0) || Number(iv?.inkoopprijs || 0));
        const verkoopprijs = Number(v.verkoopprijs || 0);
        const verkocht = v.status === "verkocht" && verkoopprijs > 0;
        const commissiePerc = Number(v.consignatieCommissiePerc) > 0 ? Number(v.consignatieCommissiePerc) : 10;

        let brutoMarge: number | null = null;
        let margePerc: number | null = null;

        if (verkocht) {
          if (isConsignatie) {
            brutoMarge = verkoopprijs * (commissiePerc / 100);
            margePerc = commissiePerc;
          } else if (inkoopprijs > 0) {
            brutoMarge = verkoopprijs - inkoopprijs;
            margePerc = ((verkoopprijs - inkoopprijs) / inkoopprijs) * 100;
          }
        }

        return {
          v, iv, inkoopprijs, verkoopprijs, verkocht, brutoMarge, margePerc, isConsignatie, commissiePerc,
        };
      });
  }, [vehicles, verklaringen]);

  const verkocht = enriched.filter((e) => e.verkocht);
  const verkochtEigen = verkocht.filter((e) => !e.isConsignatie && e.margePerc !== null);
  const verkochtConsign = verkocht.filter((e) => e.isConsignatie);

  const totaalWinst = verkocht.reduce((s, e) => s + (e.brutoMarge || 0), 0);
  const gemEigenPerc =
    verkochtEigen.length > 0 ? verkochtEigen.reduce((s, e) => s + (e.margePerc || 0), 0) / verkochtEigen.length : 0;
  const gemConsignPerc =
    verkochtConsign.length > 0 ? verkochtConsign.reduce((s, e) => s + (e.margePerc || 0), 0) / verkochtConsign.length : 0;

  const hoogste = verkocht.reduce<typeof enriched[0] | null>(
    (best, e) => (best === null || (e.brutoMarge ?? -Infinity) > (best.brutoMarge ?? -Infinity) ? e : best),
    null
  );
  const laagste = verkocht.reduce<typeof enriched[0] | null>(
    (worst, e) => (worst === null || (e.brutoMarge ?? Infinity) < (worst.brutoMarge ?? Infinity) ? e : worst),
    null
  );

  if (loading) return <p className="text-sm text-muted-foreground">Laden…</p>;

  return (
    <div className="space-y-4">
      {/* Compacte samenvattingskaarten — 3 in een rij */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CompactCard
          icon={Award}
          label="Totale bruto winst"
          primary={formatEuro(totaalWinst)}
          accent={totaalWinst >= 0 ? "positive" : "negative"}
        />
        <CompactCard
          icon={BarChart3}
          label="Gem. marge eigen inkoop"
          primary={verkochtEigen.length > 0 ? `${gemEigenPerc.toFixed(1)}%` : "—"}
          sub={`${verkochtEigen.length} voertuig${verkochtEigen.length === 1 ? "" : "en"}`}
        />
        <CompactCard
          icon={TrendingUp}
          label="Beste marge"
          primary={hoogste ? `${hoogste.v.merk} ${hoogste.v.model}` : "—"}
          sub={hoogste ? formatEuro(hoogste.brutoMarge!) : undefined}
        />
      </div>

      {/* Tabel */}
      <div className="bg-card border border-border rounded-[16px] overflow-hidden">
        {enriched.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Nog geen voertuigen.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-muted-foreground text-[11px] uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Voertuig</th>
                  <th className="text-left px-4 py-2 font-medium">Type</th>
                  <th className="text-right px-4 py-2 font-medium">Inkoopprijs</th>
                  <th className="text-right px-4 py-2 font-medium">Verkoopprijs</th>
                  <th className="text-right px-4 py-2 font-medium">Bruto marge</th>
                  <th className="text-right px-4 py-2 font-medium">Marge %</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((e) => {
                  const ingekocht = e.v.inkoopDatum ? new Date(e.v.inkoopDatum).toLocaleDateString("nl-NL") : "—";
                  const verkochtDatum = e.v.verkoopDatum ? new Date(e.v.verkoopDatum).toLocaleDateString("nl-NL") : null;
                  const tooltip = verkochtDatum
                    ? `Ingekocht: ${ingekocht} | Verkocht: ${verkochtDatum}`
                    : `Ingekocht: ${ingekocht}`;
                  return (
                    <tr
                      key={e.v.id}
                      title={tooltip}
                      className="border-t border-border hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <div className="text-[14px] font-semibold text-foreground leading-tight">
                          {e.v.merk} {e.v.model}
                        </div>
                        <div className="text-[12px] text-muted-foreground tabular-nums leading-tight">
                          {e.v.kenteken || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] border ${
                          e.isConsignatie
                            ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            : "bg-secondary text-muted-foreground border-border"
                        }`}>
                          {e.isConsignatie ? "Consignatie" : "Eigen"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-foreground tabular-nums text-[12px]">
                        {e.isConsignatie ? (
                          <span className="text-muted-foreground italic">Consignatie</span>
                        ) : e.inkoopprijs > 0 ? (
                          formatEuro(e.inkoopprijs)
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-foreground tabular-nums text-[12px]">
                        {e.verkocht ? formatEuro(e.verkoopprijs) : "—"}
                      </td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-medium text-[13px] ${
                        e.brutoMarge === null
                          ? "text-muted-foreground"
                          : e.brutoMarge >= 0
                          ? "text-emerald-500"
                          : "text-red-400"
                      }`}>
                        {e.brutoMarge === null ? "—" : formatEuro(e.brutoMarge)}
                      </td>
                      <td className={`px-4 py-2.5 text-right tabular-nums text-[12px] ${
                        e.margePerc === null
                          ? "text-muted-foreground"
                          : e.margePerc >= 0
                          ? "text-emerald-500"
                          : "text-red-400"
                      }`}>
                        {e.margePerc === null ? "—" : `${e.margePerc.toFixed(1)}%`}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                          e.verkocht ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground"
                        }`}>
                          {e.verkocht ? "Verkocht" : "In voorraad"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const CompactCard = ({
  icon: Icon, label, primary, sub, accent,
}: { icon: any; label: string; primary: string; sub?: string; accent?: "positive" | "negative" }) => (
  <div className="bg-card border border-border rounded-[16px] px-4 py-3">
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
      <Icon className="w-3 h-3" />
      <span className="truncate">{label}</span>
    </div>
    <div className={`text-[15px] font-semibold tabular-nums truncate ${
      accent === "positive" ? "text-emerald-500" : accent === "negative" ? "text-red-400" : "text-foreground"
    }`}>
      {primary}
    </div>
    {sub && <p className="text-[11px] text-muted-foreground mt-0.5 truncate tabular-nums">{sub}</p>}
  </div>
);

export default VoertuigMargesTab;
