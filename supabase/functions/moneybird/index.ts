import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MB_BASE = "https://moneybird.com/api/v2";

function normalizeMoneybirdPeriodValue(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}$/.test(trimmed)) {
    return `${trimmed}0101..${trimmed}1231`;
  }
  return trimmed;
}

function normalizeMoneybirdFilter(filter?: unknown) {
  if (typeof filter !== "string") return undefined;
  const trimmedFilter = filter.trim();
  if (!trimmedFilter) return undefined;

  return trimmedFilter.replace(
    /period:([^,]+)/g,
    (_match, value: string) => `period:${normalizeMoneybirdPeriodValue(value)}`
  );
}

async function mbFetch(path: string, options: RequestInit = {}) {
  const token = Deno.env.get("MONEYBIRD_API_TOKEN");
  const adminId = Deno.env.get("MONEYBIRD_ADMINISTRATION_ID");
  if (!token) throw new Error("MONEYBIRD_API_TOKEN is not configured");
  if (!adminId) throw new Error("MONEYBIRD_ADMINISTRATION_ID is not configured");

  const url = `${MB_BASE}/${adminId}/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Moneybird API error [${res.status}]: ${body}`);
  }
  return res.json();
}

// Auth check helper
async function checkAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new Error("Unauthorized");
  return data.user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await checkAuth(req);

    const { action, ...params } = await req.json();

    let result: any;

    switch (action) {
      // ─── Contacten ───
      case "get_contacts": {
        result = await mbFetch("contacts.json?per_page=100");
        break;
      }

      case "create_contact": {
        const { company_name, firstname, lastname, email, phone } = params;
        result = await mbFetch("contacts.json", {
          method: "POST",
          body: JSON.stringify({
            contact: {
              company_name: company_name || `${firstname || ""} ${lastname || ""}`.trim(),
              firstname,
              lastname,
              email,
              phone,
            },
          }),
        });
        break;
      }

      case "find_or_create_contact": {
        const { name, email: cEmail, phone: cPhone } = params;
        // Search by name
        const contacts = await mbFetch(`contacts.json?query=${encodeURIComponent(name)}`);
        if (contacts.length > 0) {
          result = contacts[0];
        } else {
          result = await mbFetch("contacts.json", {
            method: "POST",
            body: JSON.stringify({
              contact: {
                company_name: name,
                email: cEmail || undefined,
                phone: cPhone || undefined,
              },
            }),
          });
        }
        break;
      }

      // ─── Verkoopfacturen ───
      case "create_sales_invoice": {
        const { contact_id, reference, details_attributes, prices_are_incl_tax } = params;
        result = await mbFetch("sales_invoices.json", {
          method: "POST",
          body: JSON.stringify({
            sales_invoice: {
              contact_id,
              reference,
              prices_are_incl_tax: prices_are_incl_tax ?? true,
              details_attributes: details_attributes || [],
            },
          }),
        });
        break;
      }

      case "send_sales_invoice": {
        const { invoice_id, delivery_method } = params;
        result = await mbFetch(`sales_invoices/${invoice_id}/send_invoice.json`, {
          method: "PATCH",
          body: JSON.stringify({
            sales_invoice_sending: {
              delivery_method: delivery_method || "Manual",
            },
          }),
        });
        break;
      }

      case "get_sales_invoices": {
        const { filter, page } = params;
        const normalizedFilter = normalizeMoneybirdFilter(filter);
        let path = `sales_invoices.json?per_page=100&page=${page || 1}`;
        if (normalizedFilter) path += `&filter=${encodeURIComponent(normalizedFilter)}`;
        result = await mbFetch(path);
        break;
      }

      // ─── Inkoopfacturen (Purchase Invoices / Receipts) ───
      case "create_receipt": {
        const { contact_id: rcId, reference: rcRef, details_attributes: rcDetails, date: rcDate } = params;
        result = await mbFetch("receipts.json", {
          method: "POST",
          body: JSON.stringify({
            receipt: {
              contact_id: rcId || undefined,
              reference: rcRef,
              date: rcDate || new Date().toISOString().split("T")[0],
              details_attributes: rcDetails || [],
              prices_are_incl_tax: false,
            },
          }),
        });
        break;
      }

      // ─── Grootboekrekeningen ───
      case "get_ledger_accounts": {
        result = await mbFetch("ledger_accounts.json");
        break;
      }

      // ─── BTW-tarieven ───
      case "get_tax_rates": {
        result = await mbFetch("tax_rates.json");
        break;
      }

      // ─── Financieel overzicht (BTW) ───
      case "get_financial_statements": {
        const { year, filter } = params;
        const normalizedFinancialFilter =
          normalizeMoneybirdFilter(filter) ||
          normalizeMoneybirdFilter(`period:${year || new Date().getFullYear()}`);
        result = await mbFetch(
          `financial_statements.json?filter=${encodeURIComponent(normalizedFinancialFilter || "")}`
        );
        break;
      }

      // ─── Ontvangsten (bonnetjes/inkoopfacturen) ───
      case "get_receipts": {
        const { page, filter } = params;
        const normalizedFilter = normalizeMoneybirdFilter(filter);
        let path = `receipts.json?per_page=100&page=${page || 1}`;
        if (normalizedFilter) path += `&filter=${encodeURIComponent(normalizedFilter)}`;
        result = await mbFetch(path);
        break;
      }

      // ─── Purchase invoices ───
      case "get_purchase_invoices": {
        const { page: piPage, filter: piFilter } = params;
        const normalizedFilter = normalizeMoneybirdFilter(piFilter);
        let piPath = `documents/purchase_invoices.json?per_page=100&page=${piPage || 1}`;
        if (normalizedFilter) piPath += `&filter=${encodeURIComponent(normalizedFilter)}`;
        result = await mbFetch(piPath);
        break;
      }

      // ─── Algemeen: administratie info ───
      case "get_administration": {
        const adminId = Deno.env.get("MONEYBIRD_ADMINISTRATION_ID");
        result = await mbFetch(`../administrations.json`);
        // Filter to current administration
        if (Array.isArray(result)) {
          result = result.find((a: any) => String(a.id) === adminId) || result[0];
        }
        break;
      }

      // ─── Verkoopfactuur voor voertuig ───
      case "create_vehicle_invoice": {
        const { vehicle, buyer_name, buyer_email, buyer_phone } = params;
        
        // 1. Find or create contact
        let contact;
        const searchResults = await mbFetch(`contacts.json?query=${encodeURIComponent(buyer_name)}`);
        if (searchResults.length > 0) {
          contact = searchResults[0];
        } else {
          const isValidEmail = buyer_email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer_email);
          const contactPayload: Record<string, unknown> = {
            company_name: buyer_name,
            phone: buyer_phone || undefined,
          };
          if (isValidEmail) {
            contactPayload.send_invoices_to_email = buyer_email;
            contactPayload.send_estimates_to_email = buyer_email;
          }
          contact = await mbFetch("contacts.json", {
            method: "POST",
            body: JSON.stringify({ contact: contactPayload }),
          });
        }

        // 2. Create sales invoice
        const description = `${vehicle.merk} ${vehicle.model} (${vehicle.bouwjaar}) - Kenteken: ${vehicle.kenteken || "N.v.t."}`;
        result = await mbFetch("sales_invoices.json", {
          method: "POST",
          body: JSON.stringify({
            sales_invoice: {
              contact_id: contact.id,
              reference: `VP-${vehicle.kenteken || vehicle.id.slice(0, 8)}`,
              prices_are_incl_tax: true,
              details_attributes: [
                {
                  description,
                  price: String(vehicle.verkoopprijs),
                  amount: "1",
                },
              ],
            },
          }),
        });
        result = { ...result, contact };
        break;
      }

      // ─── Kosten naar Moneybird als bonnetje ───
      case "sync_vehicle_costs": {
        const { vehicle: v, costs } = params;
        const receipts: any[] = [];
        
        for (const cost of costs) {
          const receipt = await mbFetch("receipts.json", {
            method: "POST",
            body: JSON.stringify({
              receipt: {
                reference: `KOSTEN-${v.kenteken || v.id.slice(0, 8)}-${cost.id.slice(0, 6)}`,
                date: cost.date || new Date().toISOString().split("T")[0],
                prices_are_incl_tax: false,
                details_attributes: [
                  {
                    description: `${v.merk} ${v.model}: ${cost.description}`,
                    price: String(cost.amount),
                    amount: "1",
                    tax_rate_id: undefined, // will use default
                  },
                ],
              },
            }),
          });
          receipts.push(receipt);
        }
        result = { synced: receipts.length, receipts };
        break;
      }

      // ─── Factuur versturen ───
      case "send_sales_invoice": {
        const { invoice_id, delivery_method } = params;
        result = await mbFetch(`sales_invoices/${invoice_id}/send_invoice.json`, {
          method: "PATCH",
          body: JSON.stringify({
            sales_invoice_sending: {
              delivery_method: delivery_method || "Email",
            },
          }),
        });
        break;
      }

      // ─── Factuur PDF downloaden ───
      case "download_invoice_pdf": {
        const { invoice_id: pdfInvoiceId } = params;
        const invoice = await mbFetch(`sales_invoices/${pdfInvoiceId}.json`);
        // Return the Moneybird PDF URL
        result = { pdf_url: invoice.url, invoice };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Onbekende actie: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Moneybird error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
