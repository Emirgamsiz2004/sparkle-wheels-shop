import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { naam, telefoon, merk, model, bouwjaar, kenteken, kmStand } = await req.json();

    const WHATSAPP_API_TOKEN = Deno.env.get("WHATSAPP_API_TOKEN");
    const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_ID");
    const OWNER_WHATSAPP_NUMBER = Deno.env.get("OWNER_WHATSAPP_NUMBER");

    // Als WhatsApp niet geconfigureerd is, log en return success
    if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_ID || !OWNER_WHATSAPP_NUMBER) {
      console.log("WhatsApp niet geconfigureerd. Aanmelding ontvangen:", {
        naam,
        telefoon,
        merk,
        model,
        bouwjaar,
        kenteken,
      });
      return new Response(
        JSON.stringify({ success: true, message: "Aanmelding opgeslagen (WhatsApp niet geconfigureerd)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Bericht naar eigenaar
    const ownerMessage = `🚗 *Nieuwe consignatie aanmelding*\n\n*Naam:* ${naam}\n*Telefoon:* ${telefoon}\n*Auto:* ${merk} ${model} (${bouwjaar})\n*Kenteken:* ${kenteken || "Niet opgegeven"}\n*KM-stand:* ${kmStand || "Niet opgegeven"}`;

    const sendWhatsApp = async (to: string, message: string) => {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: message },
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`WhatsApp API error [${response.status}]: ${errorData}`);
      }
      
      return response.json();
    };

    // Stuur naar eigenaar
    await sendWhatsApp(OWNER_WHATSAPP_NUMBER, ownerMessage);

    // Stuur bevestiging naar klant (als telefoonnummer een geldig WhatsApp nummer is)
    const cleanPhone = telefoon.replace(/\D/g, "");
    if (cleanPhone.length >= 10) {
      const customerPhone = cleanPhone.startsWith("0")
        ? "31" + cleanPhone.substring(1)
        : cleanPhone;
      
      const customerMessage = `Bedankt voor uw aanmelding bij PLA Auto's! 🚗\n\nWij hebben uw ${merk} ${model} (${bouwjaar}) ontvangen en nemen zo snel mogelijk contact met u op.\n\nMet vriendelijke groet,\nPLA Auto's`;

      try {
        await sendWhatsApp(customerPhone, customerMessage);
      } catch (error) {
        console.log("Kon klant WhatsApp niet versturen:", error);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
