import { useState } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { Link } from "react-router-dom";
import { Plus, Search, Loader2, Eye } from "lucide-react";
import { formatEuro, calcWinst, calcMarge, statusLabels, statusColors, Vehicle } from "@/types/vehicle";
import { Card, CardContent } from "@/components/ui/card";

const tabs: { label: string; value: string }[] = [
  { label: "Alle", value: "alle" },
  { label: "Inkoop", value: "inkoop" },
  { label: "In behandeling", value: "in_behandeling" },
  { label: "Te koop", value: "te_koop" },
  { label: "Verkocht", value: "verkocht" },
];

const AdminVoertuigenPage = () => {
  const { vehicles, loading } = useVehicles();
  const [filter, setFilter] = useState("alle");
  const [search, setSearch] = useState("");

  const filtered = vehicles.filter((v) => {
    if (filter !== "alle" && v.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        v.merk.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.kenteken?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voertuigen</h1>
          <p className="text-sm text-gray-500 mt-1">{vehicles.length} voertuig{vehicles.length !== 1 ? "en" : ""}</p>
        </div>
        <Link
          to="/admin/voertuigen/nieuw"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1F3864] text-white text-sm font-medium rounded-lg hover:bg-[#172d52] transition-colors"
        >
          <Plus className="w-4 h-4" /> Nieuw Voertuig
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === t.value ? "bg-[#1F3864] text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Zoek op merk, model, kenteken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864]/40"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-400">
              {vehicles.length === 0 ? (
                <>Nog geen auto's toegevoegd. <Link to="/admin/voertuigen/nieuw" className="text-[#1F3864] hover:underline">Voeg je eerste voertuig toe →</Link></>
              ) : (
                "Geen voertuigen gevonden voor deze filters."
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Voertuig</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Kenteken</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Inkoopprijs</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Verkoopprijs</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Marge</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actie</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => {
                    const winst = calcWinst(v);
                    const marge = calcMarge(v);
                    return (
                      <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <Link to={`/admin/voertuigen/${v.id}`} className="font-medium text-gray-900 hover:text-[#1F3864]">
                            {v.merk} {v.model} <span className="text-gray-400 font-normal">({v.bouwjaar})</span>
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-gray-500 uppercase tracking-wider text-xs font-mono">{v.kenteken || "—"}</td>
                        <td className="px-5 py-3 text-right text-gray-700">{formatEuro(v.inkoopprijs)}</td>
                        <td className="px-5 py-3 text-right text-gray-700">{v.verkoopprijs > 0 ? formatEuro(v.verkoopprijs) : "—"}</td>
                        <td className={`px-5 py-3 text-right font-medium ${winst >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {v.verkoopprijs > 0 ? (
                            <>
                              {formatEuro(winst)} <span className="text-xs font-normal">({marge.toFixed(0)}%)</span>
                            </>
                          ) : "—"}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${statusColors[v.status]}`}>
                            {statusLabels[v.status]}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Link to={`/admin/voertuigen/${v.id}`} className="inline-flex items-center gap-1 text-xs text-[#1F3864] hover:underline">
                            <Eye className="w-3.5 h-3.5" /> Bekijk
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVoertuigenPage;
