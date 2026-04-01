import { useState } from "react";
import { Vehicle, statusLabels, statusColors } from "@/types/vehicle";
import { ArrowLeft, ClipboardCheck, ChevronDown, Plus, FileText, MoreHorizontal, Banknote, Trash2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  vehicle: Vehicle;
  onStatusChange: (status: Vehicle["status"]) => void;
  onOpenProefrit: () => void;
  onOpenAanbetaling: () => void;
  onOpenKosten: () => void;
  onOpenTaak: () => void;
  onOpenVerkoop: () => void;
  onDelete: () => void;
}

const allStatuses: Vehicle["status"][] = [
  "inkoop", "in_behandeling", "te_koop", "consignatie", "gereserveerd", "verkocht", "reparatie_onderhoud",
];

const VehicleDetailHeader = ({ vehicle, onStatusChange, onOpenProefrit, onOpenAanbetaling, onOpenKosten, onOpenTaak, onOpenVerkoop, onDelete }: Props) => {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div className="space-y-3">
      <button onClick={() => navigate("/admin/voertuigen")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-lg font-medium text-foreground">
          {vehicle.merk} {vehicle.model} {vehicle.bouwjaar}
        </h1>
        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded border whitespace-nowrap ${statusColors[vehicle.status]}`}>
          {statusLabels[vehicle.status]}
        </span>
      </div>
      {vehicle.kenteken && (
        <span className="text-xs font-mono text-muted-foreground uppercase">{vehicle.kenteken}</span>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={onOpenProefrit} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-accent hover:border-accent transition-all active:scale-[0.97]">
          <ClipboardCheck className="w-3.5 h-3.5" /> Proefrit starten
        </button>

        {/* Status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-accent hover:border-accent transition-all active:scale-[0.97]">
              Status wijzigen <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="rounded-xl p-1">
            {allStatuses.map((s) => (
              <DropdownMenuItem key={s} onClick={() => onStatusChange(s)} className={`rounded-lg ${vehicle.status === s ? "bg-accent" : ""}`}>
                <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-lg border mr-2 ${statusColors[s]}`}>
                  {statusLabels[s]}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button onClick={onOpenVerkoop} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-green-600/40 text-green-500 rounded-xl hover:bg-green-500/10 hover:border-green-500/60 transition-all active:scale-[0.97]">
          <ShoppingCart className="w-3.5 h-3.5" /> Verkopen
        </button>

        <button onClick={onOpenKosten} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-accent hover:border-accent transition-all active:scale-[0.97]">
          <Plus className="w-3.5 h-3.5" /> Kosten toevoegen
        </button>

        <button onClick={onOpenTaak} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-accent hover:border-accent transition-all active:scale-[0.97]">
          <Plus className="w-3.5 h-3.5" /> Taak toevoegen
        </button>

        {/* Meer dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-border rounded-xl hover:bg-accent hover:border-accent transition-all active:scale-[0.97]">
              <MoreHorizontal className="w-3.5 h-3.5" /> Meer
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="rounded-xl p-1">
            <DropdownMenuItem onClick={onOpenAanbetaling} className="rounded-lg">
              <Banknote className="w-3.5 h-3.5 mr-2" /> Aanbetaling registreren
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-500 focus:text-red-500 rounded-lg">
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Verwijderen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border rounded-lg max-w-[calc(100vw-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-medium">Voertuig verwijderen?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Dit verwijdert {vehicle.merk} {vehicle.model} en alle bijbehorende data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md text-sm">Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 rounded-md text-sm">Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleDetailHeader;
