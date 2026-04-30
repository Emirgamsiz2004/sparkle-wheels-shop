import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  anchorRect?: DOMRect | null;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

const ConfirmPopover = ({
  open,
  onOpenChange,
  anchorRect,
  title,
  message,
  confirmLabel = "Bevestigen",
  cancelLabel = "Annuleren",
  destructive = false,
  onConfirm,
}: Props) => {
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
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
      setBusy(false);
      requestAnimationFrame(() => setAnimateIn(true));
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
    const W = 320;
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = anchorRect.right - W;
    if (left < margin) left = margin;
    if (left + W > vw - margin) left = vw - W - margin;
    let top = anchorRect.bottom + 6;
    if (top + 200 > vh - margin) top = Math.max(margin, anchorRect.top - 200);
    setPos({ top, left });
  }, [open, isMobile, anchorRect]);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      handleClose();
    } finally {
      setBusy(false);
    }
  };

  if (!mounted) return null;

  const overlayStyle: React.CSSProperties = {
    opacity: closing ? 0 : 0.4,
    transition: `opacity ${closing ? 160 : 200}ms ${closing ? "ease-in" : "ease-out"}`,
    backgroundColor: "#000",
    willChange: "opacity",
  };

  const desktopStyle: React.CSSProperties = {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    background: "hsl(0 0% 8%)",
    opacity: closing ? 0 : animateIn ? 1 : 0,
    transform: closing ? "translateY(-8px)" : animateIn ? "translateY(0)" : "translateY(-8px)",
    transition: closing
      ? "opacity 160ms ease-in, transform 160ms ease-in"
      : "opacity 220ms ease-out, transform 220ms ease-out",
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
    ? "fixed left-0 right-0 bottom-0 z-50"
    : "fixed z-50 w-[320px]";

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" style={overlayStyle} aria-hidden />
      <div ref={ref} className={containerClass} style={isMobile ? mobileStyle : desktopStyle} role="alertdialog">
        {isMobile && (
          <div className="pt-2 pb-1 flex justify-center">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>
        )}
        <div style={{ padding: 18 }}>
          <h3 className="text-sm font-medium text-foreground mb-2">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">{message}</p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleClose}
              disabled={busy}
              className="px-3 py-2 text-xs font-medium rounded-[10px] border border-border/60 hover:bg-accent/40 transition-colors disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={busy}
              className={
                destructive
                  ? "px-3 py-2 text-xs font-medium rounded-[10px] bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-60"
                  : "px-3 py-2 text-xs font-medium rounded-[10px] bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-60"
              }
            >
              {busy ? "Bezig..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default ConfirmPopover;
