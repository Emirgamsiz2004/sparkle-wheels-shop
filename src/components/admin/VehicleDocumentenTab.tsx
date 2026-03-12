import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Download, Trash2, FileText, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Doc {
  id: string;
  naam: string;
  type: string | null;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

const docTypes = ["Inkoopverklaring", "Verkoopovereenkomst", "Kentekenbewijs", "Carpass", "Factuur", "Overig"];

const VehicleDocumentenTab = ({ vehicleId }: { vehicleId: string }) => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ naam: "", type: "Overig", file: null as File | null });

  const fetchDocs = async () => {
    const { data } = await supabase.from("vehicle_documents").select("*").eq("vehicle_id", vehicleId).order("created_at", { ascending: false });
    setDocs((data as Doc[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, [vehicleId]);

  const handleUpload = async () => {
    if (!form.file || !form.naam) return;
    setUploading(true);
    const ext = form.file.name.split(".").pop();
    const path = `${vehicleId}/${Date.now()}.${ext}`;
    const { error: storageError } = await supabase.storage.from("vehicle-documents").upload(path, form.file);
    if (storageError) { toast.error("Upload mislukt"); setUploading(false); return; }

    const { error } = await supabase.from("vehicle_documents").insert({
      vehicle_id: vehicleId,
      naam: form.naam,
      type: form.type,
      file_path: path,
      file_size: form.file.size,
      mime_type: form.file.type,
    } as any);
    if (error) { toast.error("Opslaan mislukt"); } else { toast.success("Document geüpload"); }
    setUploading(false);
    setOpen(false);
    setForm({ naam: "", type: "Overig", file: null });
    fetchDocs();
  };

  const handleDownload = async (doc: Doc) => {
    const { data, error } = await supabase.storage.from("vehicle-documents").createSignedUrl(doc.file_path, 300);
    if (error || !data?.signedUrl) { toast.error("Download link kon niet worden aangemaakt"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (doc: Doc) => {
    await supabase.storage.from("vehicle-documents").remove([doc.file_path]);
    await supabase.from("vehicle_documents").delete().eq("id", doc.id);
    toast.success("Document verwijderd");
    fetchDocs();
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#1F3864] text-white text-sm font-medium rounded-lg hover:bg-[#172d52]">
              <Plus className="w-4 h-4" /> Document Uploaden
            </button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle className="text-gray-900">Document Uploaden</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Bestand</label>
                <input type="file" accept=".pdf,.docx,.jpg,.jpeg,.png" onChange={(e) => setForm(f => ({ ...f, file: e.target.files?.[0] || null }))} className="w-full text-sm" />
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, JPG, PNG — max 20MB</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Naam</label>
                <input value={form.naam} onChange={(e) => setForm(f => ({ ...f, naam: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
                <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg">
                  {docTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={handleUpload} disabled={uploading || !form.file || !form.naam} className="w-full py-2.5 bg-[#1F3864] text-white text-sm font-medium rounded-lg hover:bg-[#172d52] disabled:opacity-50 flex items-center justify-center gap-2">
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />} Uploaden
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-gray-200 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : docs.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">Nog geen documenten geüpload.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.naam}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {doc.type && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">{doc.type}</span>}
                        <span>{formatSize(doc.file_size)}</span>
                        <span>{new Date(doc.created_at).toLocaleDateString("nl-NL")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDownload(doc)} className="p-1.5 text-gray-400 hover:text-[#1F3864]"><Download className="w-4 h-4" /></button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Document verwijderen?</AlertDialogTitle>
                          <AlertDialogDescription>Dit verwijdert het document permanent.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuleren</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(doc)} className="bg-red-600 hover:bg-red-700">Verwijderen</AlertDialogAction>
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
    </div>
  );
};

export default VehicleDocumentenTab;
