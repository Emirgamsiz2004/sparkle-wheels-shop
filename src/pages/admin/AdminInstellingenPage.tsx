import { useState, useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const WEBHOOK_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "leykexzdvatuyitkxdxs"}.supabase.co/functions/v1/make-webhook-handler`;

const AdminInstellingenPage = () => {
  const { settings, loading, saveSetting } = useSettings();
  const [folderId, setFolderId] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading) {
      setFolderId(settings["google_drive_root_folder_id"] || "");
      setSyncEnabled(settings["google_drive_sync_enabled"] === "true");
    }
  }, [loading, settings]);

  const handleSave = async () => {
    setSaving(true);
    await saveSetting("google_drive_root_folder_id", folderId);
    await saveSetting("google_drive_sync_enabled", String(syncEnabled));
    toast.success("Instellingen opgeslagen");
    setSaving(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    toast.success("URL gekopieerd");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Instellingen</h1>
        <p className="text-sm text-muted-foreground mt-1">Beheer koppelingen en integraties</p>
      </div>

      {/* Google Drive Section */}
      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: "#1967D2" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M7.71 3.5L1.15 15l3.44 5.97h6.47l-3.44-5.97L7.71 3.5zm1.14 0l6.47 11.5H21.85L15.29 3.5H8.85zm6.56 12.5L12 21.97h12.85L21.41 16H15.41z"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Google Drive</h2>
              <p className="text-xs text-muted-foreground">Koppeling via Make.com webhooks</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            De Google Drive koppeling werkt via Make.com. Stel de Make.com scenario's in volgens het stappenplan.
          </p>

          <div>
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
              Platin Automotive Drive Map ID
            </label>
            <input
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              placeholder="bijv. 1AbC_dEfGhIjKlMnOpQrStUvWxYz"
              className="w-full px-3 py-2 text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Je vindt dit ID in de URL van je Google Drive map: drive.google.com/drive/folders/<strong>[DIT IS HET ID]</strong>
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Auto-sync ingeschakeld</p>
              <p className="text-xs text-muted-foreground">Synchroniseer documenten en foto's automatisch</p>
            </div>
            <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
          </div>

          <hr className="border-border" />

          <div>
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
              Make.com Webhook URL
            </label>
            <div className="flex gap-2">
              <input
                value={WEBHOOK_URL}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-secondary border border-border text-muted-foreground font-mono text-xs"
              />
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-card border border-border text-foreground hover:bg-secondary"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Voer deze URL in als de HTTP webhook URL in je Make.com scenario's
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 border border-border text-sm font-medium rounded-md hover:bg-accent disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Opslaan
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInstellingenPage;
