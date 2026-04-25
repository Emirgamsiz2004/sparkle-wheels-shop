import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Eye, Car, Truck, PackageCheck, Wrench, MoreHorizontal, X } from "lucide-react";
import { AppointmentType } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  anchorRect: DOMRect | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: AppointmentType) => void;
}

const options: { value: AppointmentType; label: string; icon: typeof Eye }[] = [
  { value: "bezichtiging", label: "Bezichtiging", icon: Eye },
  { value: "proefrit", label: "Proefrit", icon: Car },
  { value: "ophalen", label: "Ophalen", icon: Truck },
  { value: "aflevering", label: "Aflevering", icon: PackageCheck },
  { value: "onderhoud", label: "Onderhoud / reparatie", icon: Wrench },
  { value: "anders", label: "Anders", icon: MoreHorizontal },
];

const AppointmentTypePicker = ({ open, anchorRect, onOpenChange, onSelect }: Props) => {
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // ESC + outside click
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onOpenChange(false); };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, onOpenChange]);

  useLayoutEffect(() => {
    if (!open || isMobile || !anchorRect) { setPos(null); return; }
    const W = 280;
    const margin = 8;
    const vw = window.innerWidth;
    let left = anchorRect.right - W;
    if (left < margin) left = margin;
    if (left + W > vw - margin) left = vw - W - margin;
    const top = anchorRect.bottom + 6;
    setPos({ top, left });
  }, [open, isMobile, anchorRect]);

  if (!open) return null;

  const containerClass = isMobile
    ? "fixed left-0 right-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-[16px] border-t border-x border-border/60 bg-card shadow-2xl animate-in slide-in-from-bottom duration-200"
    : "fixed z-50 w-[280px] rounded-[14px] border border-border/60 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.35)] animate-in fade-in-0 zoom-in-95 duration-150";

  const containerStyle: React.CSSProperties = isMobile
    ? { paddingBottom: "env(safe-area-inset-bottom, 0px)" }
    : pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 };

  return createPortal(
    <div ref={ref} className={containerClass} style={containerStyle} role="dialog" aria-label="Type afspraak">
      {isMobile && (
        <div className="pt-2 pb-1 flex justify-center">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>
      )}
      <div className={cn("p-2", isMobile && "p-3 pb-4")}>
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Type afspraak</span>
          {isMobile && (
            <button
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/40"
              aria-label="Sluiten"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <ul className="flex flex-col">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                onClick={() => { onSelect(opt.value); onOpenChange(false); }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-[8px] text-left text-foreground hover:bg-accent/40 transition-colors",
                  isMobile ? "px-3 py-3 text-sm" : "px-2.5 py-2 text-sm"
                )}
              >
                <opt.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{opt.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
};

export default AppointmentTypePicker;
