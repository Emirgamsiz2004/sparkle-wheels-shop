import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Search, Car, User, ClipboardCheck, CalendarDays, ShoppingCart, Plus, X } from "lucide-react";
import { formatKenteken } from "@/lib/kenteken";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  link: string;
}

interface SearchCategory {
  label: string;
  icon: typeof Car;
  results: SearchResult[];
  moduleLink: string;
}

const statusColors: Record<string, string> = {
  inkoop: "bg-blue-100 text-blue-700",
  "in behandeling": "bg-yellow-100 text-yellow-700",
  "te koop": "bg-green-100 text-green-700",
  consignatie: "bg-purple-100 text-purple-700",
  verkocht: "bg-muted text-muted-foreground",
  gepland: "bg-blue-100 text-blue-700",
  actief: "bg-green-100 text-green-700",
  afgerond: "bg-muted text-muted-foreground",
  nieuw: "bg-blue-100 text-blue-700",
  interesse: "bg-yellow-100 text-yellow-700",
  afgewezen: "bg-red-100 text-red-700",
};

const quickActions = [
  { label: "Voertuig toevoegen", icon: Car, link: "/admin/voertuigen/nieuw" },
  { label: "Proefrit starten", icon: ClipboardCheck, link: "/admin/proefriten" },
  { label: "Klant toevoegen", icon: User, link: "/admin/klanten" },
  { label: "Afspraak plannen", icon: CalendarDays, link: "/admin/planning" },
];

const RECENT_KEY = "platin-admin-recent-pages";

function getRecentPages(): { label: string; link: string }[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 5);
  } catch { return []; }
}

export function addRecentPage(label: string, link: string) {
  try {
    const pages = getRecentPages().filter(p => p.link !== link);
    pages.unshift({ label, link });
    localStorage.setItem(RECENT_KEY, JSON.stringify(pages.slice(0, 10)));
  } catch {}
}

function looksLikeKenteken(q: string): boolean {
  const clean = q.replace(/[-\s]/g, "").toUpperCase();
  return clean.length >= 4 && /^[A-Z0-9]+$/.test(clean) && /[A-Z]/.test(clean) && /\d/.test(clean);
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
    if (!open) { setQuery(""); setCategories([]); }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setCategories([]); return; }
    setLoading(true);

    const cleanQ = q.trim().toLowerCase();
    const kentekenQ = q.replace(/[-\s]/g, "").toUpperCase();
    const isKenteken = looksLikeKenteken(q);

    try {
      // Parallel queries
      const [vehiclesRes, customersRes, testDrivesRes, appointmentsRes, inkoopRes] = await Promise.all([
        supabase.from("vehicles").select("id, merk, model, bouwjaar, kenteken, kleur, status, verkoopprijs, kostprijs, inkoopprijs, totale_kosten").limit(20),
        supabase.from("customers").select("id, voornaam, achternaam, telefoon, email").limit(20),
        supabase.from("test_drives").select("id, voertuig_merk, voertuig_model, voertuig_kenteken, status, start_tijd, customer_id, test_drive_customers(voornaam, achternaam)").limit(20),
        supabase.from("appointments").select("id, type, datum_tijd, status, onderwerp, vehicle_id, vehicles(merk, model, kenteken)").limit(20),
        supabase.from("inkoop_candidates").select("id, merk, model, vraagprijs, interesse_status, bron").limit(20),
      ]);

      const cats: SearchCategory[] = [];

      // Vehicles
      const vehicles = (vehiclesRes.data || []).filter(v => {
        const kentekenClean = (v.kenteken || "").replace(/[-\s]/g, "").toUpperCase();
        const searchable = `${v.merk} ${v.model} ${v.bouwjaar || ""} ${v.kleur || ""} ${v.kenteken || ""}`.toLowerCase();
        if (isKenteken && kentekenClean.includes(kentekenQ)) return true;
        return searchable.includes(cleanQ);
      }).slice(0, 5);

      if (vehicles.length > 0) {
        cats.push({
          label: "Voertuigen",
          icon: Car,
          moduleLink: "/admin/voertuigen",
          results: vehicles.map(v => {
            const kostprijs = (v.inkoopprijs || 0) + (v.totale_kosten || 0);
            const marge = (v.verkoopprijs || 0) - kostprijs;
            return {
              id: v.id,
              title: `${v.merk} ${v.model} ${v.bouwjaar || ""}`,
              subtitle: `${v.kenteken ? formatKenteken(v.kenteken) : "—"} · Marge €${marge.toLocaleString("nl-NL")}`,
              badge: v.status || undefined,
              badgeColor: statusColors[v.status || ""] || "bg-muted text-muted-foreground",
              link: `/admin/voertuigen/${v.id}`,
            };
          }),
        });
      }

      // Customers
      const customers = (customersRes.data || []).filter(c => {
        const searchable = `${c.voornaam} ${c.achternaam} ${c.telefoon} ${c.email}`.toLowerCase();
        return searchable.includes(cleanQ);
      }).slice(0, 5);

      if (customers.length > 0) {
        cats.push({
          label: "Klanten",
          icon: User,
          moduleLink: "/admin/klanten",
          results: customers.map(c => ({
            id: c.id,
            title: `${c.voornaam} ${c.achternaam}`,
            subtitle: c.telefoon || c.email,
            link: `/admin/klanten/${c.id}`,
          })),
        });
      }

      // Test drives
      const drives = (testDrivesRes.data || []).filter(td => {
        const cust = (td as any).test_drive_customers;
        const custName = cust ? `${cust.voornaam} ${cust.achternaam}` : "";
        const searchable = `${custName} ${td.voertuig_merk || ""} ${td.voertuig_model || ""} ${td.voertuig_kenteken || ""}`.toLowerCase();
        const kentekenClean = (td.voertuig_kenteken || "").replace(/[-\s]/g, "").toUpperCase();
        if (isKenteken && kentekenClean.includes(kentekenQ)) return true;
        return searchable.includes(cleanQ);
      }).slice(0, 5);

      if (drives.length > 0) {
        cats.push({
          label: "Proefriten",
          icon: ClipboardCheck,
          moduleLink: "/admin/proefriten",
          results: drives.map(td => {
            const cust = (td as any).test_drive_customers;
            const custName = cust ? `${cust.voornaam} ${cust.achternaam}` : "Onbekend";
            return {
              id: td.id,
              title: `${custName}`,
              subtitle: `${td.voertuig_merk || ""} ${td.voertuig_model || ""} · ${new Date(td.start_tijd).toLocaleDateString("nl-NL")}`,
              badge: td.status,
              badgeColor: statusColors[td.status] || "bg-muted text-muted-foreground",
              link: `/admin/proefriten`,
            };
          }),
        });
      }

      // Appointments
      const appts = (appointmentsRes.data || []).filter(a => {
        const v = (a as any).vehicles;
        const searchable = `${a.onderwerp || ""} ${a.type} ${v?.merk || ""} ${v?.model || ""} ${v?.kenteken || ""}`.toLowerCase();
        return searchable.includes(cleanQ);
      }).slice(0, 5);

      if (appts.length > 0) {
        cats.push({
          label: "Planning",
          icon: CalendarDays,
          moduleLink: "/admin/planning",
          results: appts.map(a => {
            const v = (a as any).vehicles;
            const dt = new Date(a.datum_tijd);
            return {
              id: a.id,
              title: `${a.type}${a.onderwerp ? ` — ${a.onderwerp}` : ""}`,
              subtitle: `${v ? `${v.merk} ${v.model}` : "—"} · ${dt.toLocaleDateString("nl-NL")} ${dt.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}`,
              badge: a.status,
              badgeColor: statusColors[a.status] || "bg-muted text-muted-foreground",
              link: `/admin/planning`,
            };
          }),
        });
      }

      // Inkoop
      const inkoop = (inkoopRes.data || []).filter(i => {
        const searchable = `${i.merk} ${i.model} ${i.bron}`.toLowerCase();
        return searchable.includes(cleanQ);
      }).slice(0, 5);

      if (inkoop.length > 0) {
        cats.push({
          label: "Inkoop shortlist",
          icon: ShoppingCart,
          moduleLink: "/admin/inkoop",
          results: inkoop.map(i => ({
            id: i.id,
            title: `${i.merk} ${i.model}`,
            subtitle: `€${(i.vraagprijs || 0).toLocaleString("nl-NL")} · ${i.bron}`,
            badge: i.interesse_status || undefined,
            badgeColor: statusColors[i.interesse_status || ""] || "bg-muted text-muted-foreground",
            link: `/admin/inkoop`,
          })),
        });
      }

      // If kenteken search, sort vehicles first
      if (isKenteken) {
        cats.sort((a, b) => (a.label === "Voertuigen" ? -1 : b.label === "Voertuigen" ? 1 : 0));
      }

      setCategories(cats);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 250);
  };

  const handleSelect = (link: string) => {
    setOpen(false);
    navigate(link);
  };

  const recentPages = getRecentPages();
  const showDefault = query.trim().length < 2;

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside (mobile dropdown)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const searchContent = (
    <>
      {/* Search input */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
          placeholder="Zoek op kenteken, klant, voertuig..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground font-['DM_Sans']"
        />
        {query && (
          <button onClick={() => { setQuery(""); setCategories([]); inputRef.current?.focus(); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
        <button onClick={() => setOpen(false)} className="text-[11px] text-muted-foreground border border-border rounded-[3px] px-1.5 py-0.5 hover:bg-muted">
          ESC
        </button>
      </div>

      {/* Results / Default */}
      <div className="max-h-[60vh] overflow-y-auto">
        <AnimatePresence mode="wait">
          {showDefault ? (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-4 space-y-5"
            >
              <div>
                <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground/60 mb-2 font-['Poppins']">Snelkoppelingen</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map(a => (
                    <button
                      key={a.link}
                      onClick={() => handleSelect(a.link)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-[3px] border border-border bg-muted/30 hover:bg-muted text-[13px] text-foreground transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-[3px] bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <a.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="font-['DM_Sans']">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {recentPages.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground/60 mb-2 font-['Poppins']">Recent bezocht</p>
                  <div className="space-y-0.5">
                    {recentPages.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelect(p.link)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-[3px] text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="font-['DM_Sans']">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground/30" />
            </motion.div>
          ) : categories.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
              <p className="text-sm text-muted-foreground font-['DM_Sans']">Geen resultaten gevonden voor '{query}'</p>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="py-2">
              {categories.map((cat, ci) => (
                <div key={cat.label} className={ci > 0 ? "border-t border-border" : ""}>
                  <div className="px-4 py-2 flex items-center gap-2">
                    <cat.icon className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground/60 font-['Poppins']">{cat.label}</p>
                  </div>
                  <div className="px-2">
                    {cat.results.map(r => (
                      <button
                        key={r.id}
                        onClick={() => handleSelect(r.link)}
                        className="flex items-center gap-3 w-full px-3 py-2 rounded-[3px] hover:bg-muted/50 transition-colors text-left group"
                      >
                        <div className="w-7 h-7 rounded-[3px] bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-accent">
                          <cat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-foreground truncate font-['DM_Sans']">{r.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate font-['DM_Sans']">{r.subtitle}</p>
                        </div>
                        {r.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-[3px] font-medium capitalize flex-shrink-0 ${r.badgeColor}`}>
                            {r.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {cat.results.length >= 5 && (
                    <button
                      onClick={() => handleSelect(cat.moduleLink)}
                      className="w-full px-4 py-2 text-[12px] text-primary hover:text-primary/80 transition-colors text-left font-['DM_Sans']"
                    >
                      Bekijk alle resultaten in {cat.label} →
                    </button>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return (
    <>
      {/* Mobile: fixed overlay dropdown */}
      <div ref={containerRef} className="lg:hidden">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center w-8 h-8 rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {open && !isDesktop && (
            <>
              {/* Backdrop — light transparent overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[69]"
                onClick={() => setOpen(false)}
              />
              {/* Dropdown panel pinned below header */}
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="fixed left-2 right-2 top-[52px] bg-card border border-border rounded-[6px] shadow-2xl z-[70] overflow-hidden max-h-[calc(100vh-64px)]"
              >
                {searchContent}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: dialog modal */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-[3px] border border-border bg-muted/50 hover:bg-muted text-muted-foreground text-[13px] transition-colors min-w-[280px]"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left truncate">Zoek op kenteken, klant, voertuig...</span>
        <kbd className="inline-flex items-center gap-0.5 rounded-[3px] border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          ⌘K
        </kbd>
      </button>
      {isDesktop && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[640px] p-0 gap-0 rounded-[3px] overflow-hidden [&>button]:hidden">
            {searchContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
