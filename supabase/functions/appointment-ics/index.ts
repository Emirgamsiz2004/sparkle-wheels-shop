// Edge function die een .ics calendar file genereert voor een afspraak.
// Wordt aangeroepen vanuit de bevestigingsmail (Apple/Outlook knop).
// Public endpoint - geen JWT nodig.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TYPE_LABELS: Record<string, string> = {
  bezichtiging: 'Bezichtiging',
  proefrit: 'Proefrit',
  ophalen: 'Ophalen',
  aflevering: 'Aflevering',
  onderhoud: 'Onderhoud / reparatie',
  terugbelafspraak: 'Terugbelafspraak',
  anders: 'Afspraak',
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function fmtICS(d: Date): string {
  // UTC formaat: 20260505T100000Z
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  )
}
function escapeICS(s: string): string {
  return (s || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return new Response('Missing id', { status: 400, headers: corsHeaders })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: appt, error } = await supabase
      .from('appointments')
      .select('id, type, datum_tijd, eind_datum_tijd, duur_minuten, notities, onderwerp, vehicle_id')
      .eq('id', id)
      .maybeSingle()

    if (error || !appt) {
      return new Response('Afspraak niet gevonden', { status: 404, headers: corsHeaders })
    }

    let voertuig = ''
    if (appt.vehicle_id) {
      const { data: v } = await supabase
        .from('voertuigen')
        .select('merk, model, kenteken')
        .eq('id', appt.vehicle_id)
        .maybeSingle()
      if (v) {
        voertuig = `${v.merk || ''} ${v.model || ''}${v.kenteken ? ` (${v.kenteken})` : ''}`.trim()
      }
    }

    const start = new Date(appt.datum_tijd as string)
    let end: Date
    if (appt.eind_datum_tijd) {
      end = new Date(appt.eind_datum_tijd as string)
    } else {
      const minuten = appt.duur_minuten || 60
      end = new Date(start.getTime() + minuten * 60 * 1000)
    }

    const typeLabel = TYPE_LABELS[appt.type as string] || 'Afspraak'
    const summary = `${typeLabel} — Platin Automotive`
    const descParts = [appt.onderwerp, voertuig ? `Voertuig: ${voertuig}` : '', appt.notities].filter(Boolean) as string[]
    const description = descParts.join('\n')
    const location = 'Cilinderweg 99, 2371DZ Roelofarendsveen'
    const dtstamp = fmtICS(new Date())

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Platin Automotive//Afspraak//NL',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:appointment-${appt.id}@platinautomotive.nl`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${fmtICS(start)}`,
      `DTEND:${fmtICS(end)}`,
      `SUMMARY:${escapeICS(summary)}`,
      `DESCRIPTION:${escapeICS(description)}`,
      `LOCATION:${escapeICS(location)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    return new Response(ics, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="afspraak-${appt.id}.ics"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('appointment-ics error', err)
    return new Response('Server error', { status: 500, headers: corsHeaders })
  }
})
