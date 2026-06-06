import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatEuroDecimal } from "@/types/vehicle";
import { Mail, Phone, MessageCircle, User, Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Aanbetaling {
  id: string;
  klant_voornaam: string | null;
  klant_achternaam: string | null;
  klant_email: string | null;
  klant_telefoon: string | null;
  klant_adres: string | null;
  klant_postcode: string | null;
  klant_woonplaats: string | null;
  aanbetalingsbedrag: number | null;
  restbedrag: number | null;
  verkoopprijs: number | null;
  datum: string | null;
  uiterlijke_datum: string | null;
  status: string | null;
  notities: string | null;
}

const Pill = ({ status }: { status: string | null }) => {
  const map: Record<string, { label: string; cls: string; Icon: any }> = {
    betaald: { label: "Betaald", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", Icon: CheckCircle2 },
    openstaand: { label: "Openstaand", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30", Icon: Clock },
    geannuleerd: { label: "Geannuleerd", cls: "bg-muted text-muted-foreground border-border", Icon: XCircle },
  };
  const s = map[status || "openstaand"] || map.openstaand;
  const Icon = s.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium border rounded-full ${s.cls}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" });
};

const AanbetalingBlock = ({ vehicleId }: { vehicleId: string }) => {
  const [items, setItems] = useState<Aanbetaling[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("aanbetalingen")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: false });
      setItems((data || []) as any);
      setLoading(false);
    })();
  }, [vehicleId]);

  if (loading || items.length === 0) return null;

  return (
    <div className="space-y-3">
      {items.map((a) => {
        const naam = `${a.klant_voornaam || ""} ${a.klant_achternaam || ""}`.trim() || "Onbekende klant";
        const tel = (a.klant_telefoon || "").replace(/[^\d+]/g, "");
        const waUrl = tel ? `https://wa.me/${tel.replace(/^0/, "31")}?text=${encodeURIComponent(`Hallo ${a.klant_voornaam || ""}, je auto staat voor je klaar bij Platin Automotive.`)}` : null;
        return (
          <div key={a.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aanbetaling</h3>
                <Pill status={a.status} />
              </div>
              <button
                onClick={() => navigate(`/admin/verkopen/${vehicleId}`)}
                className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
              >
                Naar verkoopdossier →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Klantgegevens */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {naam}
                </div>
                {(a.klant_adres || a.klant_postcode) && (
                  <div className="text-xs text-muted-foreground pl-6">
                    {a.klant_adres}
                    {a.klant_postcode && <><br />{a.klant_postcode} {a.klant_woonplaats}</>}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {a.klant_telefoon && (
                    <a href={`tel:${a.klant_telefoon}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors">
                      <Phone className="w-3.5 h-3.5" /> Bellen
                    </a>
                  )}
                  {waUrl && (
                    <a href={waUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-emerald-500/30 text-emerald-400 rounded-md hover:bg-emerald-500/10 transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  )}
                  {a.klant_email && (
                    <a href={`mailto:${a.klant_email}?subject=${encodeURIComponent("Je auto staat klaar")}&body=${encodeURIComponent(`Hallo ${a.klant_voornaam || ""},\n\nJe auto staat voor je klaar bij Platin Automotive.\n\nMet vriendelijke groet,\nPlatin Automotive`)}`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors">
                      <Mail className="w-3.5 h-3.5" /> Mail
                    </a>
                  )}
                </div>
              </div>

              {/* Bedragen */}
              <div className="space-y-1.5">
                <Row label="Verkoopprijs" value={formatEuroDecimal(Number(a.verkoopprijs || 0))} />
                <Row label="Aanbetaald" value={formatEuroDecimal(Number(a.aanbetalingsbedrag || 0))} highlight />
                <Row label="Restbedrag" value={formatEuroDecimal(Number(a.restbedrag || 0))} />
                <Row label="Datum" value={formatDate(a.datum)} icon={<Calendar className="w-3 h-3" />} />
                {a.uiterlijke_datum && <Row label="Uiterlijk afhalen" value={formatDate(a.uiterlijke_datum)} />}
              </div>
            </div>

            {a.notities && (
              <p className="text-xs text-muted-foreground border-t border-border/50 pt-2 whitespace-pre-wrap">{a.notities}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

const Row = ({ label, value, highlight, icon }: { label: string; value: string; highlight?: boolean; icon?: React.ReactNode }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-muted-foreground inline-flex items-center gap-1">{icon}{label}</span>
    <span className={`tabular-nums font-medium ${highlight ? "text-emerald-400" : "text-foreground"}`}>{value}</span>
  </div>
);

export default AanbetalingBlock;
