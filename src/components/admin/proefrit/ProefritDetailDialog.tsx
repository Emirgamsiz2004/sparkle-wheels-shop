import { TestDrive } from "@/hooks/useTestDrives";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { CheckCircle2, Clock, Car, XCircle, User, MapPin, CreditCard } from "lucide-react";

interface Props {
  testDrive: TestDrive;
  open: boolean;
  onClose: () => void;
}

const ProefritDetailDialog = ({ testDrive: td, open, onClose }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-medium">
            Proefrit — {td.voertuig_merk} {td.voertuig_model}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Voertuig */}
          <Section title="Voertuig" icon={Car}>
            <Row label="Merk / Model" value={`${td.voertuig_merk} ${td.voertuig_model}`} />
            <Row label="Kenteken" value={td.voertuig_kenteken || "—"} />
            {td.voertuig_bouwjaar && <Row label="Bouwjaar" value={String(td.voertuig_bouwjaar)} />}
          </Section>

          {/* Tijden */}
          <Section title="Rit gegevens" icon={Clock}>
            <Row label="Gestart" value={format(new Date(td.start_tijd), "d MMM yyyy, HH:mm", { locale: nl })} />
            {td.eind_tijd && <Row label="Beëindigd" value={format(new Date(td.eind_tijd), "d MMM yyyy, HH:mm", { locale: nl })} />}
            <Row label="KM voor" value={td.km_voor.toLocaleString("nl-NL")} />
            {td.km_na != null && <Row label="KM na" value={td.km_na.toLocaleString("nl-NL")} />}
            {td.km_na != null && <Row label="Gereden" value={`${(td.km_na - td.km_voor).toLocaleString("nl-NL")} km`} />}
          </Section>

          {/* Klant */}
          {td.customer && (
            <Section title="Klant" icon={User}>
              <Row label="Naam" value={`${td.customer.voornaam} ${td.customer.achternaam}`} />
              <Row label="E-mail" value={td.customer.email} />
              <Row label="Telefoon" value={td.customer.telefoon} />
              {td.customer.adres && <Row label="Adres" value={td.customer.adres} />}
              {td.customer.geboortedatum && <Row label="Geboortedatum" value={format(new Date(td.customer.geboortedatum), "d MMM yyyy", { locale: nl })} />}
            </Section>
          )}

          {/* Rijbewijs */}
          {td.customer?.rijbewijsnummer && (
            <Section title="Rijbewijs" icon={CreditCard}>
              <Row label="Nummer" value={td.customer.rijbewijsnummer} />
              <Row label="Categorie" value={td.customer.rijbewijscategorie || "B"} />
            </Section>
          )}

          {/* Opmerkingen */}
          {(td.opmerkingen_voor || td.opmerkingen_na) && (
            <Section title="Opmerkingen" icon={MapPin}>
              {td.opmerkingen_voor && <Row label="Voor rit" value={td.opmerkingen_voor} />}
              {td.opmerkingen_na && <Row label="Na rit" value={td.opmerkingen_na} />}
            </Section>
          )}

          {/* Handtekening */}
          {td.handtekening_data && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Handtekening</p>
              <img src={td.handtekening_data} alt="Handtekening" className="bg-white rounded-md border border-border max-h-24" />
            </div>
          )}

          {/* Juridisch */}
          {td.formulier_ingevuld_op && (
            <div className="text-[11px] text-muted-foreground/60 space-y-0.5 pt-2 border-t border-border">
              <p>Formulier ingevuld op: {format(new Date(td.formulier_ingevuld_op), "d MMM yyyy, HH:mm:ss", { locale: nl })}</p>
              {td.ip_adres && <p>IP-adres: {td.ip_adres}</p>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
    </div>
    <div className="space-y-1 pl-5">{children}</div>
  </div>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="text-foreground text-right">{value}</span>
  </div>
);

export default ProefritDetailDialog;
