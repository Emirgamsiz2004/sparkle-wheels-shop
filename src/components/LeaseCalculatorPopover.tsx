import { useState } from "react";
import { Calculator, ExternalLink } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  berekenLease,
  formatEuro,
  LEASE_DEFAULTS,
} from "@/lib/lease";

interface Props {
  prijs: number;
  trigger?: React.ReactNode;
}

const LOOPTIJDEN = [24, 36, 48, 60, 72];

const LeaseCalculatorPopover = ({ prijs, trigger }: Props) => {
  const [aanbetalingPct, setAanbetalingPct] = useState<number>(
    LEASE_DEFAULTS.aanbetalingPct * 100
  );
  const [slottermijnPct, setSlottermijnPct] = useState<number>(
    LEASE_DEFAULTS.slottermijnPct * 100
  );
  const [looptijd, setLooptijd] = useState<number>(LEASE_DEFAULTS.looptijd);

  const maandbedrag = berekenLease({
    prijs,
    aanbetalingPct: aanbetalingPct / 100,
    slottermijnPct: slottermijnPct / 100,
    looptijd,
  });
  const aanbetalingBedrag = Math.round((prijs * aanbetalingPct) / 100);
  const slottermijnBedrag = Math.round((prijs * slottermijnPct) / 100);

  const handleBedragChange = (
    raw: string,
    setter: (pct: number) => void
  ) => {
    const digits = raw.replace(/[^\d]/g, "");
    const v = Math.max(0, Math.min(prijs, Number(digits) || 0));
    setter((v / prijs) * 100);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-[13px] font-body font-medium text-foreground/80 hover:text-foreground underline underline-offset-4 transition-colors"
          >
            <Calculator className="w-3.5 h-3.5" />
            Bereken zelf je leasetermijn
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="w-[calc(100vw-1.5rem)] sm:w-[380px] max-h-[85vh] overflow-y-auto bg-card border border-border p-5 sm:p-6 space-y-6"
      >
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
            Indicatie financial lease
          </p>
          <p className="font-display text-3xl font-bold text-foreground">
            {formatEuro(maandbedrag)}
            <span className="text-base font-body font-normal text-muted-foreground ml-1.5">
              / maand
            </span>
          </p>
        </div>

        {/* Aanbetaling */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-[13px] font-body font-medium text-foreground">
              Aanbetaling
              <span className="ml-2 text-[12px] text-muted-foreground font-normal">
                {aanbetalingPct.toFixed(0)}%
              </span>
            </label>
            <div className="flex items-center bg-background border border-border focus-within:border-foreground transition-colors h-10 px-3">
              <span className="text-muted-foreground text-base mr-1">€</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={aanbetalingBedrag.toLocaleString("nl-NL")}
                onChange={(e) => handleBedragChange(e.target.value, setAanbetalingPct)}
                className="w-24 bg-transparent text-foreground font-medium text-right text-base focus:outline-none"
              />
            </div>
          </div>
          <Slider
            value={[aanbetalingPct]}
            min={0}
            max={90}
            step={1}
            onValueChange={(v) => setAanbetalingPct(v[0])}
            className="py-2"
          />
        </div>

        {/* Slottermijn */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-[13px] font-body font-medium text-foreground">
              Slottermijn
              <span className="ml-2 text-[12px] text-muted-foreground font-normal">
                {slottermijnPct.toFixed(0)}%
              </span>
            </label>
            <div className="flex items-center bg-background border border-border focus-within:border-foreground transition-colors h-10 px-3">
              <span className="text-muted-foreground text-base mr-1">€</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={slottermijnBedrag.toLocaleString("nl-NL")}
                onChange={(e) => handleBedragChange(e.target.value, setSlottermijnPct)}
                className="w-24 bg-transparent text-foreground font-medium text-right text-base focus:outline-none"
              />
            </div>
          </div>
          <Slider
            value={[slottermijnPct]}
            min={0}
            max={50}
            step={1}
            onValueChange={(v) => setSlottermijnPct(v[0])}
            className="py-2"
          />
        </div>

        {/* Looptijd */}
        <div>
          <p className="text-[13px] font-body font-medium text-foreground mb-2.5">
            Looptijd
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {LOOPTIJDEN.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setLooptijd(m)}
                className={`h-10 text-[12px] font-body border transition-colors ${
                  looptijd === m
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/60"
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Overzicht */}
        <div className="border-t border-b border-border divide-y divide-border">
          {[
            { label: "Leenbedrag", value: prijs - aanbetalingBedrag - slottermijnBedrag },
            { label: "Totale rente", value: Math.max(0, maandbedrag * looptijd - (prijs - aanbetalingBedrag - slottermijnBedrag)) },
            { label: "Slottermijn", value: slottermijnBedrag },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center py-2.5">
              <span className="text-[13px] font-body text-muted-foreground">{row.label}</span>
              <span className="text-[14px] font-body font-medium text-foreground">
                {formatEuro(Math.round(row.value))}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[12px] font-body text-muted-foreground">
          Rente <span className="text-foreground/60">7,9% (vast)</span>
        </p>

        <a
          href={LEASE_DEFAULTS.partnerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-foreground text-background h-12 text-[11px] font-body font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Vrijblijvend aanvragen
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <p className="text-[10px] leading-relaxed text-muted-foreground/70">
          Indicatief bedrag. Onder voorbehoud van kredietgoedkeuring door
          financiallease.nl.
        </p>
      </PopoverContent>
    </Popover>
  );
};

export default LeaseCalculatorPopover;
