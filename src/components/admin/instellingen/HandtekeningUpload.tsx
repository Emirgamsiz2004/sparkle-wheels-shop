import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, Trash2, PenLine } from "lucide-react";
import { toast } from "sonner";

const HandtekeningUpload = () => {
  const { user } = useAuth();
  const [path, setPath] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const refreshSignedUrl = async (p: string | null) => {
    if (!p) { setUrl(null); return; }
    // If legacy value is a full URL, fall back to it; otherwise sign the storage path.
    if (/^https?:\/\//i.test(p)) { setUrl(p); return; }
    const { data } = await supabase.storage.from("signatures").createSignedUrl(p, 60 * 60);
    setUrl(data?.signedUrl || null);
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("signature_url")
        .eq("user_id", user.id)
        .maybeSingle();
      const p = (data as any)?.signature_url || null;
      setPath(p);
      await refreshSignedUrl(p);
      setLoading(false);
    })();
  }, [user]);

  const handleUpload = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Alleen afbeeldingen toegestaan (PNG aanbevolen, transparant)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const storagePath = `${user.id}/handtekening-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("signatures")
        .upload(storagePath, file, { contentType: file.type, upsert: true });
      if (upErr) throw upErr;

      const { error: profErr } = await supabase
        .from("profiles")
        .update({ signature_url: storagePath } as any)
        .eq("user_id", user.id);
      if (profErr) throw profErr;

      setPath(storagePath);
      await refreshSignedUrl(storagePath);
      toast.success("Handtekening opgeslagen");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Upload mislukt");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ signature_url: null } as any).eq("user_id", user.id);
    setPath(null);
    setUrl(null);
    toast.success("Handtekening verwijderd");
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary/10">
            <PenLine className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground font-['Poppins']">Mijn handtekening</h2>
            <p className="text-xs text-muted-foreground">
              Wordt automatisch op de koopovereenkomst en andere verkoopdocumenten geplaatst
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="bg-white border border-border rounded-md p-4 flex items-center justify-center min-h-[120px]">
              {url ? (
                <img src={url} alt="Handtekening" className="max-h-24 object-contain" />
              ) : (
                <span className="text-xs text-muted-foreground">Nog geen handtekening geüpload</span>
              )}
            </div>

            <div className="flex gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-card border border-border rounded-md hover:bg-secondary cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {url ? "Vervangen" : "Uploaden"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {url && (
                <button
                  onClick={handleRemove}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-card border border-border rounded-md hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="w-4 h-4" /> Verwijderen
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: gebruik een PNG met transparante achtergrond voor het beste resultaat.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HandtekeningUpload;
