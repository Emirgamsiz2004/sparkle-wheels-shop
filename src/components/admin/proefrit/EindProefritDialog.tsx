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
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Fout bij beëindigen proefrit");
    }
    setLoading(false);
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
              Kilometerstand na de rit *
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
              Opmerkingen over de staat van de auto
            </label>
            <textarea
              value={opmerkingen}
              onChange={(e) => setOpmerkingen(e.target.value)}
              placeholder="Eventuele opmerkingen over de staat van de auto na terugkomst..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Schadefoto's */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">
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
              <div className="flex gap-2 flex-wrap mb-2">
                {fotoPreviews.map((url, i) => (
                  <div key={i} className="relative w-16 h-16">
                    <img src={url} alt={`Schade ${i + 1}`} className="w-full h-full object-cover rounded-md border border-border" />
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent/20 transition-colors text-muted-foreground"
            >
              <Upload className="w-3.5 h-3.5" />
              Foto's toevoegen
            </button>
          </div>

          <button
            onClick={handleEnd}
            disabled={loading || !kmNa}
            className="w-full py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
          >
            {loading ? "Bezig..." : "Afsluiten en opslaan"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EindProefritDialog;
