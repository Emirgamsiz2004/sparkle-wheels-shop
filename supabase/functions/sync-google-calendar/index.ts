// Google Calendar sync via Lovable connector gateway
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/google_calendar/calendar/v3';
const CALENDAR_ID = 'primary';

interface SyncBody {
  action: 'create' | 'update' | 'delete';
  appointment: {
    id: string;
    type: string;
    onderwerp?: string | null;
    notities?: string | null;
    datum_tijd: string;
    eind_datum_tijd?: string | null;
    google_event_id?: string | null;
    customer?: { voornaam: string; achternaam: string; telefoon?: string; email?: string } | null;
    vehicle?: { merk: string; model: string; kenteken?: string | null } | null;
  };
}

const typeLabels: Record<string, string> = {
  bezichtiging: 'Bezichtiging',
  proefrit: 'Proefrit',
  terugbelafspraak: 'Terugbelafspraak',
  aflevering: 'Aflevering',
};

function buildEvent(appointment: SyncBody['appointment']) {
  const typeLabel = typeLabels[appointment.type] || appointment.type;
  const customerName = appointment.customer
    ? `${appointment.customer.voornaam} ${appointment.customer.achternaam}`
    : '';
  const vehicleName = appointment.vehicle
    ? `${appointment.vehicle.merk} ${appointment.vehicle.model}${appointment.vehicle.kenteken ? ` (${appointment.vehicle.kenteken})` : ''}`
    : '';
  const summary = [typeLabel, customerName].filter(Boolean).join(' — ') || appointment.onderwerp || 'Afspraak';

  const descriptionParts: string[] = [];
  if (appointment.onderwerp) descriptionParts.push(appointment.onderwerp);
  if (vehicleName) descriptionParts.push(`Voertuig: ${vehicleName}`);
  if (appointment.customer?.telefoon) descriptionParts.push(`Tel: ${appointment.customer.telefoon}`);
  if (appointment.customer?.email) descriptionParts.push(`Email: ${appointment.customer.email}`);
  if (appointment.notities) descriptionParts.push('', appointment.notities);

  const start = new Date(appointment.datum_tijd);
  const end = appointment.eind_datum_tijd
    ? new Date(appointment.eind_datum_tijd)
    : new Date(start.getTime() + 60 * 60 * 1000);

  return {
    summary,
    description: descriptionParts.join('\n'),
    location: 'Cilinderweg 99, 2371 DZ Roelofarendsveen',
    start: { dateTime: start.toISOString(), timeZone: 'Europe/Amsterdam' },
    end: { dateTime: end.toISOString(), timeZone: 'Europe/Amsterdam' },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const GOOGLE_CALENDAR_API_KEY = Deno.env.get('GOOGLE_CALENDAR_API_KEY');
  if (!LOVABLE_API_KEY || !GOOGLE_CALENDAR_API_KEY) {
    return new Response(JSON.stringify({ error: 'Google Calendar connector not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await req.json()) as SyncBody;
    const { action, appointment } = body;
    if (!action || !appointment) {
      return new Response(JSON.stringify({ error: 'action and appointment required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'X-Connection-Api-Key': GOOGLE_CALENDAR_API_KEY,
      'Content-Type': 'application/json',
    };

    if (action === 'delete') {
      if (!appointment.google_event_id) {
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const r = await fetch(
        `${GATEWAY_URL}/calendars/${CALENDAR_ID}/events/${appointment.google_event_id}`,
        { method: 'DELETE', headers }
      );
      if (!r.ok && r.status !== 404 && r.status !== 410) {
        const text = await r.text();
        throw new Error(`Delete failed [${r.status}]: ${text}`);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const event = buildEvent(appointment);

    if (action === 'update' && appointment.google_event_id) {
      const r = await fetch(
        `${GATEWAY_URL}/calendars/${CALENDAR_ID}/events/${appointment.google_event_id}`,
        { method: 'PUT', headers, body: JSON.stringify(event) }
      );
      if (r.status === 404) {
        // Re-create as fallback
        const r2 = await fetch(`${GATEWAY_URL}/calendars/${CALENDAR_ID}/events`, {
          method: 'POST',
          headers,
          body: JSON.stringify(event),
        });
        const data2 = await r2.json();
        if (!r2.ok) throw new Error(`Create-fallback failed [${r2.status}]: ${JSON.stringify(data2)}`);
        return new Response(JSON.stringify({ success: true, google_event_id: data2.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const data = await r.json();
      if (!r.ok) throw new Error(`Update failed [${r.status}]: ${JSON.stringify(data)}`);
      return new Response(JSON.stringify({ success: true, google_event_id: data.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // create
    const r = await fetch(`${GATEWAY_URL}/calendars/${CALENDAR_ID}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(event),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(`Create failed [${r.status}]: ${JSON.stringify(data)}`);
    return new Response(JSON.stringify({ success: true, google_event_id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
