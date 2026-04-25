import { useState } from "react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { formatKenteken } from "@/lib/kenteken";

interface Props {
  verkoopId: string | null;
  voertuigKenteken: string;
  voertuigMerk: string;
  voertuigModel: string;
  voertuigBouwjaar: number | null;
  voertuigApkVervaldatum: string | null;
  initialAutoSchoongemaakt: boolean;
  initialApkGecommuniceerd: boolean;
  initialSleutelsOverhandigd: boolean;
  initialSleutelsAantal: number | null;
  initialGebrekenBesproken: boolean;
  initialGebrekenOmschrijving: string | null;
  initialTenaamstellingsbewijsMeegegeven: boolean;
  initialUitleveringFotos: string[];
  initialUitleveringDatum: string | null;
  initialUitleveringVoltooid: boolean;
  onSaved: (extra: Record<string, any>) => Promise<void>;
}

const pad = (n: number) => String(n).padStart(2, "0");

const isoToLocalInput = (iso: string | null): string => {
  const d = iso ? new Date(iso) : new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

const localInputToIso = (v: string): string => new Date(v).toISOString();

const Stap11Uitlevering = ({
  voertuigKenteken,
  voertuigMerk,
  voertuigModel,
  voertuigBouwjaar,
  voertuigApkVervaldatum,
  initialAutoSchoongemaakt,
  initialApkGecommuniceerd,
  initialSleutelsOverhandigd,
  initialSleutelsAantal,
  initialGebrekenBesproken,
  initialGebrekenOmschrijving,
  initialTenaamstellingsbewijsMeegegeven,
  initialUitleveringFotos,
  initialUitleveringDatum,
  initialUitleveringVoltooid,
  onSaved,
}: Props) => {
  // Behouden state (worden meegestuurd in persist, ongewijzigd opgeslagen)
  const [autoSchoon] = useState(initialAutoSchoongemaakt);
  const [sleutelsOverh] = useState(initialSleutelsOverhandigd);
  const [sleutelsAantal] = useState<number>(initialSleutelsAantal ?? 2);
  const [fotos] = useState<string[]>(initialUitleveringFotos || []);

  // Actieve UI state
  const [apkGecomm, setApkGecomm] = useState(initialApkGecommuniceerd);
  const [gebrekenBesproken, setGebrekenBesproken] = useState(initialGebrekenBesproken);
  const [gebrekenOmschrijving, setGebrekenOmschrijving] = useState(
    initialGebrekenOmschrijving || "",
  );
  const [tenaamMee, setTenaamMee] = useState(initialTenaamstellingsbewijsMeegegeven);
  const [uitleveringDatum, setUitleveringDatum] = useState<string>(
    isoToLocalInput(initialUitleveringDatum),
  );
  const [voltooid, setVoltooid] = useState(initialUitleveringVoltooid);

  const persist = async (overrides: Record<string, any> = {}) => {
    await onSaved({
      auto_schoongemaakt: autoSchoon,
      apk_gecommuniceerd: apkGecomm,
      sleutels_overhandigd: sleutelsOverh,
      sleutels_aantal: sleutelsAantal,
      gebreken_besproken: gebrekenBesproken,
      gebreken_omschrijving: gebrekenBesproken ? gebrekenOmschrijving || null : null,
      tenaamstellingsbewijs_meegegeven: tenaamMee,
      uitlevering_fotos: fotos,
      uitlevering_datum: localInputToIso(uitleveringDatum),
      uitlevering_voltooid: voltooid,
      ...overrides,
    });
  };

  const handleToggleApk = async (v: boolean) => {
    setApkGecomm(v);
    await persist({ apk_gecommuniceerd: v });
  };
  const handleToggleGebreken = async (v: boolean) => {
    setGebrekenBesproken(v);
    await persist({
      gebreken_besproken: v,
      gebreken_omschrijving: v ? gebrekenOmschrijving || null : null,
    });
  };
  const handleToggleTenaam = async (v: boolean) => {
    setTenaamMee(v);
    await persist({ tenaamstellingsbewijs_meegegeven: v });
  };
  const handleDatumChange = async (v: string) => {
    setUitleveringDatum(v);
    await persist({ uitlevering_datum: localInputToIso(v) });
  };
  const handleToggleVoltooid = async (v: boolean) => {
    setVoltooid(v);
    await persist({
      uitlevering_voltooid: v,
      stap11_afgerond: v,
    });
  };

  const formattedApk = (() => {
    if (!voertuigApkVervaldatum) return null;
    try {
      return format(parseISO(voertuigApkVervaldatum), "d MMMM yyyy", { locale: nl });
    } catch {
      return voertuigApkVervaldatum;
    }
  })();

  return (
    <div className="space-y-6">
      {/* Voertuigkaart */}
      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
          Voertuig
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {voertuigKenteken && (
            <span className="font-mono uppercase">
              {formatKenteken(voertuigKenteken)}
            </span>
          )}
          <span className="text-foreground font-medium">
            {voertuigMerk} {voertuigModel}
          </span>
          {voertuigBouwjaar && (
            <span className="text-muted-foreground">{voertuigBouwjaar}</span>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div className="rounded-[14px] border border-border bg-card p-6 space-y-5">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Checklist uitlevering
        </div>

        <ChecklistItem
          label="APK-vervaldatum gecommuniceerd aan koper"
          checked={apkGecomm}
          onChange={handleToggleApk}
          extra={
            formattedApk ? (
              <div className="text-[12px] text-muted-foreground mt-1">
                APK geldig tot:{" "}
                <span className="text-foreground">{formattedApk}</span>
              </div>
            ) : (
              <div className="text-[12px] text-muted-foreground mt-1">
                Geen APK-vervaldatum bekend
              </div>
            )
          }
        />

        <div className="space-y-2">
          <ChecklistItem
            label="Bekende gebreken besproken en vastgelegd"
            checked={gebrekenBesproken}
            onChange={handleToggleGebreken}
          />
          {gebrekenBesproken && (
            <div className="pl-1">
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 block">
                Omschrijving gebreken (optioneel)
              </label>
              <textarea
                value={gebrekenOmschrijving}
                onChange={(e) => setGebrekenOmschrijving(e.target.value)}
                onBlur={() => persist({ gebreken_omschrijving: gebrekenOmschrijving || null })}
                rows={3}
                className="w-full bg-background border border-border rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Bijv. lichte kras op achterbumper, klein deukje portier"
              />
            </div>
          )}
        </div>

        <ChecklistItem
          label="Tenaamstellingsbewijs meegegeven aan koper"
          checked={tenaamMee}
          onChange={handleToggleTenaam}
        />
      </div>

      {/* Datum & tijdstip */}
      <div className="rounded-[14px] border border-border bg-card p-6">
        <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 block">
          Datum & tijdstip uitlevering
        </label>
        <input
          type="datetime-local"
          value={uitleveringDatum}
          onChange={(e) => handleDatumChange(e.target.value)}
          className="bg-background border border-border rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="text-[11px] text-muted-foreground mt-1.5">
          Wordt vastgelegd als officieel uitlevermoment
        </div>
      </div>

      {/* Afsluiting */}
      <div className="flex items-center justify-between gap-4 rounded-[14px] border border-border bg-card p-6">
        <div>
          <div className="text-sm text-foreground font-medium">
            Uitlevering voltooid — auto is overhandigd aan koper
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Pas als deze toggle aan staat wordt stap 12 ontgrendeld.
          </div>
        </div>
        <Switch
          checked={voltooid}
          onCheckedChange={handleToggleVoltooid}
          className="data-[state=unchecked]:bg-white/10 data-[state=unchecked]:border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 [&>span]:bg-white"
        />
      </div>
    </div>
  );
};

const ChecklistItem = ({
  label,
  checked,
  onChange,
  extra,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  extra?: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1">
      <div className="text-sm text-foreground">{label}</div>
      {extra}
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      className="data-[state=unchecked]:bg-white/10 data-[state=unchecked]:border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 [&>span]:bg-white mt-0.5"
    />
  </div>
);

export default Stap11Uitlevering;
