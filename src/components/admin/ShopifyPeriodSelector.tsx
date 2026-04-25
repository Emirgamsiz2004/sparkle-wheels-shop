import { useEffect, useMemo, useState } from "react";
import {
  startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, endOfMonth,
  startOfQuarter, startOfYear, addMonths, isSameDay, format, parse, isValid,
} from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronRight, ChevronLeft, ArrowLeft, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export interface PeriodRange {
  from: Date;
  to: Date;
  label: string;
}

interface Props {
  value: PeriodRange;
  onChange: (range: PeriodRange) => void;
}

type PresetId =
  | "vandaag" | "gisteren"
  | "last7" | "last30" | "last90" | "last365"
  | "wtd" | "mtd" | "qtd" | "ytd"
  | "q" | "custom";

const labelFor = (from: Date, to: Date): string => {
  const today = startOfDay(new Date());
  if (isSameDay(from, to) && isSameDay(from, today)) return "Vandaag";
  if (isSameDay(from, to) && isSameDay(from, subDays(today, 1))) return "Gisteren";
  return `${format(from, "d MMM yyyy", { locale: nl })} – ${format(to, "d MMM yyyy", { locale: nl })}`;
};

const buildPreset = (id: PresetId, payload?: { qIdx?: number; year?: number }): PeriodRange => {
  const now = new Date();
  const today = startOfDay(now);
  switch (id) {
    case "vandaag": return { from: today, to: endOfDay(now), label: "Vandaag" };
    case "gisteren": {
      const y = subDays(today, 1);
      return { from: y, to: endOfDay(y), label: "Gisteren" };
    }
    case "last7": return { from: startOfDay(subDays(today, 6)), to: endOfDay(now), label: "Afgelopen 7 dagen" };
    case "last30": return { from: startOfDay(subDays(today, 29)), to: endOfDay(now), label: "Afgelopen 30 dagen" };
    case "last90": return { from: startOfDay(subDays(today, 89)), to: endOfDay(now), label: "Afgelopen 90 dagen" };
    case "last365": return { from: startOfDay(subDays(today, 364)), to: endOfDay(now), label: "Afgelopen 365 dagen" };
    case "wtd": return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfDay(now), label: "Week tot nu" };
    case "mtd": return { from: startOfMonth(today), to: endOfDay(now), label: "Maand tot nu" };
    case "qtd": return { from: startOfQuarter(today), to: endOfDay(now), label: "Kwartaal tot nu" };
    case "ytd": return { from: startOfYear(today), to: endOfDay(now), label: "Jaar tot nu" };
    case "q": {
      const qIdx = payload?.qIdx ?? 0;
      const year = payload?.year ?? now.getFullYear();
      const startMonth = qIdx * 3;
      const from = startOfMonth(new Date(year, startMonth, 1));
      const to = endOfMonth(new Date(year, startMonth + 2, 1));
      return { from, to: to > now ? endOfDay(now) : to, label: `Q${qIdx + 1} ${year}` };
    }
    default: return { from: today, to: endOfDay(now), label: "Vandaag" };
  }
};

const lastFiveQuarters = (): { qIdx: number; year: number; label: string }[] => {
  const now = new Date();
  const curQ = Math.floor(now.getMonth() / 3);
  const curY = now.getFullYear();
  const list: { qIdx: number; year: number; label: string }[] = [];
  for (let i = 0; i < 5; i++) {
    let q = curQ - i;
    let y = curY;
    while (q < 0) { q += 4; y -= 1; }
    list.push({ qIdx: q, year: y, label: `Q${q + 1} ${y}` });
  }
  return list;
};

type SubmenuId = null | "afgelopen" | "totnu" | "kwartalen";

export default function ShopifyPeriodSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [submenu, setSubmenu] = useState<SubmenuId>(null);
  const [draft, setDraft] = useState<DateRange | undefined>({ from: value.from, to: value.to });
  const [draftLabel, setDraftLabel] = useState<string>(value.label);
  const [activePreset, setActivePreset] = useState<string>("custom");
  const [calMonth, setCalMonth] = useState<Date>(value.from);
  const [fromText, setFromText] = useState(format(value.from, "dd-MM-yyyy"));
  const [toText, setToText] = useState(format(value.to, "dd-MM-yyyy"));

  // Sync draft on open
  useEffect(() => {
    if (open) {
      setDraft({ from: value.from, to: value.to });
      setDraftLabel(value.label);
      setSubmenu(null);
      setCalMonth(value.from);
      setFromText(format(value.from, "dd-MM-yyyy"));
      setToText(format(value.to, "dd-MM-yyyy"));
      setActivePreset("custom");
    }
  }, [open, value]);

  const applyPreset = (id: string, range: PeriodRange) => {
    setActivePreset(id);
    setDraft({ from: range.from, to: range.to });
    setDraftLabel(range.label);
    setCalMonth(range.from);
    setFromText(format(range.from, "dd-MM-yyyy"));
    setToText(format(range.to, "dd-MM-yyyy"));
  };

  const handleApply = () => {
    if (draft?.from && draft?.to) {
      const from = startOfDay(draft.from);
      const to = endOfDay(draft.to);
      onChange({ from, to, label: activePreset === "custom" ? labelFor(from, to) : draftLabel });
    }
    setOpen(false);
  };

  const handleCancel = () => setOpen(false);

  const onCalendarSelect = (r: DateRange | undefined) => {
    setDraft(r);
    setActivePreset("custom");
    if (r?.from) setFromText(format(r.from, "dd-MM-yyyy"));
    if (r?.to) setToText(format(r.to, "dd-MM-yyyy"));
    if (r?.from && r?.to) {
      setDraftLabel(labelFor(startOfDay(r.from), endOfDay(r.to)));
    }
  };

  const parseTextDate = (s: string): Date | null => {
    const d = parse(s, "dd-MM-yyyy", new Date());
    return isValid(d) ? d : null;
  };

  const commitFromText = () => {
    const d = parseTextDate(fromText);
    if (d) {
      const newRange: DateRange = { from: d, to: draft?.to && draft.to >= d ? draft.to : d };
      onCalendarSelect(newRange);
      setCalMonth(d);
    }
  };
  const commitToText = () => {
    const d = parseTextDate(toText);
    if (d) {
      const newRange: DateRange = { from: draft?.from && draft.from <= d ? draft.from : d, to: d };
      onCalendarSelect(newRange);
    }
  };

  const quarters = useMemo(lastFiveQuarters, []);
  const triggerLabel = value.label;

  const MenuItem = ({
    label, onClick, hasSub, active,
  }: { label: string; onClick: () => void; hasSub?: boolean; active?: boolean }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[13px] transition-colors text-left",
        active ? "bg-white/[0.08] text-white" : "text-foreground/80 hover:bg-white/[0.04] hover:text-foreground",
      )}
    >
      <span>{label}</span>
      {hasSub && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 px-3 gap-2 text-[13px] font-medium border-border bg-card hover:bg-accent text-foreground"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="p-0 bg-card border-border text-foreground shadow-2xl w-[720px] max-w-[95vw] overflow-hidden"
        style={{ borderRadius: 14 }}
      >
        <div className="flex flex-col md:flex-row">
          {/* Left column — menu */}
          <div className="w-full md:w-[220px] border-b md:border-b-0 md:border-r border-border p-2 bg-card">
            {submenu === null && (
              <div className="flex flex-col gap-0.5">
                <MenuItem label="Vandaag" active={activePreset === "vandaag"}
                  onClick={() => applyPreset("vandaag", buildPreset("vandaag"))} />
                <MenuItem label="Gisteren" active={activePreset === "gisteren"}
                  onClick={() => applyPreset("gisteren", buildPreset("gisteren"))} />
                <MenuItem label="Afgelopen" hasSub onClick={() => setSubmenu("afgelopen")} />
                <MenuItem label="Periode tot nu" hasSub onClick={() => setSubmenu("totnu")} />
                <MenuItem label="Kwartalen" hasSub onClick={() => setSubmenu("kwartalen")} />
                <MenuItem label="Aangepast bereik" active={activePreset === "custom"}
                  onClick={() => setActivePreset("custom")} />
              </div>
            )}
            {submenu !== null && (
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => setSubmenu(null)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-[12px] text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Terug
                </button>
                <div className="h-px bg-border my-1" />
                {submenu === "afgelopen" && (
                  <>
                    <MenuItem label="Afgelopen 7 dagen" active={activePreset === "last7"}
                      onClick={() => applyPreset("last7", buildPreset("last7"))} />
                    <MenuItem label="Afgelopen 30 dagen" active={activePreset === "last30"}
                      onClick={() => applyPreset("last30", buildPreset("last30"))} />
                    <MenuItem label="Afgelopen 90 dagen" active={activePreset === "last90"}
                      onClick={() => applyPreset("last90", buildPreset("last90"))} />
                    <MenuItem label="Afgelopen 365 dagen" active={activePreset === "last365"}
                      onClick={() => applyPreset("last365", buildPreset("last365"))} />
                  </>
                )}
                {submenu === "totnu" && (
                  <>
                    <MenuItem label="Week tot nu" active={activePreset === "wtd"}
                      onClick={() => applyPreset("wtd", buildPreset("wtd"))} />
                    <MenuItem label="Maand tot nu" active={activePreset === "mtd"}
                      onClick={() => applyPreset("mtd", buildPreset("mtd"))} />
                    <MenuItem label="Kwartaal tot nu" active={activePreset === "qtd"}
                      onClick={() => applyPreset("qtd", buildPreset("qtd"))} />
                    <MenuItem label="Jaar tot nu" active={activePreset === "ytd"}
                      onClick={() => applyPreset("ytd", buildPreset("ytd"))} />
                  </>
                )}
                {submenu === "kwartalen" && (
                  <>
                    {quarters.map((q) => {
                      const id = `q-${q.year}-${q.qIdx}`;
                      return (
                        <MenuItem
                          key={id}
                          label={q.label}
                          active={activePreset === id}
                          onClick={() => applyPreset(id, buildPreset("q", { qIdx: q.qIdx, year: q.year }))}
                        />
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right column — calendar */}
          <div className="flex-1 p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Van</label>
                <Input
                  value={fromText}
                  onChange={(e) => setFromText(e.target.value)}
                  onBlur={commitFromText}
                  onKeyDown={(e) => { if (e.key === "Enter") commitFromText(); }}
                  placeholder="dd-mm-jjjj"
                  className="h-8 text-[12px] bg-background border-border"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Tot</label>
                <Input
                  value={toText}
                  onChange={(e) => setToText(e.target.value)}
                  onBlur={commitToText}
                  onKeyDown={(e) => { if (e.key === "Enter") commitToText(); }}
                  placeholder="dd-mm-jjjj"
                  className="h-8 text-[12px] bg-background border-border"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-1">
              <button
                type="button"
                onClick={() => setCalMonth(addMonths(calMonth, -1))}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-[12px] font-medium text-foreground" />
              <button
                type="button"
                onClick={() => setCalMonth(addMonths(calMonth, 1))}
                className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <Calendar
              mode="range"
              selected={draft}
              onSelect={onCalendarSelect}
              numberOfMonths={2}
              month={calMonth}
              onMonthChange={setCalMonth}
              locale={nl}
              weekStartsOn={1}
              disabled={(date) => date > new Date()}
              className={cn("p-0 pointer-events-auto")}
              classNames={{
                months: "flex flex-row gap-4",
                caption: "flex justify-center pt-1 pb-2 relative items-center text-[12px] font-medium text-foreground",
                caption_label: "text-[12px] font-medium text-foreground",
                nav: "hidden",
                head_cell: "text-muted-foreground/70 rounded-md w-9 font-normal text-[0.7rem] uppercase",
                cell: "h-9 w-9 text-center text-sm p-0 relative bg-transparent [&:has([aria-selected])]:bg-white/[0.10] [&:has([aria-selected].day-range-start)]:rounded-l-full [&:has([aria-selected].day-range-end)]:rounded-r-full [&:has([aria-selected].day-outside)]:bg-transparent first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal text-white bg-transparent hover:bg-white/[0.06] hover:text-white rounded-[8px] transition-colors aria-selected:opacity-100",
                day_selected:
                  "!bg-white/[0.25] !text-white hover:!bg-white/[0.30] focus:!bg-white/[0.25] rounded-full",
                day_range_start:
                  "day-range-start !bg-white/[0.25] !text-white rounded-full hover:!bg-white/[0.30]",
                day_range_end:
                  "day-range-end !bg-white/[0.25] !text-white rounded-full hover:!bg-white/[0.30]",
                day_range_middle:
                  "!bg-transparent !text-white !rounded-none hover:!bg-white/[0.06]",
                day_today: "text-white font-semibold underline underline-offset-4",
                day_outside: "text-muted-foreground/40 opacity-100",
                day_disabled: "text-muted-foreground/30 opacity-50 hover:bg-transparent",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-3 border-t border-border bg-card">
          <Button variant="ghost" size="sm" onClick={handleCancel}>Annuleren</Button>
          <Button size="sm" onClick={handleApply} className="bg-green-600 hover:bg-green-700 text-white">
            Toepassen
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
