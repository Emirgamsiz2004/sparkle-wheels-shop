import { useState } from "react";
import { Wallet, Car, BarChart3 } from "lucide-react";
import KostenCombinedTab from "@/components/admin/financien/KostenCombinedTab";
import VoertuigMargesTab from "@/components/admin/financien/VoertuigMargesTab";
import MaandOverzichtTab from "@/components/admin/financien/MaandOverzichtTab";

type MainTab = "overzicht" | "kosten" | "marges";

const AdminFinancieelPage = () => {
  const [tab, setTab] = useState<MainTab>("overzicht");

  const tabs: { key: MainTab; label: string; icon: typeof Wallet }[] = [
    { key: "overzicht", label: "Maand overzicht", icon: BarChart3 },
    { key: "kosten", label: "Kosten", icon: Wallet },
    { key: "marges", label: "Alle marges", icon: Car },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financiën</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overzicht van kosten en voertuigmarges
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overzicht" && <MaandOverzichtTab />}
      {tab === "kosten" && <KostenCombinedTab />}
      {tab === "marges" && <VoertuigMargesTab />}
    </div>
  );
};

export default AdminFinancieelPage;
