import { useState } from "react";
import WinstVerliesTab from "@/components/admin/financien/WinstVerliesTab";
import KostenCombinedTab from "@/components/admin/financien/KostenCombinedTab";
import { cn } from "@/lib/utils";

type Tab = "overzicht" | "beheer";

const AdminFinancieelPage = () => {
  const [tab, setTab] = useState<Tab>("overzicht");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-['Poppins']">Financiën</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Winst &amp; Verlies overzicht — omzet, kosten en netto resultaat
          </p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-[12px] p-1">
          {[
            { id: "overzicht", label: "Overzicht" },
            { id: "beheer", label: "Kosten & Moneybird" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as Tab)}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overzicht" ? <WinstVerliesTab /> : <KostenCombinedTab />}
    </div>
  );
};

export default AdminFinancieelPage;
