import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// === Geboortedatum: 3 losse invoervelden DD / MM / JJJJ ===
// Value format: "YYYY-MM-DD" (or "")
export const GeboortedatumInputs = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  const initialDay = parts ? parts[3] : "";
  const initialMonth = parts ? parts[2] : "";
  const initialYear = parts ? parts[1] : "";

  const [dag, setDag] = useState(initialDay);
  const [maand, setMaand] = useState(initialMonth);
  const [jaar, setJaar] = useState(initialYear);
  const [error, setError] = useState<string | null>(null);

  const maandRef = useRef<HTMLInputElement>(null);
  const jaarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    setDag(m ? m[3] : "");
    setMaand(m ? m[2] : "");
    setJaar(m ? m[1] : "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const validateAndEmit = (d: string, mo: string, y: string) => {
    if (!d && !mo && !y) {
      setError(null);
      onChange("");
      return;
    }
    if (d.length < 1 || mo.length < 1 || y.length < 4) {
      setError(null);
      onChange("");
      return;
    }
    const di = parseInt(d, 10);
    const mi = parseInt(mo, 10);
    const yi = parseInt(y, 10);
    if (isNaN(di) || di < 1 || di > 31) {
      setError("Dag moet tussen 1 en 31 zijn");
      onChange("");
      return;
    }
    if (isNaN(mi) || mi < 1 || mi > 12) {
      setError("Maand moet tussen 1 en 12 zijn");
      onChange("");
      return;
    }
    const currentYear = new Date().getFullYear();
    if (isNaN(yi) || yi < 1900 || yi > currentYear) {
      setError(`Jaar moet tussen 1900 en ${currentYear} zijn`);
      onChange("");
      return;
    }
    const dt = new Date(yi, mi - 1, di);
    if (dt.getFullYear() !== yi || dt.getMonth() !== mi - 1 || dt.getDate() !== di) {
      setError("Ongeldige datum");
      onChange("");
      return;
    }
    setError(null);
    onChange(`${String(yi).padStart(4, "0")}-${String(mi).padStart(2, "0")}-${String(di).padStart(2, "0")}`);
  };

  const handleDag = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 2);
    setDag(clean);
    validateAndEmit(clean, maand, jaar);
    if (clean.length === 2) maandRef.current?.focus();
  };
  const handleMaand = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 2);
    setMaand(clean);
    validateAndEmit(dag, clean, jaar);
    if (clean.length === 2) jaarRef.current?.focus();
  };
  const handleJaar = (v: string) => {
    const clean = v.replace(/\D/g, "").slice(0, 4);
    setJaar(clean);
    validateAndEmit(dag, maand, clean);
  };

  const baseCls =
    "h-10 rounded-[10px] border-[0.5px] border-input bg-transparent px-3 py-2 text-sm text-center tabular-nums focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors";

  return (
    <div>
      <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2 items-center">
        <input
          autoComplete="off"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="DD"
          value={dag}
          onChange={(e) => handleDag(e.target.value)}
          maxLength={2}
          className={cn(baseCls, error && "border-destructive")}
          aria-label="Dag"
        />
        <input
          autoComplete="off"
          ref={maandRef}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="MM"
          value={maand}
          onChange={(e) => handleMaand(e.target.value)}
          maxLength={2}
          className={cn(baseCls, error && "border-destructive")}
          aria-label="Maand"
        />
        <input
          autoComplete="off"
          ref={jaarRef}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="JJJJ"
          value={jaar}
          onChange={(e) => handleJaar(e.target.value)}
          maxLength={4}
          className={cn(baseCls, error && "border-destructive")}
          aria-label="Jaar"
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default GeboortedatumInputs;
