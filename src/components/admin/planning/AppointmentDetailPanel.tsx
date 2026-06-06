import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Phone, MessageCircle, Pencil, Trash2, Plus, ListChecks, Receipt,
  ExternalLink, X, Car, User, CheckCircle2, Circle, ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Appointment, AppointmentStatus, PrijsRegel, typeLabels, typeColors } from "@/hooks/useAppointments";
import { useDiensten } from "@/hooks/useDiensten";
import { useMoneybird } from "@/hooks/useMoneybird";

interface Props {
  appointment: Appointment;
  onUpdate: (id: string, updates: Partial<Appointment>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit: () => void;
  onClose?: () => void;
  showClose?: boolean;
}

const MONEYBIRD_TYPES = new Set(["poetsbeurt", "onderhoud", "aflevering", "anders"]);

const fmtEuro = (cents: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);

const parseNotities = (raw: string | null | undefined) => {
  const text = raw || "";
  const m = text.match(/^Checklist:\n((?:•\s.*(?:\n|$))+)/);
  if (!m) return { items: [] as string[], rest: text };
  const items = m[1].split("\n").filter(Boolean).map((l) => l.replace(/^•\s/, "").trim()).filter(Boolean);
  return { items, rest: text.slice(m[0].length) };
};

const composeNotities = (items: string[], rest: string) => {
  const parts: string[] = [];
  if (items.length) parts.push("Checklist:\n" + items.map((i) => `• ${i}`).join("\n"));
  if (rest?.trim()) parts.push(rest.trim());
  return parts.join("\n\n");
};

const AppointmentDetailPanel = ({ appointment, onUpdate, onDelete, onEdit, onClose, showClose }: Props) => {
  const navigate = useNavigate();
  const { diensten } = useDiensten();
  const mb = useMoneybird();

  const [localStatus, setLocalStatus] = useState<AppointmentStatus>(appointment.status);
  const [statusSaving, setStatusSaving] = useState(false);

  const [checklist, setChecklist] = useState<string[]>([]);
  const [restNote, setRestNote] = useState("");
  const [newItem, setNewItem] = useState("");

  const [regels, setRegels] = useState<PrijsRegel[]>([]);
  const [newRegelLabel, setNewRegelLabel] = useState("");
  const [mbBusy, setMbBusy] = useState(false);

  useEffect(() => {
    setLocalStatus(appointment.status);
    const parsed = parseNotities(appointment.notities);
    setChecklist(parsed.items);
    setRestNote(parsed.rest);
    setNewItem("");
    setRegels(Array.isArray(appointment.prijs_regels) ? appointment.prijs_regels : []);
    setNewRegelLabel("");
  }, [appointment.id]);

  const dt = new Date(appointment.datum_tijd);
  const customerName = appointment.customer
    ? `${appointment.customer.voornaam} ${appointment.customer.achternaam}`.trim()
    : appointment.klant_naam_los || null;
  const phone = appointment.customer?.telefoon || appointment.klant_telefoon_los || appointment.aanvrager_telefoon || "";
  const waNumber = (() => {
    if (!phone) return "";
    let n = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
    if (n.startsWith("00")) n = n.slice(2);
    if (n.startsWith("0")) n = "31" + n.slice(1);
    return n;
  })();
  const vehLabel = appointment.vehicle
    ? `${appointment.vehicle.merk} ${appointment.vehicle.model}`
    : appointment.voertuig_klant_omschrijving || null;
  const kenteken = appointment.vehicle?.kenteken || appointment.voertuig_klant_kenteken || appointment.aanvrager_kenteken || "";

  // Countdown
  const now = new Date();
  const diffMs = dt.getTime() - now.getTime();
  const absMin = Math.round(Math.abs(diffMs) / 60000);
  const past = diffMs < 0;
  let countdown = "";
  if (absMin < 60) countdown = past ? `${absMin} min geleden` : `over ${absMin} min`;
  else if (absMin < 60 * 24) {
    const h = Math.round(absMin / 60);
    countdown = past ? `${h} uur geleden` : `over ${h} uur`;
  } else {
    const d = Math.round(absMin / (60 * 24));
    countdown = past ? `${d} dagen geleden` : `over ${d} dagen`;
  }

  // Status
  const setStatus = async (s: AppointmentStatus) => {
    if (localStatus === s || statusSaving) return;
    const prev = localStatus;
    setLocalStatus(s);
    setStatusSaving(true);
    try {
      await onUpdate(appointment.id, { status: s });
      toast.success("Status bijgewerkt");
    } catch {
      setLocalStatus(prev);
    } finally {
      setStatusSaving(false);
    }
  };

  // Checklist
  const persistNotities = async (items: string[], rest: string) => {
    await onUpdate(appointment.id, { notities: composeNotities(items, rest) || null });
  };
  const addChecklistItem = async () => {
    const v = newItem.trim();
    if (!v) return;
    const next = [...checklist, v];
    setChecklist(next);
    setNewItem("");
    await persistNotities(next, restNote);
  };
  const removeChecklistItem = async (i: number) => {
    const next = checklist.filter((_, idx) => idx !== i);
    setChecklist(next);
    await persistNotities(next, restNote);
  };
  const toggleCheckItem = async (i: number) => {
    const next = checklist.map((item, idx) => {
      if (idx !== i) return item;
      const isDone = item.startsWith("[x] ");
      return isDone ? item.replace("[x] ", "") : `[x] ${item}`;
    });
    setChecklist(next);
    await persistNotities(next, restNote);
  };

  // Prijsregels
  const totaal = useMemo(
    () => regels.reduce((s, r) => s + (Number(r.aantal) || 0) * (Number(r.prijs_cent) || 0), 0),
    [regels]
  );

  const persistRegels = async (next: PrijsRegel[]) => {
    const tot = next.reduce((s, r) => s + (Number(r.aantal) || 0) * (Number(r.prijs_cent) || 0), 0);
    await onUpdate(appointment.id, {
      prijs_regels: next as any,
      totaal_prijs_cent: tot || null,
    } as any);
  };

  const addRegelFromDienst = async (naam: string) => {
    const d = diensten.find((x) => x.naam === naam);
    const next = [
      ...regels,
      { omschrijving: naam, aantal: 1, prijs_cent: d?.standaard_prijs_cent ?? 0, btw_pct: 21 },
    ];
    setRegels(next);
    await persistRegels(next);
  };

  const addCustomRegel = async () => {
    const naam = newRegelLabel.trim();
    if (!naam) return;
    const next: PrijsRegel[] = [...regels, { omschrijving: naam, aantal: 1, prijs_cent: 0, btw_pct: 21 }];
    setRegels(next);
    setNewRegelLabel("");
    await persistRegels(next);
  };

  const updateRegel = (i: number, patch: Partial<PrijsRegel>) => {
    setRegels((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const removeRegel = async (i: number) => {
    const next = regels.filter((_, idx) => idx !== i);
    setRegels(next);
    await persistRegels(next);
  };

  const dienstenInitChips = appointment.diensten || [];
  const dienstenNietInRegels = dienstenInitChips.filter(
    (d) => !regels.some((r) => r.omschrijving.toLowerCase() === d.toLowerCase())
  );

  // Moneybird
  const canInvoice = MONEYBIRD_TYPES.has(appointment.type) && regels.length > 0 && totaal > 0;
  const alreadyInvoiced = !!appointment.moneybird_invoice_id;

  const createInvoice = async () => {
    if (!canInvoice || alreadyInvoiced || mbBusy) return;
    setMbBusy(true);
    try {
      const details_attributes = regels.map((r) => ({
        description: r.omschrijving + (kenteken && regels.indexOf(r) === 0 ? ` — ${kenteken}` : ""),
        amount: String(r.aantal || 1),
        price: ((r.prijs_cent || 0) / 100).toFixed(2),
      }));

      const [firstname, ...restName] = (customerName || "Klant").split(" ");
      const lastname = restName.join(" ");
      const email =
        appointment.customer?.email || appointment.klant_email_los || appointment.aanvrager_email || undefined;

      const contact_payload = {
        company_name: customerName || "Klant",
        firstname,
        lastname,
        email,
        phone,
      };

      const reference = [kenteken, format(dt, "yyyy-MM-dd"), typeLabels[appointment.type]]
        .filter(Boolean)
        .join(" · ");

      const res = await mb.invoke("create_wizard_invoice", {
        contact_payload,
        reference,
        invoice_date: format(new Date(), "yyyy-MM-dd"),
        prices_are_incl_tax: true,
        details_attributes,
      });

      const invoiceId = res?.invoice?.id || res?.id;
      const invoiceUrl = res?.moneybird_url || (invoiceId
        ? `https://moneybird.com/sales_invoices/${invoiceId}`
        : null);

      if (invoiceId) {
        await onUpdate(appointment.id, {
          moneybird_invoice_id: String(invoiceId),
          moneybird_invoice_url: invoiceUrl || null,
        } as any);
        toast.success("Concept-factuur aangemaakt in Moneybird");
      } else {
        toast.error("Factuur aangemaakt maar geen ID ontvangen");
      }
    } catch {
      // toast already handled by useMoneybird
    } finally {
      setMbBusy(false);
    }
  };

  const waMessage = encodeURIComponent(
    `Goedendag${customerName ? " " + customerName.split(" ")[0] : ""}, ` +
      `bevestiging van uw afspraak op ${format(dt, "d MMMM yyyy", { locale: nl })} om ${format(dt, "HH:mm")}` +
      `${vehLabel ? ` voor de ${vehLabel}` : ""} bij Platin Automotive.`
  );

  // ─── Render ───
  return (
    <div className="flex flex-col bg-background border border-border rounded-[3px] overflow-hidden">
      {/* HEADER */}
      <div className="relative px-4 pt-4 pb-3 border-b border-border">
        {showClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-6 w-6 inline-flex items-center justify-center rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Sluiten"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <div className="flex items-center gap-2 mb-1.5 pr-7">
          <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-[3px] border text-[10px] font-semibold uppercase tracking-wider", typeColors[appointment.type])}>
            {typeLabels[appointment.type]}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">· {countdown}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-foreground tabular-nums tracking-tight">{format(dt, "HH:mm")}</span>
          {appointment.eind_datum_tijd && (
            <span className="text-sm text-muted-foreground tabular-nums">– {format(new Date(appointment.eind_datum_tijd), "HH:mm")}</span>
          )}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground capitalize">
          {format(dt, "EEEE d MMMM yyyy", { locale: nl })}
        </div>
      </div>

      {/* BODY */}
      <div className="px-4 py-3 space-y-4">
        {/* Klant + voertuig */}
        {(customerName || vehLabel) && (
          <div className="space-y-2">
            {customerName && (
              <button
                onClick={() => appointment.customer && navigate(`/admin/klanten/${appointment.customer.id}`)}
                disabled={!appointment.customer}
                className="w-full flex items-center gap-2 text-left disabled:cursor-default group"
              >
                <div className="w-6 h-6 rounded-[3px] bg-accent/40 flex items-center justify-center shrink-0">
                  <User className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-sm text-foreground truncate">{customerName}</span>
                {phone && <span className="text-[11px] text-muted-foreground ml-auto tabular-nums">{phone}</span>}
              </button>
            )}
            {vehLabel && (
              <button
                onClick={() => appointment.vehicle && navigate(`/admin/voertuigen/${appointment.vehicle.id}`)}
                disabled={!appointment.vehicle}
                className="w-full flex items-center gap-2 text-left disabled:cursor-default group"
              >
                <div className="w-6 h-6 rounded-[3px] bg-accent/40 flex items-center justify-center shrink-0">
                  <Car className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-sm text-foreground truncate">{vehLabel}</span>
                {kenteken && (
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto tracking-wider uppercase">{kenteken}</span>
                )}
              </button>
            )}
          </div>
        )}

        {/* Werkzaamheden / checklist */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <ListChecks className="w-3 h-3" /> Te doen
          </div>
          {checklist.length > 0 && (
            <div className="space-y-0.5">
              {checklist.map((item, idx) => {
                const done = item.startsWith("[x] ");
                const text = done ? item.replace("[x] ", "") : item;
                return (
                  <div key={idx} className="group flex items-center gap-1.5">
                    <button
                      onClick={() => toggleCheckItem(idx)}
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Circle className="w-3.5 h-3.5" />}
                    </button>
                    <input
                      value={text}
                      onChange={(e) => {
                        const val = done ? `[x] ${e.target.value}` : e.target.value;
                        setChecklist((p) => p.map((x, i) => (i === idx ? val : x)));
                      }}
                      onBlur={() => persistNotities(checklist, restNote)}
                      className={cn(
                        "flex-1 bg-transparent text-[12px] outline-none border-none px-0 py-0.5",
                        done ? "text-muted-foreground line-through" : "text-foreground"
                      )}
                    />
                    <button
                      onClick={() => removeChecklistItem(idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChecklistItem(); } }}
              placeholder="Punt toevoegen…"
              className="flex-1 bg-accent/30 border border-border rounded-[3px] px-2 py-1 text-[12px] outline-none focus:border-foreground/30 placeholder:text-muted-foreground/50"
            />
            <button
              onClick={addChecklistItem}
              disabled={!newItem.trim()}
              className="inline-flex items-center justify-center h-7 w-7 rounded-[3px] border border-border bg-accent/30 hover:bg-accent/60 disabled:opacity-40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Diensten & prijs */}
        {MONEYBIRD_TYPES.has(appointment.type) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                <Receipt className="w-3 h-3" /> Diensten & prijs
              </div>
              {totaal > 0 && (
                <span className="text-[11px] font-semibold text-foreground tabular-nums">{fmtEuro(totaal)}</span>
              )}
            </div>

            {regels.length > 0 && (
              <div className="space-y-1">
                {regels.map((r, idx) => (
                  <div key={idx} className="group grid grid-cols-[1fr_40px_80px_20px] gap-1 items-center">
                    <input
                      value={r.omschrijving}
                      onChange={(e) => updateRegel(idx, { omschrijving: e.target.value })}
                      onBlur={() => persistRegels(regels)}
                      className="bg-transparent text-[12px] text-foreground outline-none border-none px-0 py-0 min-w-0"
                    />
                    <input
                      type="number"
                      min={1}
                      value={r.aantal}
                      onChange={(e) => updateRegel(idx, { aantal: Number(e.target.value) || 1 })}
                      onBlur={() => persistRegels(regels)}
                      className="bg-accent/30 border border-border rounded-[3px] px-1 py-0.5 text-[11px] text-foreground outline-none text-center tabular-nums"
                    />
                    <div className="flex items-center gap-0.5 bg-accent/30 border border-border rounded-[3px] px-1.5 py-0.5">
                      <span className="text-[10px] text-muted-foreground">€</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={r.prijs_cent ? (r.prijs_cent / 100).toString() : ""}
                        placeholder="0"
                        onChange={(e) => updateRegel(idx, { prijs_cent: Math.round((Number(e.target.value) || 0) * 100) })}
                        onBlur={() => persistRegels(regels)}
                        className="bg-transparent text-[11px] text-foreground outline-none w-full tabular-nums text-right"
                      />
                    </div>
                    <button
                      onClick={() => removeRegel(idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {dienstenNietInRegels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {dienstenNietInRegels.map((d) => (
                  <button
                    key={d}
                    onClick={() => addRegelFromDienst(d)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border border-dashed border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" /> {d}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <input
                value={newRegelLabel}
                onChange={(e) => setNewRegelLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomRegel(); } }}
                placeholder="Handmatige regel…"
                className="flex-1 bg-accent/30 border border-border rounded-[3px] px-2 py-1 text-[12px] outline-none focus:border-foreground/30 placeholder:text-muted-foreground/50"
              />
              <button
                onClick={addCustomRegel}
                disabled={!newRegelLabel.trim()}
                className="inline-flex items-center justify-center h-7 w-7 rounded-[3px] border border-border bg-accent/30 hover:bg-accent/60 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Extra notitie */}
        {restNote.trim() && (
          <div className="text-[12px] text-foreground/80 bg-accent/20 rounded-[3px] p-2.5 border-l-2 border-foreground/20 whitespace-pre-wrap leading-relaxed">
            {restNote}
          </div>
        )}

        {/* Status */}
        <div className="inline-flex w-full rounded-[3px] border border-border bg-accent/20 p-0.5">
          {[
            { v: "gepland" as AppointmentStatus, label: "Open", active: "bg-foreground text-background" },
            { v: "voltooid" as AppointmentStatus, label: "Klaar", active: "bg-muted-foreground text-background" },
            { v: "geannuleerd" as AppointmentStatus, label: "No-show", active: "bg-orange-500/80 text-white" },
          ].map(({ v, label, active }) => {
            const isActive = localStatus === v;
            return (
              <button
                key={v}
                disabled={statusSaving}
                onClick={() => setStatus(v)}
                className={cn(
                  "flex-1 py-1 rounded-[2px] text-[11px] font-medium transition-all disabled:opacity-70",
                  isActive ? active : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Acties: Bellen / WhatsApp */}
        <div className="grid grid-cols-2 gap-2">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center justify-center gap-1.5 py-1.5 rounded-[3px] border border-border bg-accent/20 text-xs hover:bg-accent/40 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Bellen
            </a>
          ) : <span />}
          {waNumber ? (
            <a
              href={`https://wa.me/${waNumber}?text=${waMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 py-1.5 rounded-[3px] border border-border bg-accent/20 text-xs hover:bg-accent/40 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          ) : <span />}
        </div>

        {/* Moneybird */}
        {MONEYBIRD_TYPES.has(appointment.type) && (
          alreadyInvoiced ? (
            <a
              href={appointment.moneybird_invoice_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-[3px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs hover:bg-emerald-500/15 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" /> Factuur in Moneybird <ArrowUpRight className="w-3 h-3" />
            </a>
          ) : (
            <button
              onClick={createInvoice}
              disabled={!canInvoice || mbBusy}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-[3px] bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={!canInvoice ? "Voeg eerst diensten + prijs toe" : ""}
            >
              <Receipt className="w-3.5 h-3.5" />
              {mbBusy ? "Bezig…" : "Concept-factuur in Moneybird"}
            </button>
          )
        )}
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-accent/10 mt-auto">
        <button
          onClick={onEdit}
          className="px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 rounded-[3px] hover:bg-accent/40"
        >
          <Pencil className="w-3 h-3" /> Bewerken
        </button>
        <button
          onClick={async () => {
            if (confirm("Afspraak verwijderen?")) {
              await onDelete(appointment.id);
              onClose?.();
            }
          }}
          className="px-2 py-1 text-[11px] text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1.5 rounded-[3px] hover:bg-red-500/10"
        >
          <Trash2 className="w-3 h-3" /> Verwijderen
        </button>
      </div>
    </div>
  );
};

export default AppointmentDetailPanel;
