import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRect?: DOMRect | null;
  onSubmit: (data: { voornaam: string; achternaam: string; email: string; telefoon: string }) => Promise<void>;
}

const labelCls = "block text-xs font-normal text-muted-foreground mb-1.5";
const inputCls =
  "w-full px-3 py-2.5 text-sm bg-background border border-border/60 rounded-[10px] focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/60";

const AddCustomerPopover = ({ open, onOpenChange, anchorRect, onSubmit }: Props) => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ voornaam: "", achternaam: "", email: "", telefoon: "" });
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [open]);

  const handleClose = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => {
      onOpenChange(false);
    }, isMobile ? 280 : 160);
  };

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      setForm({ voornaam: "", achternaam: "", email: "", telefoon: "" });
      setSaving(false);
    } else {
      // unmount after exit animation
      const t = window.setTimeout(() => setMounted(false), isMobile ? 280 : 160);
      return () => clearTimeout(t);
    }
  }, [open, isMobile]);

  useEffect(() => {
    if (!open || closing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) handleClose();
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
    const W = 360;
    const margin = 8;
    const vw = window.innerWidth;
    let left = anchorRect.right - W;
    if (left < margin) left = margin;
    if (left + W > vw - margin) left = vw - W - margin;
    const top = anchorRect.bottom + 6;
    setPos({ top, left });
  }, [open, isMobile, anchorRect]);

  const handleAdd = async () => {
    if (!form.voornaam || !form.achternaam || !form.email) {
      toast.error("Vul naam en e-mail in");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
      handleClose();
    } catch {
      // hook toont eigen toast
    } finally {
      setSaving(false);
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
    willChange: "transform, opacity",
    opacity: closing ? 0 : 1,
    transform: closing ? "translateY(-8px)" : "translateY(0)",
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
    willChange: "transform",
    transform: closing ? "translateY(100%)" : "translateY(0)",
    transition: closing
      ? "transform 280ms ease-in"
      : "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)",
  };

  if (isMobile) {
    mobileStyle.transform = closing
      ? "translateY(100%)"
      : animateIn ? "translateY(0)" : "translateY(100%)";
  } else {
    desktopStyle.opacity = closing ? 0 : animateIn ? 1 : 0;
    desktopStyle.transform = closing
      ? "translateY(-8px)"
      : animateIn ? "translateY(0)" : "translateY(-8px)";
  }

  const containerClass = isMobile
    ? "fixed left-0 right-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto"
    : "fixed z-50 w-[360px] max-h-[85vh] overflow-y-auto";

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" style={overlayStyle} aria-hidden />
      <div
        ref={containerRef}
        className={containerClass}
        style={isMobile ? mobileStyle : desktopStyle}
        role="dialog"
        aria-label="Klant toevoegen"
      >
        {isMobile && (
          <div className="pt-2 pb-1 flex justify-center">
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
        <div style={{ padding: 18 }}>
          <h3 className="text-sm font-medium text-foreground mb-4">Klant toevoegen</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Voornaam</label>
                <input
                  value={form.voornaam}
                  onChange={(e) => setForm({ ...form, voornaam: e.target.value })}
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelCls}>Achternaam</label>
                <input
                  value={form.achternaam}
                  onChange={(e) => setForm({ ...form, achternaam: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>E-mailadres</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Telefoonnummer</label>
              <input
                value={form.telefoon}
                onChange={(e) => setForm({ ...form, telefoon: e.target.value })}
                className={inputCls}
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="w-full py-2.5 text-sm font-medium text-white border border-white/15 hover:bg-white/[0.06] rounded-[10px] transition-colors disabled:opacity-60"
              style={{ background: "transparent" }}
            >
              {saving ? "Opslaan..." : "Klant toevoegen"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default AddCustomerPopover;
