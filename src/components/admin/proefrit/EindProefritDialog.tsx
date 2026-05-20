import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTestDrives, TestDrive } from "@/hooks/useTestDrives";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";

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
  const [fotos, setFotos] = useState<File[]>([]);
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAddFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    setFotos((prev) => [...prev, ...files]);
    setFotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFoto = (index: number) => {
    URL.revokeObjectURL(fotoPreviews[index]);
    setFotos((prev) => prev.filter((_, i) => i !== index));
    setFotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEnd = async () => {
    const km = parseInt(kmNa);
    if (!km || km < testDrive.km_voor) {
      toast.error("Kilometerstand moet hoger zijn dan de startstand");
      return;
    }
    setLoading(true);

    try {
      // Upload schade foto's
      const uploadedPaths: string[] = [];
      for (let i = 0; i < fotos.length; i++) {
        const file = fotos[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${testDrive.id}/schade-${Date.now()}-${i}.${ext}`;
        const { error } = await supabase.storage.from("test-drive-files").upload(path, file);
        if (!error) uploadedPaths.push(path);
      }

      await endTestDrive(testDrive.id, km, opmerkingen || undefined, uploadedPaths.length > 0 ? uploadedPaths : undefined);

      // Auto-send email with PDF to customer
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
          <div className="text-xs text-muted-foreground">
            KM voor rit: <span className="text-foreground font-medium">{testDrive.km_voor.toLocaleString("nl-NL")}</span>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Kilometerstand na de rit *
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={kmNa}
              onChange={(e) => setKmNa(e.target.value)}
              placeholder="bijv. 45280"
              className="w-full h-12 px-4 text-base bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground placeholder:text-muted-foreground transition-all"
            />
            {(() => {
              const km = parseInt(kmNa);
              if (!kmNa) {
                return <p className="mt-2 text-[11px] text-muted-foreground">Verplicht — vul de eindkilometerstand in.</p>;
              }
              if (!km || km < testDrive.km_voor) {
                return <p className="mt-2 text-[11px] text-red-400">Eindkilometerstand moet hoger zijn dan {testDrive.km_voor.toLocaleString("nl-NL")}.</p>;
              }
              return <p className="mt-2 text-[11px] text-emerald-400">Gereden: {(km - testDrive.km_voor).toLocaleString("nl-NL")} km</p>;
            })()}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Opmerkingen over de staat van de auto
            </label>
            <textarea
              value={opmerkingen}
              onChange={(e) => setOpmerkingen(e.target.value)}
              placeholder="Eventuele opmerkingen over de staat van de auto na terugkomst..."
              rows={3}
              className="w-full px-4 py-3 text-sm bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground placeholder:text-muted-foreground resize-none transition-all"
            />
          </div>

          {/* Schadefoto's */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">
              Schadefoto's (optioneel)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddFotos}
              className="hidden"
            />
            {fotoPreviews.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {fotoPreviews.map((url, i) => (
                  <div key={i} className="relative w-16 h-16">
                    <img src={url} alt={`Schade ${i + 1}`} className="w-full h-full object-cover rounded-xl border border-border" />
                    <button
                      onClick={() => removeFoto(i)}
                      className="absolute -top-1.5 -right-1.5 bg-card border border-border rounded-full p-0.5"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium border border-border rounded-xl hover:bg-accent/20 active:scale-[0.97] transition-all text-muted-foreground"
            >
              <Upload className="w-3.5 h-3.5" />
              Foto's toevoegen
            </button>
          </div>

          <button
            onClick={handleEnd}
            disabled={loading || !kmNa || !parseInt(kmNa) || parseInt(kmNa) < testDrive.km_voor}
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
