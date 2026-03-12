import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Star, Trash2, Loader2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Photo {
  id: string; file_path: string; is_hoofdfoto: boolean | null; volgorde: number | null; created_at: string;
  google_drive_file_id: string | null; google_drive_url: string | null;
}

const BUCKET = "vehicle-photos";

const VehicleFotosTab = ({ vehicleId }: { vehicleId: string }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const fetchPhotos = async () => {
    const { data } = await supabase.from("vehicle_photos").select("*").eq("vehicle_id", vehicleId).order("volgorde", { ascending: true });
    setPhotos((data as Photo[]) || []); setLoading(false);
  };

  useEffect(() => { fetchPhotos(); }, [vehicleId]);

  const getPublicUrl = (path: string) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i]; const ext = file.name.split(".").pop();
      const path = `${vehicleId}/${Date.now()}-${i}.${ext}`;
      const { error: storageError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (storageError) { toast.error(`Upload mislukt: ${file.name}`); continue; }
      await supabase.from("vehicle_photos").insert({ vehicle_id: vehicleId, file_path: path, volgorde: photos.length + i, is_hoofdfoto: photos.length === 0 && i === 0 } as any);
    }
    toast.success("Foto's geüpload! Wordt automatisch gesynchroniseerd naar Google Drive..."); setUploading(false); fetchPhotos();
  };

  const setHoofd = async (photoId: string) => {
    await supabase.from("vehicle_photos").update({ is_hoofdfoto: false } as any).eq("vehicle_id", vehicleId);
    await supabase.from("vehicle_photos").update({ is_hoofdfoto: true } as any).eq("id", photoId);
    toast.success("Hoofdfoto ingesteld"); fetchPhotos();
  };

  const handleDelete = async (photo: Photo) => {
    await supabase.storage.from(BUCKET).remove([photo.file_path]);
    await supabase.from("vehicle_photos").delete().eq("id", photo.id);
    toast.success("Foto verwijderd"); fetchPhotos();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 cursor-pointer">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Foto's Uploaden
          <input type="file" accept="image/*" multiple onChange={(e) => handleUpload(e.target.files)} className="hidden" />
        </label>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Nog geen foto's geüpload.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group aspect-square overflow-hidden bg-secondary">
                  <img src={getPublicUrl(photo.file_path)} alt="Voertuig foto" className="w-full h-full object-cover cursor-pointer" onClick={() => setLightbox(getPublicUrl(photo.file_path))} />
                  {/* Drive sync overlay */}
                  <span className={`absolute top-2 right-2 text-xs px-1 py-0.5 rounded ${photo.google_drive_url ? "bg-[#1967D2]/90 text-white" : "bg-secondary/90 text-muted-foreground"}`}>
                    {photo.google_drive_url ? "✅" : "⏳"}
                  </span>
                  {photo.is_hoofdfoto && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-wider">
                      <Star className="w-3 h-3" /> Hoofdfoto
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-2">
                    {!photo.is_hoofdfoto && (
                      <button onClick={() => setHoofd(photo.id)} className="px-2 py-1 bg-foreground text-background text-xs font-medium hover:bg-foreground/90">
                        <Star className="w-3 h-3 inline mr-1" />Hoofdfoto
                      </button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="px-2 py-1 bg-red-600 text-white text-xs font-medium hover:bg-red-700">
                          <Trash2 className="w-3 h-3 inline mr-1" />Verwijder
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Foto verwijderen?</AlertDialogTitle>
                          <AlertDialogDescription>Dit kan niet ongedaan worden gemaakt.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(photo)} className="bg-red-600 hover:bg-red-700">Verwijderen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-foreground hover:text-muted-foreground"><X className="w-6 h-6" /></button>
          <img src={lightbox} alt="Foto" className="max-w-full max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default VehicleFotosTab;
