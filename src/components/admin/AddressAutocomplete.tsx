import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting?: { main_text: string; secondary_text: string };
}

interface AddressFilledData {
  adres: string;
  postcode: string;
  woonplaats: string;
  land: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (v: string) => void;
  onAddressSelected: (data: AddressFilledData) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
}

const genToken = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const AddressAutocomplete = ({
  value,
  onChange,
  onAddressSelected,
  placeholder = "Begin met typen…",
  className,
  maxLength,
}: AddressAutocompleteProps) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const sessionToken = useRef(genToken());
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipFetch = useRef(false);

  // Click outside om te sluiten
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("google-places-autocomplete", {
          body: { action: "autocomplete", input: q, sessionToken: sessionToken.current },
        });
        if (error) throw error;
        const preds: Prediction[] = (data as any)?.predictions || [];
        setPredictions(preds);
        setOpen(preds.length > 0);
        setActiveIdx(-1);
      } catch {
        setPredictions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [value]);

  const select = async (p: Prediction) => {
    skipFetch.current = true;
    onChange(p.description);
    setOpen(false);
    setPredictions([]);
    try {
      const { data } = await supabase.functions.invoke("google-places-autocomplete", {
        body: { action: "details", placeId: p.place_id, sessionToken: sessionToken.current },
      });
      const d = data as any;
      if (d?.adres) {
        skipFetch.current = true;
        onChange(d.adres);
        onAddressSelected({
          adres: d.adres,
          postcode: d.postcode || "",
          woonplaats: d.woonplaats || "",
          land: d.land || "Nederland",
        });
      }
    } catch {
      /* stille fallback */
    } finally {
      sessionToken.current = genToken();
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || predictions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      select(predictions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKey}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(className, "pr-9")}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        </div>
      </div>
      {open && predictions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-[10px] shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {predictions.map((p, idx) => (
            <button
              type="button"
              key={p.place_id}
              onClick={() => select(p)}
              onMouseEnter={() => setActiveIdx(idx)}
              className={cn(
                "w-full text-left px-3 py-2.5 flex items-start gap-2 transition-colors",
                idx === activeIdx ? "bg-muted" : "hover:bg-muted/60",
                idx > 0 && "border-t border-border/60",
              )}
            >
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">
                  {p.structured_formatting?.main_text || p.description}
                </p>
                {p.structured_formatting?.secondary_text && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.structured_formatting.secondary_text}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
