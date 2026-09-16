import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';

const BodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().max(255).optional().nullable(),
  phone: z.string().trim().max(50).optional().nullable(),
  subject: z.string().trim().min(1).max(200),
  vehicle: z.string().trim().max(300).optional().nullable(),
  message: z.string().trim().max(4000).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const endpoint = Deno.env.get('AUTORM_LEAD_ENDPOINT');
    const token = Deno.env.get('AUTORM_LEAD_TOKEN');
    if (!endpoint || !token) {
      console.error('forward-lead: missing AUTORM configuration');
      return json({ error: 'not_configured' }, 500);
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const d = parsed.data;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        name: d.name,
        email: d.email ?? '',
        phone: d.phone ?? '',
        subject: d.subject,
        vehicle: d.vehicle ?? '',
        message: d.message ?? '',
        website: '',
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error('forward-lead: upstream error', res.status, text.slice(0, 500));
      return json({ error: 'upstream_error', status: res.status }, 502);
    }

    return json({ ok: true });
  } catch (e) {
    console.error('forward-lead failed', e);
    return json({ error: 'unexpected_error' }, 500);
  }
});
