import { useState, useMemo } from "react";
import { Calculator, ExternalLink, X, Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  berekenLeaseDetail,
  formatEuro,
  LEASE_DEFAULTS,
  LOOPTIJDEN,
  MAX_AANBETALING_PCT,
  MAX_SLOTTERMIJN_PCT,
  type LeaseMode,
} from "@/lib/lease";

interface Props {
  prijs: number;
  trigger?: React.ReactNode;
}

const LeaseCalculatorPopover = ({ prijs, trigger }: Props) => {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState<LeaseMode>("financial");
  const [aanbetalingPct, setAanbetalingPct] = useState<number>(
    LEASE_DEFAULTS.aanbetalingPct * 100
  );
  const [slottermijnPct, setSlottermijnPct] = useState<number>(
    LEASE_DEFAULTS.slottermijnPct * 100
  );
  const [looptijd, setLooptijd] = useState<number>(LEASE_DEFAULTS.looptijd);

  // Cap slottermijn dynamisch zodat aanbetaling + slottermijn nooit > 95% wordt
  const maxSlot = Math.min(MAX_SLOTTERMIJN_PCT, Math.max(0, 95 - aanbetalingPct));
  const effSlot = Math.min(slottermijnPct, maxSlot);

  const result = useMemo(
    () =>
      berekenLeaseDetail({
        prijs,
        aanbetalingPct: aanbetalingPct / 100,
        slottermijnPct: effSlot / 100,
        looptijd,
        mode,
      }),
    [prijs, aanbetalingPct, effSlot, looptijd, mode]
  );

  const handleBedragChange = (
    raw: string,
    setter: (pct: number) => void,
    maxPct: number
  ) => {
    const digits = raw.replace(/[^\d]/g, "");
    const v = Math.max(0, Math.min(prijs, Number(digits) || 0));
    const pct = prijs > 0 ? (v / prijs) * 100 : 0;
    setter(Math.min(pct, maxPct));
  };

  const triggerNode = trigger ?? (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 text-[13px] font-body font-medium text-foreground/80 hover:text-foreground underline underline-offset-4 transition-colors"
    >
      <Calculator className="w-3.5 h-3.5" />
      Bereken zelf je leasetermijn
    </button>
  );

  const tarief = mode === "halal" ? LEASE_DEFAULTS.halalVergoeding : LEASE_DEFAULTS.rente;
  const tariefLabel = mode === "halal" ? "Kredietvergoeding" : "Rente";
  const kostenLabel = mode === "halal" ? "Totale kredietvergoeding" : "Totale rente";

  const body = (
    <div className="space-y-6">
      {/* Mode switch */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-background border border-border">
        {(["financial", "halal"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`h-9 text-[11px] font-body font-semibold tracking-[0.12em] uppercase transition-colors ${
              mode === m
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "financial" ? "Financial" : "Halal"} Lease
          </button>
        ))}
      </div>

      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
          Indicatie {mode === "halal" ? "halal lease" : "financial lease"}
        </p>
        <p className="font-display text-3xl font-bold text-foreground">
          {formatEuro(result.maandbedrag)}
          <span className="text-base font-body font-normal text-muted-foreground ml-1.5">
            / maand
          </span>
        </p>
      </div>

      {/* Aanbetaling */}
      <div>
        <div className="flex justify-between items-center mb-3 gap-2">
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
              value={result.aanbetaling.toLocaleString("nl-NL")}
              onChange={(e) => handleBedragChange(e.target.value, setAanbetalingPct, MAX_AANBETALING_PCT)}
              className="w-24 bg-transparent text-foreground font-medium text-right text-base focus:outline-none"
            />
          </div>
        </div>
        <Slider
          value={[aanbetalingPct]}
          min={0}
          max={MAX_AANBETALING_PCT}
          step={1}
          onValueChange={(v) => setAanbetalingPct(v[0])}
          className="py-2"
        />
      </div>

      {/* Slottermijn */}
      <div>
        <div className="flex justify-between items-center mb-3 gap-2">
          <label className="text-[13px] font-body font-medium text-foreground">
            Slottermijn
            <span className="ml-2 text-[12px] text-muted-foreground font-normal">
              {effSlot.toFixed(0)}%
            </span>
          </label>
          <div className="flex items-center bg-background border border-border focus-within:border-foreground transition-colors h-10 px-3">
            <span className="text-muted-foreground text-base mr-1">€</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={result.slottermijn.toLocaleString("nl-NL")}
              onChange={(e) => handleBedragChange(e.target.value, setSlottermijnPct, maxSlot)}
              className="w-24 bg-transparent text-foreground font-medium text-right text-base focus:outline-none"
            />
          </div>
        </div>
        <Slider
          value={[effSlot]}
          min={0}
          max={maxSlot}
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
        <div className="grid grid-cols-6 gap-1.5">
          {LOOPTIJDEN.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setLooptijd(m)}
              className={`h-10 text-[11px] font-body border transition-colors ${
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
          { label: "Leenbedrag", value: result.leasebedrag },
          { label: kostenLabel, value: result.totaalKosten },
          { label: "Slottermijn", value: result.slottermijn },
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
        {tariefLabel} <span className="text-foreground/60">{(tarief * 100).toFixed(1).replace(".", ",")}% (vast)</span>
      </p>

      {mode === "halal" && (
        <div className="flex gap-2 p-3 bg-background border border-border">
          <Info className="w-3.5 h-3.5 text-foreground/60 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Bij <span className="text-foreground font-medium">halal lease</span> betaal je geen
            rente, maar een vooraf vastgestelde <span className="text-foreground font-medium">
            kredietvergoeding</span> (murabaha-principe). Het totaalbedrag staat vast en wijzigt niet.
          </p>
        </div>
      )}

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
        Indicatief bedrag. Onder voorbehoud van kredietgoedkeuring.{" "}
        {mode === "financial"
          ? "Lease via financiallease.nl."
          : "Halal lease via een sharia-conforme partner."}
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{triggerNode}</DrawerTrigger>
        <DrawerContent className="bg-card border-border max-h-[92vh]">
          <div className="relative overflow-y-auto overscroll-contain px-5 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">
            <DrawerClose asChild>
              <button
                type="button"
                aria-label="Sluiten"
                className="absolute right-3 top-3 z-10 p-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </DrawerClose>
            {body}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{triggerNode}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className="w-[380px] max-h-[85vh] overflow-y-auto bg-card border border-border p-6"
      >
        {body}
      </PopoverContent>
    </Popover>
  );
};

export default LeaseCalculatorPopover;
