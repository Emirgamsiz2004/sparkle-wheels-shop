import { useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { CalendarIcon, ArrowRight, Send } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const tijdsloten = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

const bookingSchema = z.object({
  naam: z.string().trim().min(1, "Vul uw naam in").max(100),
  telefoon: z.string().trim().min(1, "Vul uw telefoonnummer in").max(20),
  auto: z.string().trim().min(1, "Vul uw auto in").max(100),
  omschrijving: z.string().trim().min(1, "Beschrijf kort wat er moet gebeuren").max(1000),
});

interface BookingFormProps {
  dienst: string; // e.g. "onderhoud" or "detailing"
}

const BookingForm = ({ dienst }: BookingFormProps) => {
  const [formData, setFormData] = useState({ naam: "", telefoon: "", auto: "", omschrijving: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [date, setDate] = useState<Date>();
  const [tijd, setTijd] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = bookingSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const datumTekst = date ? format(date, "EEEE d MMMM yyyy", { locale: nl }) : "Nog niet gekozen";
    const tijdTekst = tijd || "Nog niet gekozen";

    const message = `Hallo, ik wil graag een afspraak maken voor ${dienst}.%0A%0ANaam: ${encodeURIComponent(result.data.naam)}%0ATelefoon: ${encodeURIComponent(result.data.telefoon)}%0AAuto: ${encodeURIComponent(result.data.auto)}%0AVoorkeursdatum: ${encodeURIComponent(datumTekst)}%0AVoorkeurstijd: ${encodeURIComponent(tijdTekst)}%0A%0A${encodeURIComponent(result.data.omschrijving)}`;
    window.open(`https://wa.me/31612693825?text=${message}`, "_blank");

    setSubmitted(true);
    toast({ title: "Afspraak aangevraagd!", description: "We bevestigen uw afspraak zo snel mogelijk via WhatsApp." });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 border-2 border-foreground flex items-center justify-center mb-4">
          <Send className="w-5 h-5 text-foreground" />
        </div>
        <p className="text-foreground font-display font-semibold mb-2">Bedankt voor uw aanvraag!</p>
        <p className="text-muted-foreground font-body text-sm font-light">We bevestigen uw afspraak zo snel mogelijk via WhatsApp.</p>
        <button
          onClick={() => { setSubmitted(false); setFormData({ naam: "", telefoon: "", auto: "", omschrijving: "" }); setDate(undefined); setTijd(""); }}
          className="mt-6 text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Nog een afspraak maken
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Naam *</label>
          <input type="text" name="naam" value={formData.naam} onChange={handleChange} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors" placeholder="Uw naam" />
          {errors.naam && <p className="text-xs text-red-400 mt-1 font-body">{errors.naam}</p>}
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Telefoon *</label>
          <input type="tel" name="telefoon" value={formData.telefoon} onChange={handleChange} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors" placeholder="06 - 0000 0000" />
          {errors.telefoon && <p className="text-xs text-red-400 mt-1 font-body">{errors.telefoon}</p>}
        </div>
      </div>
      <div>
        <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Auto (merk, model, bouwjaar) *</label>
        <input type="text" name="auto" value={formData.auto} onChange={handleChange} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors" placeholder="Bijv. Volkswagen Golf 2019" />
        {errors.auto && <p className="text-xs text-red-400 mt-1 font-body">{errors.auto}</p>}
      </div>

      {/* Datum & Tijd */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Voorkeursdatum</label>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "w-full bg-background border border-border px-4 py-3 text-sm font-body text-left flex items-center gap-2 focus:outline-none focus:border-foreground/30 transition-colors",
                  !date && "text-muted-foreground/50"
                )}
              >
                <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                {date ? format(date, "d MMMM yyyy", { locale: nl }) : "Kies een datum"}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setDateOpen(false); }}
                disabled={(d) => d < new Date() || d.getDay() === 0}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Voorkeurstijd</label>
          <div className="relative">
            <select
              value={tijd}
              onChange={(e) => setTijd(e.target.value)}
              className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground focus:outline-none focus:border-foreground/30 transition-colors appearance-none cursor-pointer"
            >
              <option value="" className="text-muted-foreground">Kies een tijd</option>
              {tijdsloten.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[10px] tracking-[0.2em] uppercase font-body font-medium text-muted-foreground mb-2">Wat moet er gebeuren? *</label>
        <textarea name="omschrijving" value={formData.omschrijving} onChange={handleChange} rows={3} className="w-full bg-background border border-border px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground/30 transition-colors resize-none" placeholder="Beschrijf kort wat u nodig heeft..." />
        {errors.omschrijving && <p className="text-xs text-red-400 mt-1 font-body">{errors.omschrijving}</p>}
      </div>

      <button type="submit" className="btn-public btn-primary-public group">
        <Send className="w-3.5 h-3.5" />
        Afspraak Maken
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </button>

      <p className="text-[10px] font-body text-muted-foreground/60 font-light">
        Uw aanvraag wordt via WhatsApp verstuurd. Wij bevestigen de afspraak zo snel mogelijk.
      </p>
    </form>
  );
};

export default BookingForm;
