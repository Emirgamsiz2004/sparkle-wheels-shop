import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTestDrives, TestDrive } from "@/hooks/useTestDrives";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  testDrive: TestDrive;
  open: boolean;
  onClose: () => void;
}

const EindProefritDialog = ({ testDrive, open, onClose }: Props) => {
  const { endTestDrive } = useTestDrives();
  const [opmerkingen, setOpmerkingen] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnd = async () => {
    setLoading(true);
    try {
      await endTestDrive(testDrive.id, testDrive.km_voor || 0, opmerkingen || undefined, undefined);

      // Auto-send email with PDF to customer (best-effort)
      try {
        await supabase.functions.invoke("generate-proefrit-pdf", {
          body: { testDriveId: testDrive.id, sendEmail: true },
        });
        toast.success("Overeenkomst verzonden naar klant");
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Fout bij beëindigen proefrit");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            Proefrit beëindigen — {testDrive.voertuig_merk} {testDrive.voertuig_model}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-xs text-muted-foreground">
            De eindtijd wordt automatisch geregistreerd.
          </p>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Opmerkingen (optioneel)
            </label>
            <textarea
              value={opmerkingen}
              onChange={(e) => setOpmerkingen(e.target.value)}
              placeholder="Eventuele opmerkingen over de proefrit..."
              rows={3}
              className="w-full px-4 py-3 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground placeholder:text-muted-foreground resize-none transition-all"
            />
          </div>

          <button
            onClick={handleEnd}
            disabled={loading}
            className="w-full py-3 text-sm font-medium border border-border rounded-xl hover:bg-accent/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Bezig..." : "Afsluiten en opslaan"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EindProefritDialog;
