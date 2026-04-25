import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { formatKenteken } from "@/lib/kenteken";
import { cn } from "@/lib/utils";

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
  verkoopId,
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
  const [autoSchoon, setAutoSchoon] = useState(initialAutoSchoongemaakt);
  const [apkGecomm, setApkGecomm] = useState(initialApkGecommuniceerd);
  const [sleutelsOverh, setSleutelsOverh] = useState(initialSleutelsOverhandigd);
  const [sleutelsAantal, setSleutelsAantal] = useState<number>(
    initialSleutelsAantal ?? 2,
  );
  const [gebrekenBesproken, setGebrekenBesproken] = useState(initialGebrekenBesproken);
  const [gebrekenOmschrijving, setGebrekenOmschrijving] = useState(
    initialGebrekenOmschrijving || "",
  );
  const [tenaamMee, setTenaamMee] = useState(initialTenaamstellingsbewijsMeegegeven);
  const [fotos, setFotos] = useState<string[]>(initialUitleveringFotos || []);
  const [uploading, setUploading] = useState(false);
  const [uitleveringDatum, setUitleveringDatum] = useState<string>(
    isoToLocalInput(initialUitleveringDatum),
  );
  const [voltooid, setVoltooid] = useState(initialUitleveringVoltooid);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signed URLs voor preview
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result: Record<string, string> = {};
      for (const path of fotos) {
        if (signedUrls[path]) {
          result[path] = signedUrls[path];
          continue;
        }
        const { data } = await supabase.storage
          .from("vehicle-documents")
          .createSignedUrl(path, 60 * 60);
        if (data?.signedUrl) result[path] = data.signedUrl;
      }
      if (!cancelled) setSignedUrls(result);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fotos]);

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

  const handleToggleAutoSchoon = async (v: boolean) => {
    setAutoSchoon(v);
    await persist({ auto_schoongemaakt: v });
  };
  const handleToggleApk = async (v: boolean) => {
    setApkGecomm(v);
    await persist({ apk_gecommuniceerd: v });
  };
  const handleToggleSleutels = async (v: boolean) => {
    setSleutelsOverh(v);
    await persist({ sleutels_overhandigd: v });
  };
  const handleSleutelsAantal = async (n: number) => {
    setSleutelsAantal(n);
    await persist({ sleutels_aantal: n });
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

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!verkoopId) {
      toast.error("Geen verkoop gevonden");
      return;
    }
    setUploading(true);
    const newPaths: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const ts = Date.now();
        const path = `verkopen/${verkoopId}/uitlevering/${ts}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from("vehicle-documents")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) {
          console.error(error);
          toast.error(`Upload mislukt: ${file.name}`);
          continue;
        }
        newPaths.push(path);
      }
      if (newPaths.length > 0) {
        const next = [...fotos, ...newPaths];
        setFotos(next);
        await persist({ uitlevering_fotos: next });
        toast.success(`${newPaths.length} foto('s) geüpload`);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFoto = async (path: string) => {
    const next = fotos.filter((p) => p !== path);
    setFotos(next);
    await persist({ uitlevering_fotos: next });
    try {
      await supabase.storage.from("vehicle-documents").remove([path]);
    } catch (err) {
      console.warn("Verwijderen storage object mislukt", err);
    }
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
          label="Auto schoongemaakt en gedetailed"
          checked={autoSchoon}
          onChange={handleToggleAutoSchoon}
        />

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
            label="Sleutels overhandigd"
            checked={sleutelsOverh}
            onChange={handleToggleSleutels}
          />
          <div className="pl-1 flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Aantal sleutels:</span>
            {[1, 2].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleSleutelsAantal(n)}
                className={cn(
                  "px-3 py-1 text-[12px] rounded-[8px] border transition-colors",
                  sleutelsAantal === n
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

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

      {/* Foto's */}
      <div className="rounded-[14px] border border-border bg-card p-6 space-y-4">
        <div>
          <div className="text-[13px] font-medium text-foreground">
            Foto's bij uitlevering
          </div>
          <div className="text-[12px] text-muted-foreground mt-0.5">
            Minimaal 4 foto's maken ter bescherming achteraf
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || !verkoopId}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-[10px] hover:bg-accent disabled:opacity-50 transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
            Foto's uploaden
          </button>
          <span
            className={cn(
              "text-[12px]",
              fotos.length < 4 ? "text-amber-500" : "text-emerald-500",
            )}
          >
            {fotos.length} van minimaal 4 foto's geüpload
          </span>
        </div>

        {fotos.length < 4 && fotos.length > 0 && (
          <div className="flex items-center gap-2 rounded-[10px] border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Aanbevolen om minimaal 4 foto's te uploaden. Je kunt doorgaan, maar dit
              biedt minder bescherming achteraf.
            </span>
          </div>
        )}

        {fotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fotos.map((path) => (
              <div
                key={path}
                className="relative group aspect-square rounded-[10px] overflow-hidden border border-border bg-muted"
              >
                {signedUrls[path] ? (
                  <img
                    src={signedUrls[path]}
                    alt="Uitlevering"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveFoto(path)}
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-[6px] bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  aria-label="Verwijderen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
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
