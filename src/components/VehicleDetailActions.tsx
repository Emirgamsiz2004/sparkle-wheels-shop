import { useState } from "react";
import { CalendarDays, MessageCircle, Phone, RefreshCw } from "lucide-react";
import TradeInRequestModal from "@/components/TradeInRequestModal";
import VehicleBookingCard from "@/components/VehicleBookingCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  vehicleId?: string;
  merk: string;
  model: string;
  bouwjaar?: string | number | null;
  kenteken: string;
}

export default function VehicleDetailActions({ vehicleId, merk, model, bouwjaar, kenteken }: Props) {
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [tradeInOpen, setTradeInOpen] = useState(false);
  const vehicleName = `${merk} ${model}${bouwjaar ? ` (${bouwjaar})` : ""}`;

  return (
    <>
      <div className="space-y-3">
        <Button variant="primary" size="lg" className="w-full font-body uppercase" onClick={() => setAppointmentOpen(true)}>
          <CalendarDays /> Afspraak plannen
        </Button>
        <Button size="lg" className="w-full font-body uppercase" onClick={() => setTradeInOpen(true)}>
          <RefreshCw /> Inruilvoorstel aanvragen
        </Button>
        <div className="flex items-center justify-center gap-5 pt-1 text-xs text-muted-foreground">
          <a href="tel:+31717812525" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"><Phone className="h-3.5 w-3.5" /> Bellen</a>
          <span className="h-3 w-px bg-border" />
          <a href={`https://wa.me/31717812525?text=${encodeURIComponent(`Hallo, ik heb interesse in de ${vehicleName}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
        </div>
      </div>

      <Dialog open={appointmentOpen} onOpenChange={setAppointmentOpen}>
        <DialogContent className="border-border bg-background sm:max-w-md">
          <DialogHeader><DialogTitle className="sr-only">Afspraak plannen</DialogTitle></DialogHeader>
          <VehicleBookingCard feedId={vehicleId || ""} merk={merk} model={model} kenteken={kenteken} />
        </DialogContent>
      </Dialog>
      <TradeInRequestModal open={tradeInOpen} onOpenChange={setTradeInOpen} interestedVehicleId={vehicleId} interestedVehicle={vehicleName} />
    </>
  );
}