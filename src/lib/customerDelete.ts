import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Verwijdert een klant veilig:
 * - Blokkeert als er een lopende verkoop is (stap11_afgerond = false).
 * - Bij afgesloten verkopen: customer_id wordt op null gezet zodat verkoopdata intact blijft.
 * - Verwijdert daarna de klant uit de customers tabel.
 *
 * Returns true bij succes, false bij blokkade/fout (toast wordt zelf getoond).
 */
export async function deleteCustomerSafely(customerId: string): Promise<boolean> {
  // 1) Check lopende verkopen
  const { data: openSales, error: openErr } = await supabase
    .from("verkopen" as any)
    .select("id, stap11_afgerond")
    .eq("customer_id", customerId)
    .eq("stap11_afgerond", false);

  if (openErr) {
    toast.error("Kon verkopen niet controleren");
    return false;
  }

  if (openSales && openSales.length > 0) {
    toast.error("Deze klant is gekoppeld aan een lopende verkoop en kan niet worden verwijderd.");
    return false;
  }

  // 2) Ontkoppel afgesloten verkopen (customer_id -> null)
  const { error: unlinkErr } = await supabase
    .from("verkopen" as any)
    .update({ customer_id: null })
    .eq("customer_id", customerId);

  if (unlinkErr) {
    toast.error("Kon verkopen niet ontkoppelen");
    return false;
  }

  // 3) Verwijder klant
  const { error: delErr } = await supabase.from("customers").delete().eq("id", customerId);
  if (delErr) {
    toast.error("Fout bij verwijderen klant");
    return false;
  }

  toast.success("Klant verwijderd");
  return true;
}
