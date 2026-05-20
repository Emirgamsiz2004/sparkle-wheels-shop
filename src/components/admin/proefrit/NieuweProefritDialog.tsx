import { useState, useMemo, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { QRCodeSVG } from "qrcode.react";
import { useTestDrives, TestDrive } from "@/hooks/useTestDrives";
import { useVehicles } from "@/hooks/useVehicles";
import { Copy, Check, ExternalLink, Printer, Search, Car, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { keepFocusedFieldVisible, useKeyboardSafeViewport } from "@/hooks/use-keyboard-safe-viewport";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-selected vehicle (e.g. from a scheduled appointment) */
  preselectedVehicle?: { id: string; merk: string; model: string; kenteken?: string; bouwjaar?: number; kilometerstand?: number };
  anchorRect?: DOMRect | null;
}

type Step = "select" | "form" | "result";

const inputCls = "w-full h-12 px-4 text-base md:h-auto md:px-3 md:py-2.5 md:text-sm bg-background border border-border/60 rounded-[10px] focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground/60";

const NieuweProefritDialog = ({ open, onClose, preselectedVehicle, anchorRect }: Props) => {
  const { startTestDrive } = useTestDrives();
  const { vehicles } = useVehicles();
  const isMobile = useIsMobile();
  const keyboardViewport = useKeyboardSafeViewport(open && isMobile);
  const [step, setStep] = useState<Step>(preselectedVehicle ? "form" : "select");
  const [search, setSearch] = useState("");
  const [useManual, setUseManual] = useState(false);

  // Selected vehicle from inventory
  const [selectedVehicle, setSelectedVehicle] = useState<Props["preselectedVehicle"] | null>(preselectedVehicle || null);

  // Manual vehicle fields
  const [manualMerk, setManualMerk] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [manualKenteken, setManualKenteken] = useState("");
  const [manualBouwjaar, setManualBouwjaar] = useState("");

  // Form fields
  const [kmVoor, setKmVoor] = useState(preselectedVehicle?.kilometerstand?.toString() || "");
  const [medewerker, setMedewerker] = useState("Emir Gamsiz");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestDrive | null>(null);
  const [copied, setCopied] = useState(false);

  const proefritUrl = result ? `${window.location.origin}/proefrit/${result.token}` : "";

  const voorraadVehicles = useMemo(() => {
    return vehicles.filter((v) => v.status !== "verkocht");
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    if (!search.trim()) return voorraadVehicles;
    const q = search.toLowerCase().replace(/[-\s]/g, "");
    return voorraadVehicles.filter(
      (v) =>
        `${v.merk} ${v.model}`.toLowerCase().includes(q) ||
        (v.kenteken || "").toLowerCase().replace(/[-\s]/g, "").includes(q)
    );
  }, [voorraadVehicles, search]);

  const handleSelectVehicle = (v: typeof voorraadVehicles[0]) => {
    setSelectedVehicle({
      id: v.id,
      merk: v.merk,
      model: v.model,
      kenteken: v.kenteken || undefined,
      bouwjaar: v.bouwjaar || undefined,
      kilometerstand: v.kilometerstand || undefined,
    });
    setKmVoor(v.kilometerstand?.toString() || "");
    setStep("form");
  };

  const handleManualContinue = () => {
    if (!manualMerk || !manualModel) {
      toast.error("Vul merk en model in");
      return;
    }
    setSelectedVehicle({
      id: "", // no vehicle in DB
      merk: manualMerk,
      model: manualModel,
      kenteken: manualKenteken || undefined,
      bouwjaar: manualBouwjaar ? parseInt(manualBouwjaar) : undefined,
    });
    setStep("form");
  };

  const handleStart = async () => {
    if (!selectedVehicle) return;
    const km = parseInt(kmVoor);
    if (!km || km < 0) {
      toast.error("Voer een geldige kilometerstand in");
      return;
    }
    setLoading(true);
    const td = await startTestDrive(
      selectedVehicle.id || undefined as any,
      km,
      {
        merk: selectedVehicle.merk,
        model: selectedVehicle.model,
        kenteken: selectedVehicle.kenteken,
        bouwjaar: selectedVehicle.bouwjaar,
      },
      medewerker || undefined
    );
    setLoading(false);
    if (td) {
      setResult(td);
      setStep("result");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proefritUrl);
    setCopied(true);
    toast.success("Link gekopieerd");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setStep(preselectedVehicle ? "form" : "select");
    setResult(null);
    setSelectedVehicle(preselectedVehicle || null);
    setSearch("");
    setUseManual(false);
    setManualMerk("");
    setManualModel("");
    setManualKenteken("");
    setManualBouwjaar("");
    setKmVoor(preselectedVehicle?.kilometerstand?.toString() || "");
    onClose();
  };

  // Popover positioning + outside-click + ESC
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

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
    const W = 380;
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
    ? "fixed left-0 right-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-[16px] border-t border-x border-border/60 bg-card shadow-2xl animate-in slide-in-from-bottom duration-200"
    : "fixed z-50 w-[380px] max-h-[85vh] overflow-y-auto rounded-[14px] border border-border/60 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.35)] animate-in fade-in-0 zoom-in-95 duration-150";

  const containerStyle: React.CSSProperties = isMobile
    ? { paddingBottom: "env(safe-area-inset-bottom, 0px)" }
    : pos ? { top: pos.top, left: pos.left } : { top: -9999, left: -9999 };

  const title =
    step === "select" ? "Proefrit starten" : step === "form" ? `Proefrit — ${selectedVehicle?.merk} ${selectedVehicle?.model}` : "Proefrit gestart";

  return createPortal(
    <div ref={containerRef} className={containerClass} style={containerStyle} role="dialog" aria-label="Proefrit starten">
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
        <h3 className="text-sm font-medium text-foreground mb-4 pr-8">{title}</h3>

        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div key="select" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-3">
              {!useManual ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Zoek voertuig in voorraad..."
                      className={`${inputCls} pl-8`}
                    />
                  </div>

                  <div className="max-h-[280px] overflow-y-auto -mx-1 px-1 divide-y divide-border/40">
                    {filteredVehicles.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">Geen voertuigen gevonden</p>
                    ) : (
                      filteredVehicles.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleSelectVehicle(v)}
                          className="w-full text-left flex items-center gap-3 px-2.5 py-2.5 rounded-[8px] transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                        >
                          <Car className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{v.merk} {v.model}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {v.kenteken && <span className="text-[10px] font-mono text-muted-foreground uppercase">{v.kenteken}</span>}
                              {v.bouwjaar && <span className="text-[10px] text-muted-foreground">{v.bouwjaar}</span>}
                              {v.kilometerstand > 0 && <span className="text-[10px] text-muted-foreground">{v.kilometerstand.toLocaleString("nl-NL")} km</span>}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="border-t border-border/40 pt-3">
                    <button
                      onClick={() => setUseManual(true)}
                      className="w-full py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Voertuig niet in voorraad? Handmatig invullen
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Vul de voertuiggegevens handmatig in</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">Merk *</label>
                      <input value={manualMerk} onChange={(e) => setManualMerk(e.target.value)} placeholder="bijv. BMW" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">Model *</label>
                      <input value={manualModel} onChange={(e) => setManualModel(e.target.value)} placeholder="bijv. 320i" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">Kenteken</label>
                      <input value={manualKenteken} onChange={(e) => setManualKenteken(e.target.value.toUpperCase())} placeholder="AB-123-CD" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">Bouwjaar</label>
                      <input type="number" value={manualBouwjaar} onChange={(e) => setManualBouwjaar(e.target.value)} placeholder="2020" className={inputCls} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setUseManual(false)} className="flex-1 py-2.5 text-xs font-medium border border-border/60 rounded-[10px] hover:bg-accent/20 transition-colors">
                      Terug
                    </button>
                    <button onClick={handleManualContinue} className="flex-1 py-2.5 text-xs font-medium bg-foreground text-background rounded-[10px] hover:bg-foreground/90 transition-colors active:scale-[0.97]">
                      Doorgaan
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {step === "form" && (
            <motion.div key="form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Kilometerstand voor de rit</label>
                <input type="number" value={kmVoor} onChange={(e) => setKmVoor(e.target.value)} placeholder="bijv. 45230" className={inputCls} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground mb-1">Begeleidende medewerker</label>
                <input value={medewerker} onChange={(e) => setMedewerker(e.target.value)} placeholder="Naam medewerker" className={inputCls} />
              </div>
              <div className="flex gap-2">
                {!preselectedVehicle && (
                  <button onClick={() => { setStep("select"); setSelectedVehicle(null); }} className="flex-1 py-2.5 text-xs font-medium border border-border/60 rounded-[10px] hover:bg-accent/20 transition-colors">
                    Terug
                  </button>
                )}
                <button onClick={handleStart} disabled={loading || !kmVoor} className="flex-1 py-2.5 text-xs font-medium bg-foreground text-background rounded-[10px] hover:bg-foreground/90 transition-colors active:scale-[0.97] disabled:opacity-50">
                  {loading ? "Bezig..." : "Proefrit starten"}
                </button>
              </div>
            </motion.div>
          )}

          {step === "result" && (
            <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-4">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-md">
                  <QRCodeSVG value={proefritUrl} size={160} />
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">Laat de klant deze QR-code scannen of stuur de link</p>
              <div className="flex items-center gap-2">
                <input type="text" readOnly value={proefritUrl} className={`${inputCls} flex-1 text-xs font-mono truncate`} />
                <button onClick={handleCopy} className="shrink-0 p-2.5 border border-border/60 rounded-[10px] hover:bg-accent/20 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <div className="flex gap-2">
                <a href={proefritUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border border-border/60 rounded-[10px] hover:bg-accent/20 active:scale-[0.97] transition-colors text-foreground">
                  <ExternalLink className="w-3.5 h-3.5" /> Openen
                </a>
                <button onClick={() => { const w = window.open(proefritUrl, "_blank"); if (w) { w.addEventListener("load", () => setTimeout(() => w.print(), 1000)); } }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border border-border/60 rounded-[10px] hover:bg-accent/20 active:scale-[0.97] transition-colors text-foreground">
                  <Printer className="w-3.5 h-3.5" /> Printen
                </button>
                <button onClick={handleClose} className="flex-1 py-2.5 text-xs font-medium border border-border/60 rounded-[10px] hover:bg-accent/20 active:scale-[0.97] transition-colors">
                  Sluiten
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
};

export default NieuweProefritDialog;
