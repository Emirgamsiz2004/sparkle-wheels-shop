import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTestDrives, TestDrive } from "@/hooks/useTestDrives";
import { toast } from "sonner";

interface Props {
  testDrive: TestDrive;
  open: boolean;
  onClose: () => void;
}

const EindProefritDialog = ({ testDrive, open, onClose }: Props) => {
  const { endTestDrive } = useTestDrives();
  const [kmNa, setKmNa] = useState("");
  const [opmerkingen, setOpmerkingen] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnd = async () => {
    const km = parseInt(kmNa);
    if (!km || km < testDrive.km_voor) {
      toast.error("Kilometerstand moet hoger zijn dan de startstand");
      return;
    }
    setLoading(true);
    await endTestDrive(testDrive.id, km, opmerkingen || undefined);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            Proefrit beëindigen — {testDrive.voertuig_merk} {testDrive.voertuig_model}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            KM voor rit: <span className="text-foreground font-medium">{testDrive.km_voor.toLocaleString("nl-NL")}</span>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Kilometerstand na de rit
            </label>
            <input
              type="number"
              value={kmNa}
              onChange={(e) => setKmNa(e.target.value)}
              placeholder="bijv. 45280"
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
              Opmerkingen na terugkomst
            </label>
            <textarea
              value={opmerkingen}
              onChange={(e) => setOpmerkingen(e.target.value)}
              placeholder="Eventuele opmerkingen over de staat van de auto..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <button
            onClick={handleEnd}
            disabled={loading || !kmNa}
            className="w-full py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Bezig..." : "Proefrit beëindigen"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EindProefritDialog;
