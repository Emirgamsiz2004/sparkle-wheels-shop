import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatKenteken, isValidKenteken } from "@/lib/kenteken";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onValidKenteken?: (kenteken: string) => void;
  loading?: boolean;
  label?: string;
}

const KentekenInput = ({ value, onChange, onValidKenteken, loading, label = "Kenteken" }: Props) => {
  const [touched, setTouched] = useState(false);
  const valid = isValidKenteken(value);

  const handleChange = (raw: string) => {
    const formatted = formatKenteken(raw);
    onChange(formatted);
  };

  const handleBlur = () => {
    setTouched(true);
    const formatted = formatKenteken(value);
    onChange(formatted);
    if (isValidKenteken(formatted) && onValidKenteken) {
      onValidKenteken(formatted);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder="XX-999-X"
          className="pr-9 uppercase tracking-wider font-mono"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : valid && (touched || value.length >= 4) ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default KentekenInput;
