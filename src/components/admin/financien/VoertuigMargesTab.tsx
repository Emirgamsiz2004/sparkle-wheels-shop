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
            <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
              <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold border-b border-border">Voertuig</th>
                  <th className="text-left px-3 py-2.5 font-semibold border-b border-border">Type</th>
                  <th className="text-right px-3 py-2.5 font-semibold border-b border-border">Inkoop</th>
                  <th className="text-right px-3 py-2.5 font-semibold border-b border-border">Verkoop</th>
                  <th className="text-right px-3 py-2.5 font-semibold border-b border-border">Bruto marge</th>
                  <th className="text-right px-3 py-2.5 font-semibold border-b border-border">Marge %</th>
                  <th className="text-left px-3 py-2.5 font-semibold border-b border-border">Status</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((e, idx) => {
                  const ingekocht = e.v.inkoopDatum ? new Date(e.v.inkoopDatum).toLocaleDateString("nl-NL") : "—";
                  const verkochtDatum = e.v.verkoopDatum ? new Date(e.v.verkoopDatum).toLocaleDateString("nl-NL") : null;
                  const tooltip = verkochtDatum
                    ? `Ingekocht: ${ingekocht} | Verkocht: ${verkochtDatum}`
                    : `Ingekocht: ${ingekocht}`;

                  const accent =
                    e.brutoMarge === null
                      ? "border-l-transparent"
                      : e.brutoMarge >= 0
                      ? "border-l-emerald-500"
                      : "border-l-red-500";

                  const margeColor =
                    e.brutoMarge === null
                      ? "text-muted-foreground"
                      : e.brutoMarge >= 0
                      ? "text-emerald-400"
                      : "text-red-400";

                  const margePercPill =
                    e.margePerc === null
                      ? "bg-secondary/60 text-muted-foreground border-border"
                      : e.margePerc >= 20
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : e.margePerc >= 0
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      : "bg-red-500/15 text-red-300 border-red-500/30";

                  const zebra = idx % 2 === 1 ? "bg-card/40" : "";

                  return (
                    <tr
                      key={e.v.id}
                      title={tooltip}
                      className={`hover:bg-accent/40 transition-colors ${zebra}`}
                    >
                      <td className={`px-4 py-3 border-b border-border/40 border-l-[3px] ${accent}`}>
                        <div className="text-[14px] font-semibold text-foreground leading-tight">
                          {e.v.merk} {e.v.model}
                        </div>
                        <div className="text-[11px] text-muted-foreground tabular-nums leading-tight mt-0.5 uppercase font-mono">
                          {e.v.kenteken || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3 border-b border-border/40">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          e.isConsignatie
                            ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                            : "bg-violet-500/10 text-violet-300 border-violet-500/25"
                        }`}>
                          {e.isConsignatie ? "Consignatie" : "Eigen"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[13px] text-foreground/90 border-b border-border/40">
                        {e.isConsignatie ? (
                          <span className="text-muted-foreground italic text-[12px]">n.v.t.</span>
                        ) : e.inkoopprijs > 0 ? (
                          formatEuro(e.inkoopprijs)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-[13px] text-foreground/90 border-b border-border/40">
                        {e.verkocht ? formatEuro(e.verkoopprijs) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className={`px-3 py-3 text-right tabular-nums font-semibold text-[14px] border-b border-border/40 ${margeColor}`}>
                        {e.brutoMarge === null ? <span className="text-muted-foreground font-normal">—</span> : formatEuro(e.brutoMarge)}
                      </td>
                      <td className="px-3 py-3 text-right border-b border-border/40">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums border ${margePercPill}`}>
                          {e.margePerc === null ? "—" : `${e.margePerc.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="px-3 py-3 border-b border-border/40">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          e.verkocht
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : "bg-secondary/60 text-muted-foreground border-border"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${e.verkocht ? "bg-emerald-400" : "bg-muted-foreground/50"}`} />
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
