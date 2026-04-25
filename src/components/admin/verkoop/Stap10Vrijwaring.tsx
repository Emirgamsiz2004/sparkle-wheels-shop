import { useState } from "react";
import { Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { formatKenteken } from "@/lib/kenteken";

interface Props {
  voertuigKenteken: string;
  voertuigMerk: string;
  voertuigModel: string;
  voertuigBouwjaar: number | null;
  initialVrijwaringBevestigd: boolean;
  initialVrijwaringDatum: string | null; // YYYY-MM-DD
  initialVrijwaringTijdstip: string | null; // HH:mm[:ss]
  initialTenaamstellingsbewijsKlaargelegd: boolean;
  onSaved: (extra: Record<string, any>) => Promise<void>;
}

const toLocalInput = (date: string | null, time: string | null): string => {
  if (date) {
    const t = (time || "00:00").slice(0, 5);
    return `${date}T${t}`;
  }
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

const splitLocal = (v: string): { date: string; time: string } => {
  const [d, t] = v.split("T");
  return { date: d, time: (t || "00:00").slice(0, 5) };
};

const Stap10Vrijwaring = ({
  voertuigKenteken,
  voertuigMerk,
  voertuigModel,
  voertuigBouwjaar,
  initialVrijwaringBevestigd,
  initialVrijwaringDatum,
  initialVrijwaringTijdstip,
  initialTenaamstellingsbewijsKlaargelegd,
  onSaved,
}: Props) => {
  const [bevestigd, setBevestigd] = useState<boolean>(!!initialVrijwaringBevestigd);
  const [moment, setMoment] = useState<string>(
    toLocalInput(initialVrijwaringDatum, initialVrijwaringTijdstip),
  );
  const [tenaamstelling, setTenaamstelling] = useState<boolean>(
    !!initialTenaamstellingsbewijsKlaargelegd,
  );

  const handleToggleVrijwaring = async (val: boolean) => {
    setBevestigd(val);
    const { date, time } = splitLocal(moment);
    await onSaved({
      vrijwaring_bevestigd: val,
      vrijwaring_datum: val ? date : null,
      vrijwaring_tijdstip: val ? `${time}:00` : null,
      stap10_afgerond: val,
    });
  };

  const handleMomentChange = async (v: string) => {
    if (!v) return;
    setMoment(v);
    if (bevestigd) {
      const { date, time } = splitLocal(v);
      await onSaved({
        vrijwaring_bevestigd: true,
        vrijwaring_datum: date,
        vrijwaring_tijdstip: `${time}:00`,
        stap10_afgerond: true,
      });
    }
  };

  const handleToggleTenaamstelling = async (val: boolean) => {
    setTenaamstelling(val);
    await onSaved({ tenaamstellingsbewijs_klaargelegd: val });
  };

  const { date, time } = splitLocal(moment);
  const vastgelegdLabel =
    bevestigd && date
      ? `Vastgelegd op ${format(parseISO(date), "d MMMM yyyy", { locale: nl })} om ${time}`
      : null;

  return (
    <div className="space-y-6">
      {/* ─── Voertuig info ─── */}
      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-4">
          Voertuig
        </div>
        <div className="space-y-3 text-sm">
          <Row label="Kenteken">
            <span className="font-mono uppercase text-foreground">
              {voertuigKenteken ? formatKenteken(voertuigKenteken) : "—"}
            </span>
          </Row>
          <Row label="Merk & model">
            <span className="text-foreground">
              {[voertuigMerk, voertuigModel].filter(Boolean).join(" ") || "—"}
            </span>
          </Row>
          <Row label="Bouwjaar">
            <span className="text-foreground">{voertuigBouwjaar || "—"}</span>
          </Row>
        </div>
      </div>

      {/* ─── Info-blok ─── */}
      <div className="rounded-[14px] border border-blue-500/30 bg-blue-500/5 p-4 flex gap-3">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/90 leading-relaxed">
          Vraag de vrijwaring aan via{" "}
          <a
            href="https://mijn.rdw.nl"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-blue-300"
          >
            mijn.rdw.nl
          </a>{" "}
          <span className="font-semibold">VOORDAT</span> je de auto overhandigt. Leg de exacte
          datum en tijd vast — dit is je juridisch bewijs dat je niet meer aansprakelijk bent voor
          het voertuig vanaf dat moment. De koper heeft 5 werkdagen om het voertuig op zijn naam
          te zetten.
        </p>
      </div>

      {/* ─── Vrijwaring bevestigen ─── */}
      <div className="rounded-[14px] border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-foreground font-medium">
              Vrijwaring aangevraagd via RDW portaal
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Wordt vastgelegd als juridisch bewijs.
            </div>
          </div>
          <Switch
            checked={bevestigd}
            onCheckedChange={handleToggleVrijwaring}
            className="data-[state=unchecked]:bg-white/10 data-[state=unchecked]:border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 [&>span]:bg-white"
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 block">
            Datum & tijdstip aanvraag
          </label>
          <input
            type="datetime-local"
            value={moment}
            onChange={(e) => handleMomentChange(e.target.value)}
            className="w-full sm:w-auto bg-background border border-border rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {vastgelegdLabel && (
            <div className="text-[11px] text-muted-foreground mt-1.5">{vastgelegdLabel}</div>
          )}
        </div>
      </div>

      {/* ─── Overschrijving ─── */}
      <div className="rounded-[14px] border border-border bg-card p-6 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-foreground font-medium">
              Tenaamstellingsbewijs klaargelegd voor de koper
            </div>
          </div>
          <Switch
            checked={tenaamstelling}
            onCheckedChange={handleToggleTenaamstelling}
            className="data-[state=unchecked]:bg-white/10 data-[state=unchecked]:border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 [&>span]:bg-white"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          De koper moet het voertuig binnen 5 werkdagen op zijn naam zetten.
        </p>
      </div>
    </div>
  );
};

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
    <span className="text-right tabular-nums">{children}</span>
  </div>
);

export default Stap10Vrijwaring;
