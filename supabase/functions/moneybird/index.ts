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

    const body = await req.json();
    const { action, ...params } = body;
    console.log("[moneybird v2] action received:", action);

    // ─── PDF download als binary blob (proxy) ───
    if (action === "download_invoice_pdf_blob") {
      const { invoice_id, kenteken, datum } = params;
      if (!invoice_id) {
        return new Response(JSON.stringify({ error: "invoice_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const token = Deno.env.get("MONEYBIRD_API_TOKEN");
      const adminId = Deno.env.get("MONEYBIRD_ADMINISTRATION_ID");
      if (!token || !adminId) {
        return new Response(JSON.stringify({ error: "Moneybird credentials missing" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const pdfRes = await fetch(
        `${MB_BASE}/${adminId}/sales_invoices/${invoice_id}/download_pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
        }
      );
      if (!pdfRes.ok) {
        const errText = await pdfRes.text();
        console.error("Moneybird PDF error", pdfRes.status, errText);
        return new Response(
          JSON.stringify({ error: `Moneybird PDF download mislukt: ${pdfRes.status}` }),
          { status: pdfRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const safeKenteken = (kenteken || "factuur").toString().replace(/[^A-Za-z0-9-]/g, "");
      const safeDatum = (datum || new Date().toISOString().slice(0, 10)).toString().replace(/[^0-9-]/g, "");
      const filename = `Factuur-${safeKenteken}-${safeDatum}.pdf`;
      const arrayBuffer = await pdfRes.arrayBuffer();
      return new Response(arrayBuffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    let result: any;

    switch (action) {
      // ─── Contacten ───
      case "get_contacts": {
        result = await mbFetch("contacts.json?per_page=100");
        break;
      }

      case "create_contact": {
        const {
          company_name, firstname, lastname, email, phone,
          address1, address2, zipcode, city, country,
          chamber_of_commerce, tax_number,
        } = params;
        const contactPayload: Record<string, any> = {
          company_name: company_name || `${firstname || ""} ${lastname || ""}`.trim(),
          firstname: firstname || undefined,
          lastname: lastname || undefined,
          email: email || undefined,
          phone: phone || undefined,
          address1: address1 || undefined,
          address2: address2 || undefined,
          zipcode: zipcode || undefined,
          city: city || undefined,
          country: country || undefined,
          chamber_of_commerce: chamber_of_commerce || undefined,
          tax_number: tax_number || undefined,
        };
        result = await mbFetch("contacts.json", {
          method: "POST",
          body: JSON.stringify({ contact: contactPayload }),
        });
        break;
      }

      case "get_contact": {
        const { contact_id } = params;
        if (!contact_id) throw new Error("contact_id is required");
        result = await mbFetch(`contacts/${contact_id}.json`);
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
        if (!invoice_id) throw new Error("invoice_id is required");
        const method = delivery_method === "Email" ? "Email" : "Manual";

        // Stap 1: send_invoice endpoint (verstuurt + zou definitief moeten maken)
        try {
          await mbFetch(`sales_invoices/${invoice_id}/send_invoice.json`, {
            method: "PATCH",
            body: JSON.stringify({
              sales_invoice_sending: {
                delivery_method: method,
                sending_scheduled_at: null,
              },
            }),
          });
        } catch (sendErr) {
          console.error("send_invoice mislukt, probeer state-transitie:", sendErr);
        }

        // Stap 2: check de huidige state
        let updated = await mbFetch(`sales_invoices/${invoice_id}.json`);
        console.log("Factuur state na send_invoice:", updated?.state);

        // Stap 3: als nog draft, forceer state-transitie naar 'open'
        if (updated?.state === "draft") {
          console.log("Factuur nog draft — forceer transitie naar open");
          try {
            await mbFetch(`sales_invoices/${invoice_id}/transitions.json`, {
              method: "PATCH",
              body: JSON.stringify({ transition: "open" }),
            });
          } catch (transErr) {
            console.error("transitions endpoint mislukt:", transErr);
            // Laatste poging: PATCH state direct
            await mbFetch(`sales_invoices/${invoice_id}/mark_as_open.json`, {
              method: "PATCH",
              body: JSON.stringify({}),
            }).catch((e) => console.error("mark_as_open mislukt:", e));
          }
          updated = await mbFetch(`sales_invoices/${invoice_id}.json`);
          console.log("Factuur state na transitie:", updated?.state);
        }

        const adminId = Deno.env.get("MONEYBIRD_ADMINISTRATION_ID");
        result = {
          invoice: updated,
          state: updated?.state,
          delivery_method: method,
          moneybird_url: `https://moneybird.com/${adminId}/sales_invoices/${invoice_id}`,
        };
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

      case "get_custom_fields": {
        result = await mbFetch("custom_fields.json");
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

      // ─── Verkoopfactuur via wizard (workflow + regels) ───
      case "create_wizard_invoice": {
        const {
          contact_id: wContactId,
          contact_payload,
          workflow_id,
          reference,
          invoice_date,
          details_attributes: wDetails,
          prices_are_incl_tax: wIncl,
        } = params;

        // 1) Contact: gebruik bestaand of maak/zoek aan
        let contact: any = null;
        if (wContactId) {
          contact = await mbFetch(`contacts/${wContactId}.json`);
        } else if (contact_payload) {
          const cp = contact_payload as Record<string, any>;
          // Probeer eerst te zoeken op naam/email
          const query = cp.email || cp.company_name || `${cp.firstname || ""} ${cp.lastname || ""}`.trim();
          if (query) {
            const found = await mbFetch(`contacts.json?query=${encodeURIComponent(query)}`);
            if (Array.isArray(found) && found.length > 0) contact = found[0];
          }
          if (!contact) {
            const isValidEmail = cp.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cp.email);
            const payload: Record<string, unknown> = {
              company_name: cp.company_name || `${cp.firstname || ""} ${cp.lastname || ""}`.trim() || "Klant",
              firstname: cp.firstname || undefined,
              lastname: cp.lastname || undefined,
              phone: cp.phone || undefined,
              address1: cp.address1 || undefined,
              zipcode: cp.zipcode || undefined,
              city: cp.city || undefined,
              country: cp.country || "NL",
              chamber_of_commerce: cp.chamber_of_commerce || undefined,
              tax_number: cp.tax_number || undefined,
            };
            if (isValidEmail) {
              payload.send_invoices_to_email = cp.email;
              payload.send_estimates_to_email = cp.email;
            }
            contact = await mbFetch("contacts.json", {
              method: "POST",
              body: JSON.stringify({ contact: payload }),
            });
          }
        } else {
          throw new Error("contact_id of contact_payload is verplicht");
        }

        // 2) Verkoopfactuur opbouwen
        const { custom_fields_attributes: wCustomFields } = params as any;
        const invoiceBody: Record<string, unknown> = {
          contact_id: contact.id,
          reference: reference || undefined,
          invoice_date: invoice_date || new Date().toISOString().split("T")[0],
          prices_are_incl_tax: wIncl ?? true,
          details_attributes: (wDetails || []).map((d: any) => ({
            description: String(d.description || ""),
            price: String(d.price ?? 0),
            amount: String(d.amount ?? "1"),
            ...(d.tax_rate_id ? { tax_rate_id: String(d.tax_rate_id) } : {}),
          })),
        };
        if (workflow_id) invoiceBody.workflow_id = String(workflow_id);
        if (Array.isArray(wCustomFields) && wCustomFields.length > 0) {
          // Haal bestaande custom fields op om ongeldige IDs te filteren (voorkomt 404)
          let validIds = new Set<string>();
          try {
            const cfs = await mbFetch("custom_fields.json");
            if (Array.isArray(cfs)) {
              for (const cf of cfs) validIds.add(String(cf.id));
            }
          } catch (e) {
            console.warn("Kon custom_fields niet ophalen, stuur alle mee:", e);
            validIds = new Set(wCustomFields.map((cf: any) => String(cf.id)));
          }
          const filtered = wCustomFields
            .filter((cf: any) => validIds.has(String(cf.id)))
            .map((cf: any) => ({
              id: String(cf.id),
              value: cf.value == null ? "" : String(cf.value),
            }));
          if (filtered.length > 0) {
            invoiceBody.custom_fields_attributes = filtered;
          }
          const skipped = wCustomFields.length - filtered.length;
          if (skipped > 0) {
            console.warn(`${skipped} custom field(s) overgeslagen omdat ze niet bestaan in Moneybird`);
          }
        }

        const invoice = await mbFetch("sales_invoices.json", {
          method: "POST",
          body: JSON.stringify({ sales_invoice: invoiceBody }),
        });

        const adminId = Deno.env.get("MONEYBIRD_ADMINISTRATION_ID");
        const moneybirdUrl = `https://moneybird.com/${adminId}/sales_invoices/${invoice.id}`;
        result = { invoice, contact, moneybird_url: moneybirdUrl };
        break;
      }

      case "get_sales_invoice": {
        const { invoice_id: gInvoiceId } = params;
        if (!gInvoiceId) throw new Error("invoice_id is required");
        const inv = await mbFetch(`sales_invoices/${gInvoiceId}.json`);
        const adminId = Deno.env.get("MONEYBIRD_ADMINISTRATION_ID");
        result = { invoice: inv, moneybird_url: `https://moneybird.com/${adminId}/sales_invoices/${gInvoiceId}` };
        break;
      }

      // ─── Bestaat factuur nog in Moneybird? (404-safe) ───
      case "check_invoice_exists": {
        const { invoice_id: cInvoiceId } = params;
        if (!cInvoiceId) throw new Error("invoice_id is required");
        const token = Deno.env.get("MONEYBIRD_API_TOKEN");
        const adminId = Deno.env.get("MONEYBIRD_ADMINISTRATION_ID");
        const checkRes = await fetch(
          `${MB_BASE}/${adminId}/sales_invoices/${cInvoiceId}.json`,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
        );
        if (checkRes.status === 404) {
          result = { exists: false };
        } else if (!checkRes.ok) {
          const txt = await checkRes.text();
          // Behandel 4xx als "bestaat niet meer"; 5xx als echte fout
          if (checkRes.status >= 400 && checkRes.status < 500) {
            result = { exists: false, status: checkRes.status, body: txt };
          } else {
            throw new Error(`Moneybird API error [${checkRes.status}]: ${txt}`);
          }
        } else {
          const inv = await checkRes.json();
          result = { exists: true, invoice: inv };
        }
        break;
      }

      // ─── Verkoopfactuur voor voertuig (legacy, kort) ───
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

      // (send_sales_invoice case is reeds hierboven gedefinieerd)


      // ─── Factuur definitief maken (state: open) ───
      case "finalize_sales_invoice": {
        const { invoice_id: finId } = params;
        if (!finId) throw new Error("invoice_id is required");
        // Eerst huidige state checken — alleen patchen als nog draft
        const current = await mbFetch(`sales_invoices/${finId}.json`);
        if (current?.state && current.state !== "draft") {
          result = { invoice: current, already_open: true };
          break;
        }
        result = await mbFetch(`sales_invoices/${finId}.json`, {
          method: "PATCH",
          body: JSON.stringify({ sales_invoice: { state: "open" } }),
        });
        break;
      }

      // ─── Betaling registreren op een verkoopfactuur ───
      case "register_payment_invoice": {
        const {
          invoice_id: payInvoiceId,
          payment_date,
          price,
          financial_account_id,
          financial_mutation_id,
          payment_method,
        } = params;
        if (!payInvoiceId) throw new Error("invoice_id is required");
        if (price == null) throw new Error("price is required");

        const payment: Record<string, unknown> = {
          payment_date: payment_date || new Date().toISOString().slice(0, 10),
          price: String(price),
        };
        if (financial_account_id) payment.financial_account_id = String(financial_account_id);
        if (financial_mutation_id) payment.financial_mutation_id = String(financial_mutation_id);
        if (payment_method) payment.payment_method = String(payment_method);

        result = await mbFetch(
          `sales_invoices/${payInvoiceId}/payments.json`,
          {
            method: "POST",
            body: JSON.stringify({ payment }),
          },
        );
        break;
      }

      // ─── Lijst van financial accounts (kas / bank) ───
      case "get_financial_accounts": {
        result = await mbFetch("financial_accounts.json");
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
// trigger redeploy 1777110190
