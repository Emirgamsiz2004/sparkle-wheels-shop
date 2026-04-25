import { useState } from "react";
import { CheckCircle2, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { formatKenteken } from "@/lib/kenteken";
import { cn } from "@/lib/utils";

interface Props {
  inruil: boolean;
  inruilKenteken: string;
  inruilMerk: string;
  inruilModel: string;
  inruilKm: number | "";
  inruilWaarde: number | "";
  initialInruilOpNaam: boolean;
  initialInruilOpNaamAt: string | null;
  onSaved: (extra: Record<string, any>) => Promise<void>;
}

const fmtEur = (n: number) =>
  n.toLocaleString("nl-NL", { style: "currency", currency: "EUR" });

const toLocalInputValue = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

const Stap9InruilOpNaam = ({
  inruil,
  inruilKenteken,
  inruilMerk,
  inruilModel,
  inruilKm,
  inruilWaarde,
  initialInruilOpNaam,
  initialInruilOpNaamAt,
  onSaved,
}: Props) => {
  const [opNaam, setOpNaam] = useState<boolean>(!!initialInruilOpNaam);
  const [opNaamAt, setOpNaamAt] = useState<string>(
    initialInruilOpNaamAt || new Date().toISOString(),
  );

  // ─── Geen inruil → automatisch afronden ───
  if (!inruil) {
    return (
      <div className="space-y-6">
        <div className="rounded-[14px] border border-border bg-card p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm text-foreground font-medium">Geen inruil bij deze verkoop</p>
          <p className="text-xs text-muted-foreground mt-1">
            Deze stap is automatisch afgerond.
          </p>
        </div>
      </div>
    );
  }

  const handleToggle = async (val: boolean) => {
    setOpNaam(val);
    const ts = val ? opNaamAt || new Date().toISOString() : null;
    await onSaved({
      inruil_op_naam: val,
      inruil_op_naam_at: ts,
      stap9_afgerond: val,
    });
  };

  const handleDatumChange = async (v: string) => {
    if (!v) return;
    const iso = new Date(v).toISOString();
    setOpNaamAt(iso);
    if (opNaam) {
      await onSaved({
        inruil_op_naam: true,
        inruil_op_naam_at: iso,
        stap9_afgerond: true,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Inruilauto gegevens ─── */}
      <div className="rounded-[14px] border border-border bg-card p-6">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-4">
          Inruilauto
        </div>
        <div className="space-y-3 text-sm">
          <Row label="Kenteken">
            <span className="font-mono uppercase text-foreground">
              {inruilKenteken ? formatKenteken(inruilKenteken) : "—"}
            </span>
          </Row>
          <Row label="Merk & model">
            <span className="text-foreground">
              {[inruilMerk, inruilModel].filter(Boolean).join(" ") || "—"}
            </span>
          </Row>
          <Row label="Kilometerstand">
            <span className="text-foreground tabular-nums">
              {typeof inruilKm === "number" ? `${inruilKm.toLocaleString("nl-NL")} km` : "—"}
            </span>
          </Row>
          <Row label="Inruilwaarde">
            <span className="text-foreground font-semibold">
              {typeof inruilWaarde === "number" ? fmtEur(inruilWaarde) : "—"}
            </span>
          </Row>
        </div>
      </div>

      {/* ─── Uitleg ─── */}
      <div className="rounded-[14px] border border-blue-500/30 bg-blue-500/5 p-4 flex gap-3">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/90 leading-relaxed">
          De inruilauto moet op naam van Platin Automotive worden gezet via het RDW portaal{" "}
          <span className="font-semibold">VOORDAT</span> de verkochte auto op naam van de koper
          wordt overgezet (stap 10). Doe dit via{" "}
          <a
            href="https://mijn.rdw.nl"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-blue-300"
          >
            mijn.rdw.nl
          </a>
          .
        </p>
      </div>

      {/* ─── Bevestiging ─── */}
      <div className="rounded-[14px] border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-foreground font-medium">
              Inruilauto is op naam van Platin Automotive gezet
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Wordt vastgelegd als juridisch bewijs.
            </div>
          </div>
          <Switch
            checked={opNaam}
            onCheckedChange={handleToggle}
            className="data-[state=unchecked]:bg-white/10 data-[state=unchecked]:border-white/30 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 [&>span]:bg-white"
          />
        </div>

        <div>
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 block">
            Datum & tijdstip overzetting
          </label>
          <input
            type="datetime-local"
            value={toLocalInputValue(opNaamAt)}
            onChange={(e) => handleDatumChange(e.target.value)}
            className={cn(
              "w-full sm:w-auto bg-background border border-border rounded-[10px] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
            )}
          />
          {opNaam && (
            <div className="text-[11px] text-muted-foreground mt-1.5">
              Vastgelegd op{" "}
              {format(parseISO(opNaamAt), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
            </div>
          )}
        </div>
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

export default Stap9InruilOpNaam;
