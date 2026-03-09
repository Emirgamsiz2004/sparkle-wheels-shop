import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Phone, Mail, Calendar, Loader2, Search, ExternalLink, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.svg";

interface Aanmelding {
  id: string;
  naam: string;
  telefoon: string;
  email: string;
  kenteken: string | null;
  merk: string;
  model: string;
  bouwjaar: string;
  km_stand: string;
  brandstof: string | null;
  transmissie: string | null;
  kleur: string | null;
  schadevrij: boolean | null;
  onderhoudsboekje: boolean | null;
  apk_geldig: boolean | null;
  rookvrij: boolean | null;
  eerste_eigenaar: boolean | null;
  opmerkingen: string | null;
  foto_urls: string[] | null;
  created_at: string;
}

interface TaxatieData {
  inkoopwaarde: string | null;
  verkoopwaarde: string | null;
  nieuwprijs: string | null;
  dagwaarde: string | null;
  handelsprijs: string | null;
}

const BoolBadge = ({ value, label }: { value: boolean | null; label: string }) => {
  if (value === null) return null;
  return (
    <span
      className={`inline-flex px-2.5 py-1 text-[9px] tracking-[0.1em] uppercase font-body font-medium ${
        value ? "bg-foreground/10 text-foreground" : "bg-destructive/10 text-destructive"
      }`}
    >
      {label}: {value ? "Ja" : "Nee"}
    </span>
  );
};

const AdminDashboard = () => {
  const [aanmeldingen, setAanmeldingen] = useState<Aanmelding[]>([]);
  const [loading, setLoading] = useState(true);
  const [taxaties, setTaxaties] = useState<Record<string, TaxatieData>>({});
  const [taxatieLoading, setTaxatieLoading] = useState<Record<string, boolean>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }
      fetchAanmeldingen();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/admin/login");
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchAanmeldingen = async () => {
    const { data, error } = await supabase
      .from("consignatie_aanmeldingen")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Kon aanmeldingen niet laden");
      console.error(error);
    } else {
      setAanmeldingen(data || []);
    }
    setLoading(false);
  };

  const fetchTaxatie = async (id: string, kenteken: string) => {
    setTaxatieLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("vwe-taxatie", {
        body: { kenteken },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        setTaxaties((prev) => ({ ...prev, [id]: data.data }));
        toast.success("Taxatie opgehaald");
      } else {
        toast.error(data?.error || "Kon taxatie niet ophalen");
      }
    } catch (err) {
      console.error("Taxatie error:", err);
      toast.error("Fout bij ophalen taxatie");
    }
    setTaxatieLoading((prev) => ({ ...prev, [id]: false }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "—";
    const num = parseInt(value);
    if (isNaN(num)) return value;
    return `€ ${num.toLocaleString("nl-NL")}`;
  };

  const selected = aanmeldingen.find((a) => a.id === selectedId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="flex items-center justify-between px-6 lg:px-10 py-4">
          <div className="flex items-center gap-6">
            <img src={logo} alt="PLA Auto's" className="h-8 w-auto" />
            <span className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/admin/deals")}
              className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Deal Analyzer
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Uitloggen
            </button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Left: list */}
        <div className="w-full md:w-96 lg:w-[420px] border-r border-border overflow-y-auto">
          <div className="p-6 border-b border-border">
            <h1 className="text-lg font-display font-bold text-foreground mb-1">
              Consignatie Aanmeldingen
            </h1>
            <p className="text-[11px] font-body text-muted-foreground">
              {aanmeldingen.length} aanmelding{aanmeldingen.length !== 1 ? "en" : ""}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : aanmeldingen.length === 0 ? (
            <div className="text-center py-20 text-sm font-body text-muted-foreground">
              Nog geen aanmeldingen
            </div>
          ) : (
            aanmeldingen.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`w-full text-left p-5 border-b border-border transition-colors ${
                  selectedId === a.id ? "bg-card" : "hover:bg-card/50"
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="text-sm font-display font-semibold text-foreground">
                    {a.merk} {a.model}
                  </h3>
                  <span className="text-[9px] font-body text-muted-foreground whitespace-nowrap ml-3">
                    {formatDate(a.created_at).split(" om")[0]}
                  </span>
                </div>
                <p className="text-[11px] font-body text-muted-foreground">
                  {a.naam} · {a.bouwjaar} · {a.km_stand} km
                </p>
                {a.kenteken && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-card text-[9px] tracking-[0.15em] uppercase font-body font-medium text-muted-foreground border border-border">
                    {a.kenteken}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Right: detail */}
        <div className="hidden md:flex flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm font-body text-muted-foreground">
              Selecteer een aanmelding
            </div>
          ) : (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex-1 p-8 lg:p-12 max-w-3xl"
            >
              {/* Auto info */}
              <div className="mb-10">
                <p className="text-[10px] tracking-[0.5em] uppercase font-body font-medium text-muted-foreground mb-2">
                  Voertuig
                </p>
                <h2 className="text-2xl font-display font-bold text-foreground mb-1">
                  {selected.merk} {selected.model}
                </h2>
                <p className="text-sm font-body text-muted-foreground">
                  {selected.bouwjaar} · {selected.km_stand} km · {selected.brandstof || "Onbekend"} · {selected.transmissie || "Onbekend"} · {selected.kleur || "Onbekend"}
                </p>
                {selected.kenteken && (
                  <span className="inline-block mt-3 px-3 py-1 bg-card text-xs tracking-[0.15em] uppercase font-body font-medium text-foreground border border-border">
                    {selected.kenteken}
                  </span>
                )}
              </div>

              {/* VWE Taxatie */}
              {selected.kenteken && (
                <div className="mb-10 p-6 bg-card border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground">
                      VWE Taxatie
                    </p>
                    {!taxaties[selected.id] && (
                      <button
                        onClick={() => fetchTaxatie(selected.id, selected.kenteken!)}
                        disabled={taxatieLoading[selected.id]}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-[9px] tracking-[0.15em] uppercase font-body font-medium bg-foreground text-background hover:bg-foreground/90 transition-all disabled:opacity-50"
                      >
                        {taxatieLoading[selected.id] ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Search className="w-3 h-3" />
                            Ophalen
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {taxaties[selected.id] ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider mb-1">Inkoopwaarde</p>
                        <p className="text-lg font-display font-bold text-foreground">{formatCurrency(taxaties[selected.id].inkoopwaarde)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider mb-1">Verkoopwaarde</p>
                        <p className="text-lg font-display font-bold text-foreground">{formatCurrency(taxaties[selected.id].verkoopwaarde)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider mb-1">Handelsprijs</p>
                        <p className="text-sm font-body text-foreground">{formatCurrency(taxaties[selected.id].handelsprijs)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-body text-muted-foreground uppercase tracking-wider mb-1">Nieuwprijs</p>
                        <p className="text-sm font-body text-foreground">{formatCurrency(taxaties[selected.id].nieuwprijs)}</p>
                      </div>
                    </div>
                  ) : !taxatieLoading[selected.id] ? (
                    <p className="text-xs font-body text-muted-foreground">
                      Klik op "Ophalen" om de taxatiewaarde op te vragen via VWE.
                    </p>
                  ) : null}
                </div>
              )}

              {/* Klantgegevens */}
              <div className="mb-10">
                <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-4">
                  Klantgegevens
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm font-body text-foreground">
                    <span className="text-muted-foreground">{selected.naam}</span>
                  </div>
                  <a href={`tel:${selected.telefoon}`} className="flex items-center gap-2 text-sm font-body text-foreground hover:text-muted-foreground transition-colors">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {selected.telefoon}
                  </a>
                  <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm font-body text-foreground hover:text-muted-foreground transition-colors">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    {selected.email}
                  </a>
                  <div className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(selected.created_at)}
                  </div>
                </div>
              </div>

              {/* Staat */}
              <div className="mb-10">
                <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-4">
                  Staat Voertuig
                </p>
                <div className="flex flex-wrap gap-2">
                  <BoolBadge value={selected.schadevrij} label="Schadevrij" />
                  <BoolBadge value={selected.onderhoudsboekje} label="Onderhoudsboekje" />
                  <BoolBadge value={selected.apk_geldig} label="APK geldig" />
                  <BoolBadge value={selected.rookvrij} label="Rookvrij" />
                  <BoolBadge value={selected.eerste_eigenaar} label="1e eigenaar" />
                </div>
              </div>

              {/* Opmerkingen */}
              {selected.opmerkingen && (
                <div className="mb-10">
                  <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-3">
                    Opmerkingen
                  </p>
                  <p className="text-sm font-body text-muted-foreground leading-relaxed bg-card p-4 border border-border">
                    {selected.opmerkingen}
                  </p>
                </div>
              )}

              {/* Foto's */}
              {selected.foto_urls && selected.foto_urls.length > 0 && (
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase font-body font-medium text-muted-foreground mb-4">
                    Foto's ({selected.foto_urls.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.foto_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="aspect-square bg-card overflow-hidden group relative"
                      >
                        <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="w-4 h-4 text-foreground" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
