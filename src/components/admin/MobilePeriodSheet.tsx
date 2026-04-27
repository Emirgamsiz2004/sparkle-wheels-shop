import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, animate, type PanInfo } from "framer-motion";
import { ArrowLeft, ChevronRight, Check, ChevronLeft } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subMonths, subYears, subQuarters } from "date-fns";
import { nl } from "date-fns/locale";

export type PeriodType = "jaar" | "kwartaal" | "maand" | "custom";

export interface PeriodValue {
  periodType: PeriodType;
  year: number;
  quarter: number;
  month: number;
  customFrom?: Date;
  customTo?: Date;
}

interface Props {
  open: boolean;
  onClose: () => void;
  value: PeriodValue;
  onApply: (next: PeriodValue) => void;
  availableYears: number[];
}

type View =
  | "root"
  | "afgelopen"
  | "tot-nu"
  | "kwartalen"
  | "custom";

const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

function rangeToCustom(from: Date, to: Date, base: PeriodValue): PeriodValue {
  return { ...base, periodType: "custom", customFrom: startOfDay(from), customTo: endOfDay(to) };
}

const MobilePeriodSheet = ({ open, onClose, value, onApply, availableYears }: Props) => {
  const [view, setView] = useState<View>("root");
  const [viewDir, setViewDir] = useState(1);
  // Custom range draft
  const [draft, setDraft] = useState<DateRange | undefined>({ from: value.customFrom, to: value.customTo });
  const [calMonth, setCalMonth] = useState<Date>(value.customFrom || new Date());

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => { setView("root"); }, 320);
      return () => clearTimeout(t);
    }
    setDraft({ from: value.customFrom, to: value.customTo });
    setCalMonth(value.customFrom || new Date());
  }, [open, value.customFrom, value.customTo]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  // ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const goView = (v: View, dir: 1 | -1 = 1) => { setViewDir(dir); setView(v); };

  const sheetY = useMotionValue(0);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 80 || info.velocity.y > 500) {
      onClose();
    } else {
      // Snap back with same easing as the open animation
      animate(sheetY, 0, { duration: 0.32, ease: EASE });
    }
  };

  const apply = (next: PeriodValue) => { onApply(next); onClose(); };

  const now = new Date();

  // ===== option detection (which is currently selected) =====
  const isToday = value.periodType === "custom"
    && value.customFrom && value.customTo
    && format(value.customFrom, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
    && format(value.customTo, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
  const yest = subDays(now, 1);
  const isYesterday = value.periodType === "custom"
    && value.customFrom && value.customTo
    && format(value.customFrom, "yyyy-MM-dd") === format(yest, "yyyy-MM-dd")
    && format(value.customTo, "yyyy-MM-dd") === format(yest, "yyyy-MM-dd");

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  // ===== Row component =====
  const Row = ({ label, onClick, selected, hasArrow }: { label: string; onClick: () => void; selected?: boolean; hasArrow?: boolean }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 text-left text-white text-[15px] active:bg-white/[0.06] transition-colors"
      style={{ height: 56, borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <span className={selected ? "font-semibold" : ""}>{label}</span>
      {selected ? (
        <Check className="w-5 h-5 text-white/70" />
      ) : hasArrow ? (
        <ChevronRight className="w-4 h-4 text-white/40" />
      ) : null}
    </button>
  );

  // ===== Views =====
  const renderView = () => {
    if (view === "root") {
      return (
        <>
          <Header title="Periode selecteren" />
          <Row label="Vandaag" selected={!!isToday} onClick={() => apply(rangeToCustom(now, now, value))} />
          <Row label="Gisteren" selected={!!isYesterday} onClick={() => apply(rangeToCustom(yest, yest, value))} />
          <Row label="Afgelopen" hasArrow onClick={() => goView("afgelopen", 1)} />
          <Row label="Periode tot nu" hasArrow onClick={() => goView("tot-nu", 1)} />
          <Row label="Kwartalen" hasArrow selected={value.periodType === "kwartaal"} onClick={() => goView("kwartalen", 1)} />
          <Row label="Aangepast bereik" hasArrow selected={value.periodType === "custom" && !isToday && !isYesterday} onClick={() => goView("custom", 1)} />
          <div style={{ padding: "16px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)" }}>
            <button
              onClick={onClose}
              className="w-full h-11 text-sm font-medium text-white border border-white/15 rounded-[10px] active:bg-white/[0.06] transition-colors"
              style={{ background: "transparent" }}
            >
              Sluiten
            </button>
          </div>
        </>
      );
    }

    if (view === "afgelopen") {
      const opts = [
        { label: "Afgelopen 7 dagen", from: subDays(now, 6), to: now },
        { label: "Afgelopen 30 dagen", from: subDays(now, 29), to: now },
        { label: "Afgelopen maand", from: startOfMonth(subMonths(now, 1)), to: endOfMonth(subMonths(now, 1)) },
        { label: "Afgelopen kwartaal", from: startOfQuarter(subQuarters(now, 1)), to: endOfQuarter(subQuarters(now, 1)) },
        { label: "Afgelopen jaar", from: startOfYear(subYears(now, 1)), to: endOfYear(subYears(now, 1)) },
      ];
      return (
        <>
          <Header title="Afgelopen" onBack={() => goView("root", -1)} />
          {opts.map((o) => (
            <Row key={o.label} label={o.label} onClick={() => apply(rangeToCustom(o.from, o.to, value))} />
          ))}
        </>
      );
    }

    if (view === "tot-nu") {
      const opts = [
        { label: "Deze week tot nu", from: subDays(now, now.getDay() === 0 ? 6 : now.getDay() - 1), to: now },
        { label: "Deze maand tot nu", from: startOfMonth(now), to: now },
        { label: "Dit kwartaal tot nu", from: startOfQuarter(now), to: now },
        { label: "Dit jaar tot nu", from: startOfYear(now), to: now },
      ];
      return (
        <>
          <Header title="Periode tot nu" onBack={() => goView("root", -1)} />
          {opts.map((o) => (
            <Row key={o.label} label={o.label} onClick={() => apply(rangeToCustom(o.from, o.to, value))} />
          ))}
        </>
      );
    }

    if (view === "kwartalen") {
      const [selYear, setSelYearLocal] = [value.year, (y: number) => onApply({ ...value, year: y })];
      return (
        <>
          <Header title="Kwartalen" onBack={() => goView("root", -1)} />
          <div className="px-5 py-3 flex items-center gap-2 overflow-x-auto" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {availableYears.map((y) => (
              <button
                key={y}
                onClick={() => onApply({ ...value, year: y })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-[10px] shrink-0 transition ${y === value.year ? "bg-white text-black" : "bg-white/[0.06] text-white/70"}`}
              >
                {y}
              </button>
            ))}
          </div>
          {[1, 2, 3, 4].map((q) => (
            <Row
              key={q}
              label={`Q${q} ${value.year}`}
              selected={value.periodType === "kwartaal" && value.quarter === q}
              onClick={() => apply({ ...value, periodType: "kwartaal", quarter: q })}
            />
          ))}
        </>
      );
    }

    if (view === "custom") {
      return (
        <>
          <Header title="Aangepast bereik" onBack={() => goView("root", -1)} />
          <div className="px-3 pt-3 pb-2 flex items-center justify-between">
            <button
              onClick={() => setCalMonth(subMonths(calMonth, 1))}
              className="w-9 h-9 inline-flex items-center justify-center text-white/70 hover:text-white rounded-[10px]"
            ><ChevronLeft className="w-5 h-5" /></button>
            <div className="text-[15px] font-bold text-white capitalize">
              {format(calMonth, "LLLL yyyy", { locale: nl })}
            </div>
            <button
              onClick={() => setCalMonth(subMonths(calMonth, -1))}
              className="w-9 h-9 inline-flex items-center justify-center text-white/70 hover:text-white rounded-[10px]"
            ><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="px-3 pb-2">
            <DayPicker
              mode="range"
              selected={draft}
              onSelect={setDraft}
              month={calMonth}
              onMonthChange={setCalMonth}
              numberOfMonths={1}
              locale={nl}
              weekStartsOn={1}
              showOutsideDays
              disableNavigation
              className="pointer-events-auto w-full"
              classNames={{
                months: "flex flex-col w-full",
                month: "space-y-2 w-full",
                caption: "hidden",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-white/40 flex-1 h-8 font-medium text-[11px] uppercase tracking-wider flex items-center justify-center",
                row: "flex w-full mt-1",
                cell: "relative flex-1 aspect-square text-center text-sm p-0 [&:has([aria-selected])]:bg-white/[0.08] first:[&:has([aria-selected])]:rounded-l-[10px] last:[&:has([aria-selected])]:rounded-r-[10px]",
                day: "w-full h-full font-normal text-white/85 rounded-[10px] inline-flex items-center justify-center transition hover:bg-white/10",
                day_range_start: "!bg-white !text-black font-semibold rounded-[10px]",
                day_range_end: "!bg-white !text-black font-semibold rounded-[10px]",
                day_selected: "!bg-white !text-black font-semibold rounded-[10px]",
                day_today: "ring-1 ring-white/20",
                day_outside: "text-white/20",
                day_range_middle: "!bg-transparent !text-white rounded-none",
                day_hidden: "invisible",
              }}
            />
          </div>
          <div className="flex items-center gap-2 px-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
            <button
              onClick={onClose}
              className="flex-1 h-11 text-sm font-medium text-white/80 bg-transparent border border-white/10 rounded-[10px] active:bg-white/5"
            >Annuleren</button>
            <button
              disabled={!draft?.from || !draft?.to}
              onClick={() => draft?.from && draft?.to && apply(rangeToCustom(draft.from, draft.to, value))}
              className="flex-1 h-11 text-sm font-medium text-white border border-white/15 rounded-[10px] active:bg-white/[0.06] disabled:opacity-40 transition-colors"
              style={{ background: "transparent" }}
            >Toepassen</button>
          </div>
        </>
      );
    }
    return null;
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(0,0,0,0.5)" }}
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.32, ease: EASE }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="fixed left-0 right-0 bottom-0 z-[101] flex flex-col"
            style={{
              y: sheetY,
              background: "hsl(0 0% 8%)",
              borderRadius: "20px 20px 0 0",
              maxHeight: "75vh",
              height: "auto",
              boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
              willChange: "transform",
            }}
          >
            <div className="flex justify-center pt-3 pb-3 shrink-0">
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
            </div>
            <div className="overflow-y-auto overflow-x-hidden">
              <AnimatePresence mode="wait" custom={viewDir} initial={false}>
                <motion.div
                  key={view}
                  custom={viewDir}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

const Header = ({ title, onBack }: { title: string; onBack?: () => void }) => (
  <div className="relative flex items-center justify-center px-5 pb-3 pt-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
    {onBack && (
      <button onClick={onBack} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-white/70">
        <ArrowLeft className="w-5 h-5" />
      </button>
    )}
    <span className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white">{title}</span>
  </div>
);

export default MobilePeriodSheet;
