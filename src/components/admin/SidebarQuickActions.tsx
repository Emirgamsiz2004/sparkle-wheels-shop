import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Car, FileSignature, BadgeDollarSign, CreditCard, UserPlus, ClipboardCheck, CalendarPlus, FileText, Search, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardSafeViewport } from "@/hooks/use-keyboard-safe-viewport";
import NieuweProefritDialog from "@/components/admin/proefrit/NieuweProefritDialog";
import AddCustomerPopover from "@/components/admin/customers/AddCustomerPopover";
import InkoopverklaringWizard from "@/components/admin/inkoop/InkoopverklaringWizard";
import { useCustomers } from "@/hooks/useCustomers";

interface ActionItem {
  icon: typeof Car;
  label: string;
  onClick: () => void;
}

interface Section {
  title: string;
  items: ActionItem[];
}

interface Props {
  /** Visual style for the trigger button. */
  variant?: "rail" | "wide" | "fab" | "header";
  className?: string;
}


const SidebarQuickActions = ({ variant = "rail", className = "" }: Props) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { addCustomer } = useCustomers();
  const { bottomInset } = useKeyboardSafeViewport(isMobile);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ bottom: number; right: number } | null>(null);
  const [kenteken, setKenteken] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // Direct-action dialogs launched from the quick menu
  const [proefritOpen, setProefritOpen] = useState(false);
  const [klantOpen, setKlantOpen] = useState(false);
  const [klantAnchor, setKlantAnchor] = useState<DOMRect | null>(null);
  const [inkoopOpen, setInkoopOpen] = useState(false);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const launch = (fn: () => void) => {
    setOpen(false);
    // Wait a tick so the popover close animation doesn't fight with the dialog opening
    setTimeout(fn, 0);
  };

  const sections: Section[] = [
    {
      title: "Voertuig & verkoop",
      items: [
        { icon: Car, label: "Voertuig toevoegen", onClick: () => go("/admin/voertuigen/nieuw") },
        { icon: FileSignature, label: "Inkoopverklaring", onClick: () => launch(() => setInkoopOpen(true)) },
        { icon: BadgeDollarSign, label: "Verkoop starten", onClick: () => go("/admin/verkopen?new=1") },
        { icon: CreditCard, label: "Aanbetaling registreren", onClick: () => go("/admin/financieel?aanbetaling=1") },
      ],
    },
    {
      title: "Klanten & proefritten",
      items: [
        { icon: UserPlus, label: "Nieuwe klant", onClick: () => launch(() => { setKlantAnchor(btnRef.current?.getBoundingClientRect() || null); setKlantOpen(true); }) },
        { icon: ClipboardCheck, label: "Proefrit starten", onClick: () => launch(() => setProefritOpen(true)) },
        { icon: CalendarPlus, label: "Afspraak plannen", onClick: () => go("/admin/planning?new=1") },
      ],
    },
    {
      title: "Overig",
      items: [
        { icon: FileText, label: "Document aanmaken", onClick: () => go("/admin/archief?new=1") },
      ],
    },
  ];

  // Outside click + escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: MouseEvent) => {
      if (popRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => document.addEventListener("mousedown", onDown), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  // Compute popover position synchronously when opening to avoid flicker
  const computePos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    // Anchor panel above the FAB, aligned to its right edge
    const bottom = Math.max(8, window.innerHeight - r.top + 12);
    const right = Math.max(8, window.innerWidth - r.right);
    setPos({ bottom, right });
  };

  const handleToggle = () => {
    if (!open && !isMobile) computePos();
    setOpen((v) => !v);
  };

  // Reposition on resize while open
  useEffect(() => {
    if (!open || isMobile) return;
    const onResize = () => computePos();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, isMobile]);

  const handleKentekenSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const k = kenteken.trim().replace(/[-\s]/g, "");
    if (!k) return;
    setOpen(false);
    setKenteken("");
    navigate(`/admin/voertuigen?search=${encodeURIComponent(k)}`);
  };

  const trigger = (
    <button
      ref={btnRef}
      onClick={handleToggle}
      title="Snelstart"
      aria-label="Snelstart openen"
      className={
        variant === "fab"
          ? `inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_10px_30px_-6px_rgba(16,185,129,0.55)] ring-1 ring-emerald-300/30 transition-transform duration-200 ease-out active:scale-95 ${className}`
          : variant === "rail"
          ? `flex items-center gap-2.5 px-3 py-[7px] rounded-md text-[13px] transition-colors whitespace-nowrap text-foreground hover:bg-accent/60 border border-border/60 ${
              open ? "bg-accent" : ""
            } ${className}`
          : `inline-flex items-center justify-center w-9 h-9 rounded-full border border-border bg-background hover:bg-accent text-foreground transition-colors ${
              open ? "bg-accent" : ""
            } ${className}`
      }
    >
      {variant === "fab" ? (
        <motion.span
          key={open ? "x" : "plus"}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="inline-flex"
        >
          {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.span>
      ) : (
        <Plus className="w-4 h-4 flex-shrink-0" />
      )}
      {variant === "rail" && (
        <span className="transition-opacity duration-200 opacity-100 lg:opacity-0 lg:group-hover/sidebar:opacity-100">Snelstart</span>
      )}
    </button>
  );

  const panel = (
    <AnimatePresence>
      {open && (
        isMobile ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={popRef}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.8 }}
              style={{
                transform: bottomInset > 0 ? `translateY(-${bottomInset}px)` : undefined,
                transition: "transform 200ms ease-out",
                maxHeight: `calc(85vh - ${bottomInset}px)`,
              }}
              className="fixed bottom-0 inset-x-0 z-[61] bg-card border-t border-border rounded-t-2xl shadow-2xl pb-[env(safe-area-inset-bottom,12px)] overflow-y-auto"
            >
              <div className="pt-2 pb-1 flex justify-center">
                <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="px-4 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Snelstart</h3>
                <button onClick={() => setOpen(false)} className="p-1 -mr-1 text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <PanelInner sections={sections} kenteken={kenteken} setKenteken={setKenteken} onKentekenSubmit={handleKentekenSearch} />
            </motion.div>
          </>
        ) : (
          <motion.div
            ref={popRef}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={pos ? { bottom: pos.bottom, right: pos.right } : { bottom: -9999, right: -9999 }}
            className="fixed z-[60] w-[400px] max-h-[min(640px,80vh)] overflow-y-auto rounded-3xl border border-border/80 bg-card shadow-[0_24px_60px_-12px_rgba(0,0,0,0.65)] origin-bottom-right backdrop-blur-xl"
          >
            <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-md z-10 rounded-t-3xl">
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight">Snelstart</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Start direct een actie</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 -mr-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <PanelInner sections={sections} kenteken={kenteken} setKenteken={setKenteken} onKentekenSubmit={handleKentekenSearch} />
          </motion.div>
        )
      )}
    </AnimatePresence>
  );

  return (
    <>
      {trigger}
      {panel && createPortal(panel, document.body)}

      {/* Direct-action dialogs — opened from the snelstart menu */}
      <NieuweProefritDialog open={proefritOpen} onClose={() => setProefritOpen(false)} />
      <AddCustomerPopover
        open={klantOpen}
        onOpenChange={setKlantOpen}
        anchorRect={klantAnchor}
        onSubmit={async (data) => {
          await addCustomer({ ...data, status: "prospect" } as any);
          setKlantOpen(false);
        }}
      />
      <InkoopverklaringWizard open={inkoopOpen} onOpenChange={setInkoopOpen} />
    </>
  );
};

const PanelInner = ({
  sections, kenteken, setKenteken, onKentekenSubmit,
}: {
  sections: Section[];
  kenteken: string;
  setKenteken: (v: string) => void;
  onKentekenSubmit: (e: React.FormEvent) => void;
}) => (
  <div className="p-3 space-y-3">
    {sections.map((sec) => (
      <div key={sec.title}>
        <p className="px-1 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">{sec.title}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {sec.items.map((it) => (
            <button
              key={it.label}
              onClick={it.onClick}
              className="group flex items-center gap-2.5 px-3 py-3 rounded-2xl text-[12.5px] font-medium text-foreground bg-background border border-border/70 hover:border-foreground/40 hover:bg-accent/40 shadow-sm hover:shadow-md transition-all duration-150 text-left active:scale-[0.97]"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-accent/40 border border-border/60 text-foreground group-hover:bg-foreground group-hover:text-background group-hover:border-foreground transition-colors flex-shrink-0">
                <it.icon className="w-3.5 h-3.5" />
              </span>
              <span className="leading-tight">{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    ))}
    <div className="pt-2 border-t border-border/60">
      <p className="px-1 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em]">Kenteken opzoeken</p>
      <form onSubmit={onKentekenSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={kenteken}
            onChange={(e) => setKenteken(e.target.value.toUpperCase())}
            placeholder="AB-12-CD"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            className="w-full pl-8 pr-2 h-10 text-base bg-background border border-border rounded-2xl focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground/60 uppercase tracking-wider"
          />
        </div>
        <button type="submit" className="h-10 px-5 text-xs font-medium bg-foreground text-background rounded-2xl hover:bg-foreground/90 transition-colors">Ga</button>
      </form>
    </div>
  </div>
);

export default SidebarQuickActions;
