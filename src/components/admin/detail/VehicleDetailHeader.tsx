import { Vehicle, statusLabels, statusColors } from "@/types/vehicle";
import { ArrowLeft, ClipboardCheck, ChevronDown, ShoppingCart, CalendarPlus, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  vehicle: Vehicle;
  onStatusChange: (status: Vehicle["status"]) => void;
  onOpenProefrit: () => void;
  onOpenKosten: () => void;
  onOpenVerkoop: () => void;
  onOpenAfspraak?: (type?: string) => void;
}

const allStatuses: Vehicle["status"][] = [
  "inkoop", "in_behandeling", "te_koop", "consignatie", "gereserveerd", "verkocht", "reparatie_onderhoud",
];

const statusDots: Record<Vehicle["status"], string> = {
  inkoop: "bg-zinc-400",
  in_behandeling: "bg-yellow-500",
  te_koop: "bg-emerald-500",
  consignatie: "bg-orange-500",
  gereserveerd: "bg-blue-500",
  verkocht: "bg-purple-500",
  reparatie_onderhoud: "bg-red-500",
};

const btnCls = "inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border border-border rounded-md hover:bg-accent hover:border-accent transition-colors active:scale-[0.97] text-foreground min-h-[36px]";

const VehicleDetailHeader = ({ vehicle, onStatusChange, onOpenProefrit, onOpenKosten, onOpenVerkoop, onOpenAfspraak }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <button onClick={() => navigate("/admin/voertuigen")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Terug
      </button>

      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-base font-medium text-foreground leading-tight">
          {vehicle.merk} {vehicle.model} {vehicle.bouwjaar}
        </h1>
        {vehicle.kenteken && (
          <span className="text-[11px] font-mono text-muted-foreground uppercase">{vehicle.kenteken}</span>
        )}
        <span className={`inline-flex items-center justify-center min-w-[80px] h-5 px-1.5 text-[10px] font-medium rounded border whitespace-nowrap leading-none ${statusColors[vehicle.status]}`}>
          {statusLabels[vehicle.status]}
        </span>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap -mx-0.5">
        <button onClick={onOpenKosten} className={btnCls}>
          <Receipt className="w-3.5 h-3.5" /> Kosten toevoegen
        </button>

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
          <DropdownMenuContent align="start" className="p-1.5 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
            {allStatuses.map((s) => (
              <DropdownMenuItem key={s} onClick={() => onStatusChange(s)} className="flex items-center gap-2.5">
                <span className={`inline-block w-2 h-2 rounded-full ${statusDots[s]}`} />
                <span className="text-foreground">{statusLabels[s]}</span>
                {vehicle.status === s && (
                  <span className="ml-auto pl-3" style={{ color: "hsl(152 55% 48%)" }}>✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default VehicleDetailHeader;
