// Daily reminder for appointments tomorrow.
// Triggered via pg_cron once per day. No JWT required (cron-scheduled).

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TYPE_LABELS: Record<string, string> = {
  bezichtiging: 'Bezichtiging',
  proefrit: 'Proefrit',
  terugbelafspraak: 'Terugbelafspraak',
  aflevering: 'Aflevering',
  ophalen: 'Ophalen',
  onderhoud: 'Onderhoud / reparatie',
  poetsbeurt: 'Poetsbeurt',
  anders: 'Anders',
}

function formatDateNL(d: Date) {
  return d.toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
function formatTimeNL(d: Date) {
  return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  // "Tomorrow" range in Europe/Amsterdam, expressed in UTC bounds.
  // Compute today in Amsterdam tz, then +1 day.
  const now = new Date()
  const amsParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const ymd = Object.fromEntries(amsParts.map((p) => [p.type, p.value]))
  const tomorrow = new Date(`${ymd.year}-${ymd.month}-${ymd.day}T00:00:00+01:00`)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date(tomorrow)
  dayAfter.setDate(dayAfter.getDate() + 1)

  const { data: appts, error } = await supabase
    .from('appointments')
    .select('id, type, datum_tijd, notities, customer_id, vehicle_id, aanvrager_voornaam, aanvrager_email, customer:customers(voornaam, email), vehicle:vehicles(merk, model, kenteken)')
    .eq('status', 'gepland')
    .eq('is_aanvraag', false)
    .gte('datum_tijd', tomorrow.toISOString())
    .lt('datum_tijd', dayAfter.toISOString())

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  for (const a of (appts || [])) {
    const naam = a.customer?.voornaam || a.aanvrager_voornaam || ''
    const email = a.customer?.email || a.aanvrager_email || ''
    if (!email) continue

    const dt = new Date(a.datum_tijd)
    const voertuig = a.vehicle ? `${a.vehicle.merk} ${a.vehicle.model}${a.vehicle.kenteken ? ` (${a.vehicle.kenteken})` : ''}` : ''

    await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'afspraak-bevestiging',
        recipientEmail: email,
        idempotencyKey: `reminder-${a.id}-${ymd.year}${ymd.month}${ymd.day}`,
        templateData: {
          isHerinnering: true,
          naam,
          type: TYPE_LABELS[a.type] || a.type,
          datum: formatDateNL(dt),
          tijdstip: formatTimeNL(dt),
          voertuig,
        },
      },
    })
    sent++
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
