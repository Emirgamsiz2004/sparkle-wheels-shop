import { useEffect, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onChange: (from?: Date, to?: Date) => void;
}

const inputCls =
  "px-3 py-2 text-sm bg-[hsl(0_0%_10%)] border border-white/10 rounded-[10px] text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 transition w-[140px] cursor-pointer";

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>({ from, to });

  useEffect(() => {
    if (open) setDraft({ from, to });
  }, [open, from, to]);

  const fmt = (d?: Date) => (d ? format(d, "dd-MM-yyyy") : "");

  const apply = () => {
    onChange(draft?.from, draft?.to ? new Date(draft.to.getTime() + (23 * 3600 + 59 * 60 + 59) * 1000) : undefined);
    setOpen(false);
  };
  const cancel = () => {
    setDraft({ from, to });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1.5">
        <PopoverTrigger asChild>
          <button type="button" className={inputCls}>
            {fmt(from) || "Van"}
          </button>
        </PopoverTrigger>
        <span className="text-xs text-white/40">t/m</span>
        <PopoverTrigger asChild>
          <button type="button" className={inputCls}>
            {fmt(to) || "Tot"}
          </button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        align="start"
        sideOffset={8}
        className="p-0 border-0 bg-transparent shadow-none w-auto"
      >
        <div
          className="bg-[hsl(0_0%_8%)] border border-white/[0.08] p-4"
          style={{ borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
        >
          <DayPicker
            mode="range"
            selected={draft}
            onSelect={setDraft}
            numberOfMonths={1}
            locale={nl}
            weekStartsOn={1}
            showOutsideDays
            className="pointer-events-auto"
            components={{
              IconLeft: () => <ChevronLeft className="w-4 h-4" />,
              IconRight: () => <ChevronRight className="w-4 h-4" />,
            }}
            classNames={{
              months: "flex flex-col",
              month: "space-y-3",
              caption: "flex justify-center pt-1 pb-2 relative items-center",
              caption_label: "text-sm font-bold text-white capitalize",
              nav: "flex items-center",
              nav_button: cn(
                "h-8 w-8 inline-flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 transition",
              ),
              nav_button_previous: "absolute left-1 rounded-[10px]",
              nav_button_next: "absolute right-1 rounded-[10px]",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "text-white/40 w-9 h-8 font-medium text-[11px] uppercase tracking-wider flex items-center justify-center",
              row: "flex w-full mt-1",
              cell: cn(
                "relative h-9 w-9 text-center text-sm p-0 focus-within:relative focus-within:z-20",
                "[&:has([aria-selected])]:bg-[hsl(142_60%_45%/0.15)]",
                "first:[&:has([aria-selected])]:rounded-l-[10px] last:[&:has([aria-selected])]:rounded-r-[10px]",
                "[&:has(>.day-range-start)]:rounded-l-[10px] [&:has(>.day-range-end)]:rounded-r-[10px]",
                "[&:has(>.day-range-start)]:bg-transparent [&:has(>.day-range-end)]:bg-transparent",
              ),
              day: cn(
                "h-9 w-9 p-0 font-normal text-white/85 rounded-[10px] inline-flex items-center justify-center transition",
                "hover:bg-white/10 hover:text-white aria-selected:opacity-100",
              ),
              day_range_start: "day-range-start !bg-[hsl(142_70%_45%)] !text-white font-semibold rounded-[10px]",
              day_range_end: "day-range-end !bg-[hsl(142_70%_45%)] !text-white font-semibold rounded-[10px]",
              day_selected: "!bg-[hsl(142_70%_45%)] !text-white font-semibold rounded-[10px]",
              day_today: "ring-1 ring-white/20",
              day_outside: "text-white/20",
              day_disabled: "text-white/15",
              day_range_middle: "!bg-transparent !text-white rounded-none",
              day_hidden: "invisible",
            }}
          />

          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={cancel}
              className="flex-1 px-3 py-2 text-sm font-medium text-white/80 bg-transparent border border-white/10 rounded-[10px] hover:bg-white/5 transition"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!draft?.from || !draft?.to}
              className="flex-1 px-3 py-2 text-sm font-bold text-white bg-[hsl(142_70%_45%)] rounded-[10px] hover:bg-[hsl(142_70%_40%)] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Toepassen
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default DateRangePicker;
