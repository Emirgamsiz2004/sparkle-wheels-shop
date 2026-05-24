import KostenCombinedTab from "@/components/admin/financien/KostenCombinedTab";

const AdminFinancieelPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financiën</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Beheer uw kosten per categorie
        </p>
      </div>

      <KostenCombinedTab />
    </div>
  );
};

export default AdminFinancieelPage;
