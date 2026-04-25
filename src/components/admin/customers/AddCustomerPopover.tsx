import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRect?: DOMRect | null;
  onSubmit: (data: { voornaam: string; achternaam: string; email: string; telefoon: string }) => Promise<void>;
}

const labelCls = "block text-[10px] font-medium tracking-wider uppercase text-muted-foreground mb-1.5";
const inputCls =
  "w-full px-3 py-2.5 text-sm bg-background border border-border/60 rounded-[10px] focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/60";

const AddCustomerPopover = ({ open, onOpenChange, anchorRect, onSubmit }: Props) => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ voornaam: "", achternaam: "", email: "", telefoon: "" });

  const handleClose = () => {
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open) {
      setForm({ voornaam: "", achternaam: "", email: "", telefoon: "" });
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

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

  if (!open) return null;

  const containerClass = isMobile
    ? "fixed left-0 right-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-[16px] border-t border-x border-border/60 bg-card shadow-2xl animate-in slide-in-from-bottom duration-200"
    : "fixed z-50 w-[360px] max-h-[85vh] overflow-y-auto rounded-[14px] border border-border/60 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.35)] animate-in fade-in-0 zoom-in-95 duration-150";

  const containerStyle: React.CSSProperties = isMobile
    ? { paddingBottom: "env(safe-area-inset-bottom, 0px)" }
    : pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 };

  return createPortal(
    <div ref={containerRef} className={containerClass} style={containerStyle} role="dialog" aria-label="Klant toevoegen">
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
            className="w-full py-2.5 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-[10px] transition-colors disabled:opacity-60"
          >
            {saving ? "Opslaan..." : "Klant toevoegen"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddCustomerPopover;
