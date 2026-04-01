import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { useTestDrives, TestDrive } from "@/hooks/useTestDrives";
import { Copy, Check, QrCode, Mail, ExternalLink, Printer } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  vehicle: { id: string; merk: string; model: string; kenteken?: string; bouwjaar?: number; kilometerstand?: number };
}

const StartProefritDialog = ({ open, onClose, vehicle }: Props) => {
  const { startTestDrive } = useTestDrives();
  const [step, setStep] = useState<"form" | "result">("form");
  const [kmVoor, setKmVoor] = useState(vehicle.kilometerstand?.toString() || "");
  const [medewerker, setMedewerker] = useState("Emir Gamsiz");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestDrive | null>(null);
  const [copied, setCopied] = useState(false);

  const proefritUrl = result 
    ? `${window.location.origin}/proefrit/${result.token}` 
    : "";

  const handleStart = async () => {
    const km = parseInt(kmVoor);
    if (!km || km < 0) { toast.error("Voer een geldige kilometerstand in"); return; }
    setLoading(true);
    const td = await startTestDrive(vehicle.id, km, {
      merk: vehicle.merk,
      model: vehicle.model,
      kenteken: vehicle.kenteken,
      bouwjaar: vehicle.bouwjaar,
    }, medewerker || undefined);
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
    setStep("form");
    setResult(null);
    setKmVoor(vehicle.kilometerstand?.toString() || "");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            Proefrit starten — {vehicle.merk} {vehicle.model}
          </DialogTitle>
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Kilometerstand voor de rit
              </label>
              <input
                type="number"
                value={kmVoor}
                onChange={(e) => setKmVoor(e.target.value)}
                placeholder="bijv. 45230"
                className="w-full px-4 py-3 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground placeholder:text-muted-foreground transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-2">
                Begeleidende medewerker
              </label>
              <input
                type="text"
                value={medewerker}
                onChange={(e) => setMedewerker(e.target.value)}
                placeholder="Naam medewerker"
                className="w-full px-4 py-3 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground placeholder:text-muted-foreground transition-all"
              />
            </div>
            <button
              onClick={handleStart}
              disabled={loading || !kmVoor}
              className="w-full py-3 text-sm font-medium border border-border rounded-xl hover:bg-accent/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Bezig..." : "Proefrit starten"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={proefritUrl} size={180} />
              </div>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              Laat de klant deze QR-code scannen of stuur de link
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={proefritUrl}
                className="flex-1 px-3 py-2 text-xs bg-secondary/50 border border-border rounded-xl text-muted-foreground font-mono truncate"
              />
              <button
                onClick={handleCopy}
                className="shrink-0 p-1.5 border border-border rounded-md hover:bg-accent/20 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>

            <div className="flex gap-2">
              <a
                href={proefritUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent/20 transition-colors text-foreground"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Openen
              </a>
              <button
                onClick={() => {
                  const printWindow = window.open(proefritUrl, "_blank");
                  if (printWindow) {
                    printWindow.addEventListener("load", () => {
                      setTimeout(() => printWindow.print(), 1000);
                    });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent/20 transition-colors text-foreground"
              >
                <Printer className="w-3.5 h-3.5" /> Printen
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StartProefritDialog;
