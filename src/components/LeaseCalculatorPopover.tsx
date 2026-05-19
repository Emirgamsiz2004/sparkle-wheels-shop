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

  return (
    <Popover>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-[11px] font-body text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            <Calculator className="w-3 h-3" />
            Bereken zelf
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[340px] bg-card border border-border p-5 space-y-5"
      >
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
            Indicatie financial lease
          </p>
          <p className="font-display text-2xl font-bold text-foreground">
            {formatEuro(maandbedrag)}
            <span className="text-sm font-body font-normal text-muted-foreground ml-1">
              / maand
            </span>
          </p>
        </div>

        <div>
          <div className="flex justify-between items-center text-[11px] font-body mb-2">
            <span className="text-muted-foreground">Aanbetaling</span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{aanbetalingPct.toFixed(0)}%</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">€</span>
              <input
                type="number"
                min={0}
                max={prijs}
                value={aanbetalingBedrag}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(prijs, Number(e.target.value) || 0));
                  setAanbetalingPct((v / prijs) * 100);
                }}
                className="w-20 bg-transparent border-b border-border text-foreground font-medium text-right focus:outline-none focus:border-foreground"
              />
            </div>
          </div>
          <Slider
            value={[aanbetalingPct]}
            min={0}
            max={90}
            step={1}
            onValueChange={(v) => setAanbetalingPct(v[0])}
          />
        </div>

        <div>
          <div className="flex justify-between items-center text-[11px] font-body mb-2">
            <span className="text-muted-foreground">Slottermijn</span>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{slottermijnPct.toFixed(0)}%</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">€</span>
              <input
                type="number"
                min={0}
                max={prijs}
                value={slottermijnBedrag}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(prijs, Number(e.target.value) || 0));
                  setSlottermijnPct((v / prijs) * 100);
                }}
                className="w-20 bg-transparent border-b border-border text-foreground font-medium text-right focus:outline-none focus:border-foreground"
              />
            </div>
          </div>
          <Slider
            value={[slottermijnPct]}
            min={0}
            max={50}
            step={1}
            onValueChange={(v) => setSlottermijnPct(v[0])}
          />
        </div>

        <div>
          <p className="text-[11px] font-body text-muted-foreground mb-2">
            Looptijd
          </p>
          <div className="flex flex-wrap gap-1.5">
            {LOOPTIJDEN.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setLooptijd(m)}
                className={`px-2.5 py-1.5 text-[11px] font-body border transition-colors ${
                  looptijd === m
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {m} mnd
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-b border-border divide-y divide-border">
          {[
            { label: "Leenbedrag", value: prijs - aanbetalingBedrag - slottermijnBedrag },
            { label: "Totale rente", value: Math.max(0, maandbedrag * looptijd - (prijs - aanbetalingBedrag - slottermijnBedrag)) },
            { label: "Slottermijn", value: slottermijnBedrag },
          ].map((row) => (
            <div key={row.label} className="flex justify-between items-center py-2">
              <span className="text-[12px] font-body text-muted-foreground">{row.label}</span>
              <span className="text-[13px] font-body font-medium text-foreground">
                {formatEuro(Math.round(row.value))}
              </span>
            </div>
          ))}
        </div>

        <div>
          <p className="text-[11px] font-body text-muted-foreground">
            Rente <span className="text-foreground/40">7,9% (vast)</span>
          </p>
        </div>

        <a
          href={LEASE_DEFAULTS.partnerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-foreground text-background py-2.5 text-[10px] font-body font-semibold tracking-[0.15em] uppercase hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Vrijblijvend aanvragen
          <ExternalLink className="w-3 h-3" />
        </a>

        <p className="text-[9px] leading-relaxed text-muted-foreground/70">
          Indicatief bedrag. Onder voorbehoud van kredietgoedkeuring door
          financiallease.nl.
        </p>
      </PopoverContent>
    </Popover>
  );
};

export default LeaseCalculatorPopover;
