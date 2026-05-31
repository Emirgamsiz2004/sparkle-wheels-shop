import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plug, CheckCircle2, XCircle, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ConnectorStatus {
  id: string;
  name: string;
  description: string;
  category: string;
  connected: boolean;
  missingVars: string[];
}

const ConnectorsBeheer = () => {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("list-connectors-status");
    if (error) {
      toast.error("Kon connectors niet ophalen");
    } else {
      setConnectors(data?.connectors || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openLovableConnectors = () => {
    window.open("https://lovable.dev/projects/a07eb15b-5bf0-4dee-a27d-6af2bde03954/settings/connectors", "_blank");
  };

  const grouped = connectors.reduce<Record<string, ConnectorStatus[]>>((acc, c) => {
    (acc[c.category] ||= []).push(c);
    return acc;
  }, {});

  const connectedCount = connectors.filter((c) => c.connected).length;

  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-primary/10">
              <Plug className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground font-['Poppins']">Connectors</h2>
              <p className="text-xs text-muted-foreground">
                {loading ? "Laden..." : `${connectedCount} van ${connectors.length} verbonden`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-secondary disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Vernieuwen
            </button>
            <button
              onClick={openLovableConnectors}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Beheer in Lovable
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">
                  {category}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {items.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-start justify-between gap-3 py-2.5 px-3 bg-secondary/30 rounded-md border border-border/50"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {c.connected ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="text-sm font-medium text-foreground truncate">{c.name}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 ml-6 leading-tight">
                          {c.description}
                        </p>
                        {!c.connected && c.missingVars.length > 0 && (
                          <p className="text-[10px] text-amber-500/80 mt-1 ml-6 font-mono">
                            Ontbreekt: {c.missingVars.join(", ")}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded shrink-0 ${
                          c.connected
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.connected ? "Verbonden" : "Niet verbonden"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-[11px] text-muted-foreground border-t border-border/50 pt-3">
          Verbindingen worden beheerd via het Lovable dashboard. Klik op "Beheer in Lovable" om
          connectors toe te voegen of te wijzigen.
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectorsBeheer;
