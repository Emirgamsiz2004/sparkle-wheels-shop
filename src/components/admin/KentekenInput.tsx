import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatKenteken, isValidKenteken } from "@/lib/kenteken";
import { CheckCircle2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}

const KentekenInput = ({ value, onChange, label = "Kenteken" }: Props) => {
  const [touched, setTouched] = useState(false);
  const valid = isValidKenteken(value);

  const handleChange = (raw: string) => {
    onChange(formatKenteken(raw));
  };

  const handleBlur = () => {
    setTouched(true);
    onChange(formatKenteken(value));
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
        {valid && (touched || value.length >= 4) && (
          <CheckCircle2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
        )}
      </div>
    </div>
  );
};

export default KentekenInput;
