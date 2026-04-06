import { useState } from "react";
import { Vehicle, statusLabels, statusColors } from "@/types/vehicle";
import { ArrowLeft, ClipboardCheck, ChevronDown, Plus, MoreHorizontal, Banknote, Trash2, ShoppingCart, FileText, CalendarPlus, Receipt, ListChecks, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
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
  onOpenReservering?: () => void;
  onOpenAfspraak?: (type?: string) => void;
  onDelete: () => void;
}

const allStatuses: Vehicle["status"][] = [
  "inkoop", "in_behandeling", "te_koop", "consignatie", "gereserveerd", "verkocht", "reparatie_onderhoud",
];

const btnCls = "inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border border-border rounded-md hover:bg-accent hover:border-accent transition-colors active:scale-[0.97] text-foreground min-h-[36px]";

const VehicleDetailHeader = ({ vehicle, onStatusChange, onOpenProefrit, onOpenAanbetaling, onOpenKosten, onOpenTaak, onOpenVerkoop, onOpenReservering, onOpenAfspraak, onDelete }: Props) => {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleGenerateDoc = (type: string) => {
    if (type === "proefrit") {
      onOpenProefrit();
    }
  };

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
      <div className="flex items-center gap-2 flex-wrap -mx-0.5">
        {/* Quick-add (+) dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center justify-center w-9 h-9 text-xs font-medium border border-border rounded-md hover:bg-accent hover:border-accent transition-colors active:scale-[0.97] text-foreground min-h-[36px]">
              <Plus className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-1">
            <DropdownMenuItem onClick={onOpenKosten}>
              <Receipt className="w-3.5 h-3.5 mr-2" /> Kosten toevoegen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenAanbetaling}>
              <Banknote className="w-3.5 h-3.5 mr-2" /> Factuur toevoegen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenTaak}>
              <ListChecks className="w-3.5 h-3.5 mr-2" /> Taak toevoegen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button onClick={onOpenProefrit} className={btnCls}>
          <ClipboardCheck className="w-3.5 h-3.5" /> Proefrit
        </button>

        {vehicle.status === "gereserveerd" ? (
          <button onClick={onOpenVerkoop} className={btnCls + " !border-emerald-500/30 !text-emerald-400"}>
            <ShoppingCart className="w-3.5 h-3.5" /> Verkoop afronden
          </button>
        ) : (
          <button onClick={onOpenVerkoop} className={btnCls}>
            <ShoppingCart className="w-3.5 h-3.5" /> Verkopen
          </button>
        )}

        {onOpenAfspraak && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={btnCls}>
                <CalendarPlus className="w-3.5 h-3.5" /> Afspraak <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="p-1 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
              {[
                { label: "Bezichtiging", type: "bezichtiging" },
                { label: "Proefrit", type: "proefrit" },
                { label: "Aflevering", type: "aflevering" },
                { label: "Onderhoud/Reparatie", type: "onderhoud" },
                { label: "Overig", type: "overig" },
              ].map((opt) => (
                <DropdownMenuItem key={opt.type} onClick={() => onOpenAfspraak(opt.type)}>
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={btnCls}>
              Status <ChevronDown className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-1 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
            {allStatuses.map((s) => (
              <DropdownMenuItem key={s} onClick={() => onStatusChange(s)} className={`flex items-center gap-2 ${vehicle.status === s ? "bg-accent/50" : ""}`}>
                <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded border ${statusColors[s]}`}>
                  {statusLabels[s]}
                </span>
                {vehicle.status === s && <span className="text-[10px] text-muted-foreground ml-auto">✓</span>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Meer dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={btnCls}>
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-1">
            {onOpenReservering && (
              <DropdownMenuItem onClick={onOpenReservering}>
                <Banknote className="w-3.5 h-3.5 mr-2" /> Reserveren
              </DropdownMenuItem>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FileText className="w-3.5 h-3.5 mr-2" /> Document genereren
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="p-1">
                <DropdownMenuItem onClick={() => handleGenerateDoc("proefrit")}>
                  Proefrit overeenkomst
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleGenerateDoc("vrijwaring")}>
                  Vrijwaring
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-500 focus:text-red-500">
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Verwijderen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border max-w-[calc(100vw-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-medium">Voertuig verwijderen?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Dit verwijdert {vehicle.merk} {vehicle.model} en alle bijbehorende data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-sm">Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-sm">Verwijderen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleDetailHeader;
