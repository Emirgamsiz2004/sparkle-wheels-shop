import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface ArchiveDoc {
  id: string;
  created_at: string;
  document_type: string;
  kenteken: string | null;
  klant_naam: string | null;
  file_path: string | null;
  storage_bucket: string | null;
  vehicle_id: string | null;
  test_drive_id: string | null;
  consignatie_overeenkomst_id: string | null;
}

const DOC_TYPES = [
  { value: "all", label: "Alle documenten" },
  { value: "proefritformulier", label: "Proefritformulier" },
  { value: "consignatieovereenkomst", label: "Consignatieovereenkomst" },
  { value: "aanbetalingsovereenkomst", label: "Aanbetalingsovereenkomst" },
  { value: "koopovereenkomst", label: "Koopovereenkomst" },
  { value: "factuur", label: "Factuur" },
  { value: "schaderapport", label: "Schaderapport" },
];

const docTypeLabel = (type: string) => DOC_TYPES.find((d) => d.value === type)?.label || type;

const AdminArchiefPage = () => {
  const [docs, setDocs] = useState<ArchiveDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKenteken, setSearchKenteken] = useState("");
  const [searchNaam, setSearchNaam] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("document_archive")
      .select("*")
      .order("created_at", { ascending: false });
    setDocs((data as ArchiveDoc[]) || []);
    setLoading(false);
  };

  const filtered = docs.filter((d) => {
    if (filterType !== "all" && d.document_type !== filterType) return false;
    if (searchKenteken && !d.kenteken?.toLowerCase().includes(searchKenteken.toLowerCase())) return false;
    if (searchNaam && !d.klant_naam?.toLowerCase().includes(searchNaam.toLowerCase())) return false;
    if (dateFrom && d.created_at < dateFrom) return false;
    if (dateTo && d.created_at > dateTo + "T23:59:59") return false;
    return true;
  });

  const handleDownload = async (doc: ArchiveDoc) => {
    if (!doc.file_path || !doc.storage_bucket) return;

    if (doc.storage_bucket === "test-drive-files") {
      // For test drive files, use view-overeenkomst edge function
      if (doc.test_drive_id) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/view-overeenkomst?id=${doc.test_drive_id}`;
        window.open(url, "_blank");
        return;
      }
    }

    const { data } = await supabase.storage.from(doc.storage_bucket).createSignedUrl(doc.file_path, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Archief</h1>
        <p className="text-sm text-muted-foreground">Alle gegenereerde documenten</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Kenteken..."
            value={searchKenteken}
            onChange={(e) => setSearchKenteken(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Naam..."
            value={searchNaam}
            onChange={(e) => setSearchNaam(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOC_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 text-sm" placeholder="Van" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 text-sm" placeholder="Tot" />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Datum</TableHead>
              <TableHead className="text-xs">Documenttype</TableHead>
              <TableHead className="text-xs">Kenteken</TableHead>
              <TableHead className="text-xs">Klant / Eigenaar</TableHead>
              <TableHead className="text-xs w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">Laden...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Geen documenten gevonden</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="text-sm tabular-nums">
                    {format(new Date(doc.created_at), "dd MMM yyyy HH:mm", { locale: nl })}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent text-foreground">
                      {docTypeLabel(doc.document_type)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-mono uppercase">{doc.kenteken || "—"}</TableCell>
                  <TableCell className="text-sm">{doc.klant_naam || "—"}</TableCell>
                  <TableCell>
                    {doc.file_path && (
                      <button
                        onClick={() => handleDownload(doc)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminArchiefPage;
