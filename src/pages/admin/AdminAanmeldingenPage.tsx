import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SlidingTabs from "@/components/admin/SlidingTabs";
import { Mail, Phone, Car, Eye, CheckCircle, Clock, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

const AdminAanmeldingenPage = () => {
  const [tab, setTab] = useState("contact");
  const queryClient = useQueryClient();

  // Contact aanmeldingen
  const { data: contactItems = [], isLoading: contactLoading } = useQuery({
    queryKey: ["contact_aanmeldingen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_aanmeldingen")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Consignatie aanmeldingen
  const { data: consignatieItems = [], isLoading: consignatieLoading } = useQuery({
    queryKey: ["consignatie_aanmeldingen"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consignatie_aanmeldingen")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Mark contact as handled
  const markContactHandled = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_aanmeldingen")
        .update({ status: "afgehandeld" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact_aanmeldingen"] });
      toast.success("Gemarkeerd als afgehandeld");
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_aanmeldingen")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact_aanmeldingen"] });
      toast.success("Verwijderd");
    },
  });

  const contactNew = contactItems.filter((c: any) => c.status === "nieuw").length;
  const consignatieNew = consignatieItems.length;

  const tabs = [
    { value: "contact", label: `Contact${contactNew > 0 ? ` (${contactNew})` : ""}` },
    { value: "consignatie", label: `Consignatie${consignatieNew > 0 ? ` (${consignatieNew})` : ""}` },
  ];

  const formatDate = (d: string) => {
    try {
      return format(new Date(d), "d MMM yyyy HH:mm", { locale: nl });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-heading font-semibold text-foreground">Aanmeldingen</h1>
        <p className="text-sm text-muted-foreground mt-1">Inzendingen via de website</p>
      </div>

      <SlidingTabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === "contact" && (
        <div className="space-y-3">
          {contactLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground/30" />
            </div>
          ) : contactItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Nog geen contactaanmeldingen ontvangen.
            </div>
          ) : (
            contactItems.map((item: any) => (
              <div
                key={item.id}
                className={`border rounded-[3px] p-4 transition-colors ${
                  item.status === "nieuw" ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {item.status === "nieuw" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/20 text-primary">
                          <Clock className="w-3 h-3" /> Nieuw
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{item.naam}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <a href={`mailto:${item.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <Mail className="w-3 h-3" /> {item.email}
                      </a>
                      {item.telefoon && (
                        <a href={`tel:${item.telefoon}`} className="flex items-center gap-1 hover:text-foreground">
                          <Phone className="w-3 h-3" /> {item.telefoon}
                        </a>
                      )}
                    </div>
                    {item.bericht && (
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{item.bericht}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.status === "nieuw" && (
                      <button
                        onClick={() => markContactHandled.mutate(item.id)}
                        className="p-2 text-muted-foreground hover:text-green-500 transition-colors"
                        title="Markeer als afgehandeld"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteContact.mutate(item.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "consignatie" && (
        <div className="space-y-3">
          {consignatieLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground/30" />
            </div>
          ) : consignatieItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              Nog geen consignatie-aanmeldingen ontvangen.
            </div>
          ) : (
            consignatieItems.map((item: any) => (
              <div key={item.id} className="border border-border rounded-[3px] p-4 bg-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{item.naam}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <a href={`mailto:${item.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <Mail className="w-3 h-3" /> {item.email}
                      </a>
                      <a href={`tel:${item.telefoon}`} className="flex items-center gap-1 hover:text-foreground">
                        <Phone className="w-3 h-3" /> {item.telefoon}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-foreground">
                      <Car className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{item.merk} {item.model}</span>
                      <span className="text-muted-foreground">({item.bouwjaar})</span>
                      {item.kenteken && (
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground font-mono">
                          {item.kenteken}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                      <span>{item.km_stand} km</span>
                      {item.brandstof && <span>{item.brandstof}</span>}
                      {item.transmissie && <span>{item.transmissie}</span>}
                      {item.kleur && <span>{item.kleur}</span>}
                    </div>
                    {item.opmerkingen && (
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{item.opmerkingen}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAanmeldingenPage;
