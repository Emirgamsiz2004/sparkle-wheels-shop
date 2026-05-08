import { useState } from "react";
import { Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { formatKenteken } from "@/lib/kenteken";

interface Props {
  voertuigKenteken: string;
  voertuigMerk: string;
  voertuigModel: string;
  voertuigBouwjaar: number | null;
  initialMachtigingsnummer: string | null;
  initialMachtigingDatum: string | null; // ISO timestamp
  initialMachtigingOntvangen: boolean;
  initialTenaamstellingBevestigd: boolean;
  initialTenaamstellingDatum: string | null; // ISO timestamp
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

const formatLocal = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${format(d, "d MMMM yyyy", { locale: nl })} om ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const Stap10Vrijwaring = ({
  voertuigKenteken,
  voertuigMerk,
  voertuigModel,
  voertuigBouwjaar,
  initialMachtigingsnummer,
  initialMachtigingDatum,
  initialMachtigingOntvangen,
  initialTenaamstellingBevestigd,
  initialTenaamstellingDatum,
  onSaved,
}: Props) => {
  const [machtigingsnummer, setMachtigingsnummer] = useState<string>(
    initialMachtigingsnummer || "",
  );
  const [machtigingMoment, setMachtigingMoment] = useState<string>(
    isoToLocalInput(initialMachtigingDatum),
  );
  const [machtigingOntvangen, setMachtigingOntvangen] = useState<boolean>(
    !!initialMachtigingOntvangen,
  );

  const [tenaamstellingMoment, setTenaamstellingMoment] = useState<string>(
    isoToLocalInput(initialTenaamstellingDatum),
  );
  const [tenaamstellingBevestigd, setTenaamstellingBevestigd] = useState<boolean>(
    !!initialTenaamstellingBevestigd,
  );

  const handleNummerBlur = async () => {
    await onSaved({ machtigingsnummer: machtigingsnummer || null });
  };

  const handleMachtigingMomentChange = async (v: string) => {
    if (!v) return;
    setMachtigingMoment(v);
    await onSaved({ machtiging_datum: localInputToIso(v) });
  };

  const handleToggleMachtiging = async (val: boolean) => {
    setMachtigingOntvangen(val);
    await onSaved({
      machtiging_ontvangen: val,
      machtigingsnummer: machtigingsnummer || null,
      machtiging_datum: localInputToIso(machtigingMoment),
    });
  };

  const handleTenaamstellingMomentChange = async (v: string) => {
    if (!v) return;
    setTenaamstellingMoment(v);
    if (tenaamstellingBevestigd) {
      await onSaved({ tenaamstelling_datum: localInputToIso(v) });
    }
  };

  const handleToggleTenaamstelling = async (val: boolean) => {
    setTenaamstellingBevestigd(val);
    await onSaved({
      tenaamstelling_bevestigd: val,
      tenaamstelling_datum: val ? localInputToIso(tenaamstellingMoment) : null,
      stap10_afgerond: val,
    });
  };

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

      {/* ─── STAP 1 — Machtiging RDW ─── */}
      <div className="rounded-[14px] border border-border bg-card p-6 space-y-5">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
            Stap 1
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Machtiging aanvragen via RDW
          </h3>
        </div>

        <div className="rounded-[10px] border border-blue-500/30 bg-blue-500/5 p-3 flex gap-3">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/90 leading-relaxed">
            Vraag een digitale machtiging aan via{" "}
            <a
              href="https://digitaalmachtigen.rdw.nl/"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-blue-300"
            >
              digitaalmachtigen.rdw.nl
            </a>
            . Je ontvangt een machtigingsnummer waarmee je het voertuig via het VWE portaal direct
            op naam van de koper kunt zetten.
          </p>
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 block">
            Machtigingsnummer
          </label>
          <Input
            value={machtigingsnummer}
            onChange={(e) => setMachtigingsnummer(e.target.value)}
            onBlur={handleNummerBlur}
            placeholder="bijv. M-12345678"
            className="w-full sm:max-w-xs"
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 block">
            Datum & tijdstip machtiging
          </label>
          <input
            type="datetime-local"
            value={machtigingMoment}
            onChange={(e) => handleMachtigingMomentChange(e.target.value)}
            className="w-full sm:w-auto bg-background border border-border rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <div>
            <div className="text-sm text-foreground font-medium">Machtiging ontvangen</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Bevestig zodra je het machtigingsnummer van de RDW hebt.
            </div>
          </div>
          <Switch
            checked={machtigingOntvangen}
            onCheckedChange={handleToggleMachtiging}
            className="data-[state=unchecked]:bg-white/10 data-[state=unchecked]:border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 [&>span]:bg-white"
          />
        </div>
      </div>

      {/* ─── STAP 2 — Tenaamstelling VWE ─── */}
      {machtigingOntvangen && (
        <div className="rounded-[14px] border border-border bg-card p-6 space-y-5">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Stap 2
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Tenaamstelling via VWE portaal
            </h3>
          </div>

          <div className="rounded-[10px] border border-blue-500/30 bg-blue-500/5 p-3 flex gap-3">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90 leading-relaxed">
              Zet het voertuig op naam van de koper via het VWE portaal met het machtigingsnummer:{" "}
              <a
                href="https://mijn.vwe.nl/rdw/tv"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-blue-300"
              >
                mijn.vwe.nl/rdw/tv
              </a>
              .
            </p>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 block">
              Datum & tijdstip tenaamstelling
            </label>
            <input
              type="datetime-local"
              value={tenaamstellingMoment}
              onChange={(e) => handleTenaamstellingMomentChange(e.target.value)}
              className="w-full sm:w-auto bg-background border border-border rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {tenaamstellingBevestigd && (
              <div className="text-[11px] text-muted-foreground mt-1.5">
                Vastgelegd op {formatLocal(localInputToIso(tenaamstellingMoment))} — juridisch
                bewijs van overschrijving
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <div>
              <div className="text-sm text-foreground font-medium">
                Voertuig tenaamgesteld op naam koper
              </div>
            </div>
            <Switch
              checked={tenaamstellingBevestigd}
              onCheckedChange={handleToggleTenaamstelling}
              className="data-[state=unchecked]:bg-white/10 data-[state=unchecked]:border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 [&>span]:bg-white"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            De koper heeft 5 werkdagen om de tenaamstelling te voltooien als dit nog niet gedaan
            is.
          </p>
        </div>
      )}
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
