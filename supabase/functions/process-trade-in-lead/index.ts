import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({ requestId: z.string().uuid() });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return respond({ error: 'invalid_request' }, 400);

    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const endpoint = Deno.env.get('AUTORM_LEAD_ENDPOINT');
    const token = Deno.env.get('AUTORM_LEAD_TOKEN');
    if (!url || !serviceKey || !endpoint || !token) return respond({ error: 'not_configured' }, 500);

    const client = createClient(url, serviceKey);
    const { data: request, error } = await client.from('inruil_aanmeldingen').select('*').eq('id', parsed.data.requestId).single();
    if (error || !request) return respond({ error: 'not_found' }, 404);

    const { data: storedFiles } = await client.storage.from('inruil-fotos').list(request.id, { limit: 6, sortBy: { column: 'name', order: 'asc' } });
    const photoPaths = (storedFiles || []).map((file) => `${request.id}/${file.name}`);
    const signedUrls: string[] = [];
    for (const path of photoPaths) {
      const { data } = await client.storage.from('inruil-fotos').createSignedUrl(path, 60 * 60 * 24 * 30);
      if (data?.signedUrl) signedUrls.push(data.signedUrl);
    }

    const ownVehicle = [request.merk, request.model, request.bouwjaar].filter(Boolean).join(' ') || request.kenteken;
    const details = [
      `Inruilauto: ${ownVehicle} (${request.kenteken})`,
      `Kilometerstand: ${Number(request.km_stand).toLocaleString('nl-NL')} km`,
      `Gewenste prijs: € ${Number(request.gewenste_prijs).toLocaleString('nl-NL')}`,
      `Interesse in: ${request.interesse_voertuig}`,
      signedUrls.length ? `Foto's:\n${signedUrls.join('\n')}` : 'Geen foto’s meegestuurd',
    ].join('\n');

    const leadResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name: request.naam, email: request.email, phone: request.telefoon, subject: 'Inruilvoorstel', vehicle: ownVehicle, message: details, website: '' }),
    });
    if (!leadResponse.ok) console.error('AutoRM trade-in forwarding failed', leadResponse.status);

    const emailResponse = await fetch(`${url}/functions/v1/send-transactional-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
      body: JSON.stringify({
        templateName: 'nieuwe-contact-aanmelding',
        recipientEmail: 'info@platinautomotive.nl',
        idempotencyKey: `inruil-${request.id}`,
        templateData: { type: 'inruil', naam: request.naam, email: request.email, telefoon: request.telefoon, bericht: details, merk: request.merk, model: request.model, bouwjaar: request.bouwjaar, kenteken: request.kenteken },
      }),
    });
    if (!emailResponse.ok) console.error('Trade-in notification email failed', emailResponse.status);

    return respond({ ok: true });
  } catch (error) {
    console.error('process-trade-in-lead failed', error);
    return respond({ error: 'unexpected_error' }, 500);
  }
});