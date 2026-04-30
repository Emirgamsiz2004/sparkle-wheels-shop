import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface SearchOption {
  id: string;
  label: string;
  sublabel?: string;
  meta?: string;
  warning?: string;
  searchText: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  anchorRect?: DOMRect | null;
  title: string;
  placeholder?: string;
  options: SearchOption[];
  emptyMessage?: string;
  onSelect: (id: string) => void | Promise<void>;
  loading?: boolean;
}

const SearchSelectPopover = ({
  open,
  onOpenChange,
  anchorRect,
  title,
  placeholder = "Zoeken...",
  options,
  emptyMessage = "Geen resultaten",
  onSelect,
  loading,
}: Props) => {
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => onOpenChange(false), isMobile ? 280 : 160);
  };

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      setQ("");
      setBusy(false);
      requestAnimationFrame(() => {
        setAnimateIn(true);
        if (!isMobile) inputRef.current?.focus();
      });
    } else {
      setAnimateIn(false);
      const t = window.setTimeout(() => setMounted(false), isMobile ? 280 : 160);
      return () => clearTimeout(t);
    }
  }, [open, isMobile]);

  useEffect(() => {
    if (!open || closing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handleClose();
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, closing]);

  useLayoutEffect(() => {
    if (!open || isMobile || !anchorRect) { setPos(null); return; }
    const W = 380;
    const H_MAX = 480;
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Lijn standaard links uit met de anchor zodat de popover direct onder de knop verschijnt
    let left = anchorRect.left;
    // Als hij rechts buiten beeld valt, schuif naar binnen
    if (left + W > vw - margin) left = vw - W - margin;
    if (left < margin) left = margin;

    const spaceBelow = vh - anchorRect.bottom - margin;
    const spaceAbove = anchorRect.top - margin;
    let top: number;
    if (spaceBelow >= 240 || spaceBelow >= spaceAbove) {
      // plaats onder, maar clamp binnen viewport
      top = anchorRect.bottom + 6;
      const maxTop = vh - margin - Math.min(H_MAX, spaceBelow);
      if (top > maxTop) top = Math.max(margin, maxTop);
    } else {
      // flip naar boven
      const h = Math.min(H_MAX, spaceAbove);
      top = anchorRect.top - 6 - h;
      if (top < margin) top = margin;
    }
    setPos({ top, left });
  }, [open, isMobile, anchorRect]);

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const s = q.toLowerCase();
    return options.filter((o) => o.searchText.toLowerCase().includes(s));
  }, [options, q]);

  const handlePick = async (id: string) => {
    setBusy(true);
    try {
      await onSelect(id);
      handleClose();
    } finally {
      setBusy(false);
    }
  };

  if (!mounted) return null;

  // Desktop: geen donkere overlay (alleen mobiel krijgt een dim achter de bottom sheet)
  const overlayStyle: React.CSSProperties = isMobile
    ? {
        opacity: closing ? 0 : 0.4,
        transition: `opacity ${closing ? 200 : 240}ms ${closing ? "ease-in" : "ease-out"}`,
        backgroundColor: "#000",
      }
    : {
        // volledig transparant — dient enkel als click-outside vangnet
        backgroundColor: "transparent",
        pointerEvents: "none",
      };

  const desktopStyle: React.CSSProperties = {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    background: "hsl(0 0% 8%)",
    opacity: closing ? 0 : animateIn ? 1 : 0,
    transform: closing
      ? "translateY(-6px) scale(0.98)"
      : animateIn
        ? "translateY(0) scale(1)"
        : "translateY(-6px) scale(0.98)",
    transformOrigin: "top left",
    transition: closing
      ? "opacity 140ms ease-in, transform 140ms ease-in"
      : "opacity 200ms ease-out, transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
    ...(pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 }),
  };

  const mobileStyle: React.CSSProperties = {
    borderRadius: "20px 20px 0 0",
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
    background: "hsl(0 0% 8%)",
    transform: closing ? "translateY(100%)" : animateIn ? "translateY(0)" : "translateY(100%)",
    transition: closing ? "transform 280ms ease-in" : "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)",
  };

  const containerClass = isMobile
    ? "fixed left-0 right-0 bottom-0 z-50 max-h-[85vh] flex flex-col"
    : "fixed z-50 w-[380px] max-h-[480px] flex flex-col";

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" style={overlayStyle} aria-hidden onClick={isMobile ? handleClose : undefined} />
      <div ref={ref} className={containerClass} style={isMobile ? mobileStyle : desktopStyle} role="dialog">
        {isMobile && (
          <div className="pt-2 pb-1 flex justify-center shrink-0">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
        )}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground hover:bg-accent/40 transition-colors"
          aria-label="Sluiten"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="px-[18px] pt-[18px] pb-3 shrink-0">
          <h3 className="text-sm font-medium text-foreground mb-3">{title}</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-8 pr-3 py-2.5 text-sm bg-background border border-border/60 rounded-[10px] focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {loading ? (
            <p className="text-center text-xs text-muted-foreground py-8">Laden...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8">{emptyMessage}</p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((o) => (
                <button
                  key={o.id}
                  disabled={busy}
                  onClick={() => handlePick(o.id)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left rounded-[10px] hover:bg-accent/40 transition-colors disabled:opacity-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{o.label}</p>
                    {o.sublabel && <p className="text-[11px] text-muted-foreground truncate">{o.sublabel}</p>}
                    {o.warning && <p className="text-[11px] text-amber-400 truncate mt-0.5">⚠ {o.warning}</p>}
                  </div>
                  {o.meta && <span className="text-[11px] text-muted-foreground whitespace-nowrap">{o.meta}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default SearchSelectPopover;
