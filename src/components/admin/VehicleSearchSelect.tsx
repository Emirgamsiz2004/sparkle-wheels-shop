import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

interface Vehicle {
  id: string;
  kenteken?: string;
  merk: string;
  model: string;
}

interface Props {
  vehicles: Vehicle[];
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
}

export default function VehicleSearchSelect({ vehicles, value, onValueChange, placeholder = "Zoek voertuig..." }: Props) {
  const [open, setOpen] = useState(false);
  const selected = vehicles.find(v => v.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
          {selected ? `${selected.kenteken || "—"} — ${selected.merk} ${selected.model}` : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-border" align="start">
        <Command>
          <CommandInput placeholder="Zoek op kenteken, merk..." className="h-9" />
          <CommandList>
            <CommandEmpty>Geen voertuig gevonden</CommandEmpty>
            <CommandGroup>
              {vehicles.map(v => (
                <CommandItem
                  key={v.id}
                  value={`${v.kenteken || ""} ${v.merk} ${v.model}`}
                  onSelect={() => { onValueChange(v.id); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === v.id ? "opacity-100" : "opacity-0")} />
                  <span className="font-medium">{v.kenteken || "—"}</span>
                  <span className="text-muted-foreground ml-2">{v.merk} {v.model}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
