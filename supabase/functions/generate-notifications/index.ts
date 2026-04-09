const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, serviceKey)

const APP_URL = 'https://sparkle-wheels-shop.lovable.app'

// ─── Helpers ───

async function getAdminUserIds(): Promise<string[]> {
  const { data } = await supabase.from('user_roles').select('user_id').eq('role', 'admin')
  return (data || []).map((r: any) => r.user_id)
}

/** Check if a notification with this unique key was already sent */
async function alreadySent(key: string): Promise<boolean> {
  const { count } = await supabase
    .from('slack_notification_log')
    .select('id', { count: 'exact', head: true })
    .eq('notification_key', key)
  return (count || 0) > 0
}

/** Mark notification as sent */
async function markSent(key: string, type: string, message: string, vehicleId?: string, entityId?: string) {
  await supabase.from('slack_notification_log').insert({
    notification_key: key,
    notification_type: type,
    message,
    vehicle_id: vehicleId || null,
    entity_id: entityId || null,
  })
}

/** Also insert in-app notification for admin users */
async function insertInApp(adminIds: string[], type: string, title: string, link: string, vehicleId?: string, extras?: Record<string, string | undefined>) {
  for (const userId of adminIds) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      link,
      vehicle_id: vehicleId || null,
      customer_id: extras?.customer_id || null,
      appointment_id: extras?.appointment_id || null,
    })
  }
}

// ─── Slack message queue ───

const slackMessages: { text: string; emoji: string; link?: string }[] = []

function q(text: string, emoji: string, link?: string) {
  slackMessages.push({ text, emoji, link })
}

async function sendSlackBatch() {
  if (slackMessages.length === 0) return

  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'slack_notification_channel')
    .maybeSingle()
  const channel = setting?.value || '#meldingen'

  const blocks: any[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `🔔 Platin Automotive — ${slackMessages.length} melding${slackMessages.length > 1 ? 'en' : ''}`, emoji: true }
    },
    { type: 'divider' },
  ]

  for (const msg of slackMessages) {
    const linkText = msg.link ? ` <${APP_URL}${msg.link}|Bekijken>` : ''
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `${msg.emoji} ${msg.text}${linkText}` }
    })
  }

  const fallbackText = slackMessages.map(m => `${m.emoji} ${m.text}`).join('\n')

  try {
    await supabase.functions.invoke('send-slack-notification', {
      body: { channel, text: fallbackText, blocks },
    })
    console.log(`Sent ${slackMessages.length} notifications to Slack channel ${channel}`)
  } catch (err) {
    console.error('Failed to send Slack batch:', err)
  }
}

// ─── Business hours check ───

function isDuringBusinessHours(): boolean {
  // Amsterdam time (CET/CEST)
  const nl = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }))
  const hour = nl.getHours()
  return hour >= 8 && hour < 19
}

// ─── Main handler ───

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    if (!isDuringBusinessHours()) {
      return new Response(JSON.stringify({ message: 'Outside business hours (08:00-19:00), skipping.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminIds = await getAdminUserIds()
    if (adminIds.length === 0) {
      return new Response(JSON.stringify({ message: 'No admin users found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const in30days = new Date(now.getTime() + 30 * 86400000).toISOString().split('T')[0]

    // ════════════════════════════════════════════
    // VOERTUIGEN
    // ════════════════════════════════════════════

    // 1. APK verloopt binnen 30 dagen / is verlopen
    const { data: apkVehicles } = await supabase
      .from('vehicles')
      .select('id, merk, model, kenteken, apk_vervaldatum')
      .not('status', 'eq', 'verkocht')
      .not('apk_vervaldatum', 'is', null)
      .lte('apk_vervaldatum', in30days)

    for (const v of apkVehicles || []) {
      const apkDate = new Date(v.apk_vervaldatum)
      const isExpired = apkDate < now
      const type = isExpired ? 'apk_expired' : 'apk_warning'
      const key = `${type}:${v.id}`
      if (await alreadySent(key)) continue

      const msg = isExpired
        ? `APK van ${v.merk} ${v.model} (${v.kenteken || '?'}) is verlopen`
        : `APK van ${v.merk} ${v.model} (${v.kenteken || '?'}) verloopt op ${apkDate.toLocaleDateString('nl-NL')}`

      q(msg, isExpired ? '🚨' : '⚠️', `/admin/voertuigen/${v.id}`)
      await markSent(key, type, msg, v.id)
      await insertInApp(adminIds, type, msg, `/admin/voertuigen/${v.id}`, v.id)
    }

    // 2. Voertuig 60 / 90 dagen in voorraad
    for (const days of [60, 90]) {
      const cutoff = new Date(now.getTime() - days * 86400000).toISOString()
      const type = `stock_${days}days`
      const { data: longStock } = await supabase
        .from('vehicles')
        .select('id, merk, model, kenteken')
        .in('status', ['te_koop', 'consignatie'])
        .lte('created_at', cutoff)

      for (const v of longStock || []) {
        const key = `${type}:${v.id}`
        if (await alreadySent(key)) continue
        const suffix = days === 90 ? ' — dit is de laatste herinnering' : ''
        const msg = `${v.merk} ${v.model} (${v.kenteken || '?'}) staat al ${days} dagen in voorraad${suffix}`
        q(msg, days === 90 ? '🔴' : '🟡', `/admin/voertuigen/${v.id}`)
        await markSent(key, type, msg, v.id)
        await insertInApp(adminIds, type, msg, `/admin/voertuigen/${v.id}`, v.id)
      }
    }

    // 3. Voertuig >24h zonder Marktplaats link
    {
      const cutoff24h = new Date(now.getTime() - 24 * 3600000).toISOString()
      const { data: noLink } = await supabase
        .from('vehicles')
        .select('id, merk, model, kenteken, marktplaats_url')
        .in('status', ['te_koop', 'consignatie'])
        .lte('created_at', cutoff24h)

      for (const v of (noLink || []).filter((v: any) => !v.marktplaats_url)) {
        const key = `no_marktplaats:${v.id}`
        if (await alreadySent(key)) continue
        const msg = `${v.merk} ${v.model} (${v.kenteken || '?'}) heeft nog geen Marktplaats link. Voeg deze toe.`
        q(msg, '🔗', `/admin/voertuigen/${v.id}`)
        await markSent(key, 'no_marktplaats', msg, v.id)
        await insertInApp(adminIds, 'no_marktplaats', msg, `/admin/voertuigen/${v.id}`, v.id)
      }
    }

    // 4. Inkoopdossier onvolledig na 7 dagen
    {
      const cutoff7d = new Date(now.getTime() - 7 * 86400000).toISOString()
      const { data: oldVehicles } = await supabase
        .from('vehicles')
        .select('id, merk, model, kenteken')
        .neq('status', 'verkocht')
        .lte('created_at', cutoff7d)

      for (const v of oldVehicles || []) {
        const key = `inkoop_dossier_incomplete:${v.id}`
        if (await alreadySent(key)) continue

        // Check if there's an inkoopverklaring or inkoopfactuur in checklist
        const { data: docs } = await supabase
          .from('document_checklist_items')
          .select('naam, voltooid')
          .eq('vehicle_id', v.id)
          .in('naam', ['Inkoopverklaring', 'Inkoopfactuur', 'Vrijwaringsbewijs inkoop'])

        const incomplete = (docs || []).filter((d: any) => !d.voltooid)
        if (incomplete.length === 0) continue

        const missing = incomplete.map((d: any) => d.naam).join(', ')
        const msg = `Inkoopdossier van ${v.merk} ${v.model} (${v.kenteken || '?'}) is onvolledig — ontbreekt: ${missing}`
        q(msg, '📁', `/admin/voertuigen/${v.id}`)
        await markSent(key, 'inkoop_dossier_incomplete', msg, v.id)
        await insertInApp(adminIds, 'inkoop_dossier_incomplete', msg, `/admin/voertuigen/${v.id}`, v.id)
      }
    }

    // 5. Inkoopdossier onvolledig na 48 uur (specifiek inkoopverklaring/vrijwaring)
    {
      const cutoff48h = new Date(now.getTime() - 48 * 3600000).toISOString()
      const { data: recentVehicles } = await supabase
        .from('vehicles')
        .select('id, merk, model, kenteken')
        .neq('status', 'verkocht')
        .lte('created_at', cutoff48h)
        .gte('created_at', new Date(now.getTime() - 8 * 86400000).toISOString()) // don't overlap with 7-day check

      for (const v of recentVehicles || []) {
        const key = `inkoop_48h_incomplete:${v.id}`
        if (await alreadySent(key)) continue

        const { data: docs } = await supabase
          .from('document_checklist_items')
          .select('naam, voltooid')
          .eq('vehicle_id', v.id)
          .in('naam', ['Inkoopverklaring', 'Inkoopfactuur', 'Vrijwaringsbewijs inkoop'])

        const incomplete = (docs || []).filter((d: any) => !d.voltooid)
        if (incomplete.length === 0) continue

        const missing = incomplete.map((d: any) => d.naam).join(', ')
        const msg = `${v.merk} ${v.model} (${v.kenteken || '?'}) is 48 uur geleden toegevoegd maar inkoopdossier is onvolledig — ontbreekt: ${missing}`
        q(msg, '📋', `/admin/voertuigen/${v.id}`)
        await markSent(key, 'inkoop_48h_incomplete', msg, v.id)
        await insertInApp(adminIds, 'inkoop_48h_incomplete', msg, `/admin/voertuigen/${v.id}`, v.id)
      }
    }

    // 6. Consignatieovereenkomst ontbreekt na 3 dagen (voor status consignatie)
    {
      const cutoff3d = new Date(now.getTime() - 3 * 86400000).toISOString()
      const { data: consignatieVehicles } = await supabase
        .from('vehicles')
        .select('id, merk, model, kenteken')
        .eq('status', 'consignatie')
        .lte('created_at', cutoff3d)

      for (const v of consignatieVehicles || []) {
        const key = `consignatie_overeenkomst_missing_3d:${v.id}`
        if (await alreadySent(key)) continue

        const { count } = await supabase
          .from('consignatie_overeenkomsten')
          .select('id', { count: 'exact', head: true })
          .eq('vehicle_id', v.id)

        if ((count || 0) > 0) continue

        const msg = `Consignatieovereenkomst ontbreekt voor ${v.merk} ${v.model} (${v.kenteken || '?'}) — al 3 dagen status consignatie`
        q(msg, '📄', `/admin/voertuigen/${v.id}`)
        await markSent(key, 'consignatie_overeenkomst_missing_3d', msg, v.id)
        await insertInApp(adminIds, 'consignatie_overeenkomst_missing_3d', msg, `/admin/voertuigen/${v.id}`, v.id)
      }
    }

    // 7. Consignatievoertuig zonder overeenkomst na 24 uur
    {
      const cutoff24h = new Date(now.getTime() - 24 * 3600000).toISOString()
      const { data: consigVehicles } = await supabase
        .from('vehicles')
        .select('id, merk, model, kenteken')
        .eq('status', 'consignatie')
        .lte('created_at', cutoff24h)
        .gte('created_at', new Date(now.getTime() - 4 * 86400000).toISOString()) // don't overlap 3d check

      for (const v of consigVehicles || []) {
        const key = `consignatie_overeenkomst_missing_24h:${v.id}`
        if (await alreadySent(key)) continue

        const { count } = await supabase
          .from('consignatie_overeenkomsten')
          .select('id', { count: 'exact', head: true })
          .eq('vehicle_id', v.id)

        if ((count || 0) > 0) continue

        const msg = `Consignatievoertuig ${v.merk} ${v.model} (${v.kenteken || '?'}) is 24 uur geleden toegevoegd maar consignatieovereenkomst ontbreekt`
        q(msg, '📄', `/admin/voertuigen/${v.id}`)
        await markSent(key, 'consignatie_overeenkomst_missing_24h', msg, v.id)
        await insertInApp(adminIds, 'consignatie_overeenkomst_missing_24h', msg, `/admin/voertuigen/${v.id}`, v.id)
      }
    }

    // ════════════════════════════════════════════
    // PROEFRITEN
    // ════════════════════════════════════════════

    // 8. Proefrit formulier ingevuld — direct
    {
      const recentCutoff = new Date(now.getTime() - 15 * 60000).toISOString() // last 15 min (runs every 5 min)
      const { data: completed } = await supabase
        .from('test_drives')
        .select('id, voertuig_merk, voertuig_model, voertuig_kenteken, customer_id')
        .not('formulier_ingevuld_op', 'is', null)
        .gte('formulier_ingevuld_op', recentCutoff)

      for (const td of completed || []) {
        const key = `proefrit_form_completed:${td.id}`
        if (await alreadySent(key)) continue

        let klantNaam = 'Klant'
        if (td.customer_id) {
          const { data: cust } = await supabase.from('test_drive_customers').select('voornaam, achternaam').eq('id', td.customer_id).maybeSingle()
          if (cust) klantNaam = `${cust.voornaam} ${cust.achternaam}`
        }

        const msg = `${klantNaam} heeft het proefrit formulier ingevuld voor ${td.voertuig_merk} ${td.voertuig_model} (${td.voertuig_kenteken || '?'})`
        q(msg, '✅', `/admin/proefriten`)
        await markSent(key, 'proefrit_form_completed', msg, undefined, td.id)
        await insertInApp(adminIds, 'proefrit_form_completed', msg, `/admin/proefriten`)
      }
    }

    // 9. Proefrit gestart maar formulier niet ingevuld na 2 uur
    {
      const twoHoursAgo = new Date(now.getTime() - 2 * 3600000).toISOString()
      const { data: pending } = await supabase
        .from('test_drives')
        .select('id, voertuig_merk, voertuig_model, voertuig_kenteken, vehicle_id')
        .eq('status', 'actief')
        .is('formulier_ingevuld_op', null)
        .lte('start_tijd', twoHoursAgo)

      for (const td of pending || []) {
        const key = `proefrit_form_pending_2h:${td.id}`
        if (await alreadySent(key)) continue

        const msg = `Proefrit van ${td.voertuig_merk} ${td.voertuig_model} (${td.voertuig_kenteken || '?'}) gestart maar formulier nog niet ingevuld na 2 uur`
        q(msg, '📋', `/admin/proefriten`)
        await markSent(key, 'proefrit_form_pending_2h', msg, td.vehicle_id, td.id)
        await insertInApp(adminIds, 'proefrit_form_pending_2h', msg, `/admin/proefriten`, td.vehicle_id)
      }
    }

    // 10. Proefrit actief > 30 minuten
    {
      const thirtyMinAgo = new Date(now.getTime() - 30 * 60000).toISOString()
      const { data: longRides } = await supabase
        .from('test_drives')
        .select('id, voertuig_merk, voertuig_model, voertuig_kenteken, vehicle_id, start_tijd')
        .eq('status', 'actief')
        .lte('start_tijd', thirtyMinAgo)

      for (const td of longRides || []) {
        const startTime = new Date(td.start_tijd).getTime()
        const minutes = Math.round((now.getTime() - startTime) / 60000)

        if (minutes >= 60) {
          // 60 min — second and final warning
          const key = `proefrit_60min:${td.id}`
          if (await alreadySent(key)) continue
          const msg = `Proefrit van ${td.voertuig_merk} ${td.voertuig_model} (${td.voertuig_kenteken || '?'}) loopt al meer dan 60 minuten. Controleer dit.`
          q(msg, '🚨', `/admin/proefriten`)
          await markSent(key, 'proefrit_60min', msg, td.vehicle_id, td.id)
          await insertInApp(adminIds, 'proefrit_60min', msg, `/admin/proefriten`, td.vehicle_id)
        } else {
          // 30 min — first warning
          const key = `proefrit_30min:${td.id}`
          if (await alreadySent(key)) continue
          const msg = `Proefrit van ${td.voertuig_merk} ${td.voertuig_model} (${td.voertuig_kenteken || '?'}) loopt al meer dan 30 minuten. Vergeten af te sluiten?`
          q(msg, '⏱️', `/admin/proefriten`)
          await markSent(key, 'proefrit_30min', msg, td.vehicle_id, td.id)
          await insertInApp(adminIds, 'proefrit_30min', msg, `/admin/proefriten`, td.vehicle_id)
        }
      }
    }

    // ════════════════════════════════════════════
    // VERKOPEN
    // ════════════════════════════════════════════

    // 11. Voertuig verkocht — direct melding
    {
      const recentCutoff = new Date(now.getTime() - 15 * 60000).toISOString()
      const { data: recentSold } = await supabase
        .from('vehicles')
        .select('id, merk, model, kenteken, verkoopprijs, inkoopprijs, koper_naam')
        .eq('status', 'verkocht')
        .not('verkoop_datum', 'is', null)

      for (const v of recentSold || []) {
        const key = `vehicle_sold:${v.id}`
        if (await alreadySent(key)) continue

        // Calculate simple margin
        const marge = v.verkoopprijs - v.inkoopprijs
        const msg = `🎉 Verkocht: ${v.merk} ${v.model} (${v.kenteken || '?'}) — Verkoopprijs: €${v.verkoopprijs?.toLocaleString('nl-NL') || '0'}, Marge: €${marge?.toLocaleString('nl-NL') || '0'}`
        q(msg, '💰', `/admin/verkopen`)
        await markSent(key, 'vehicle_sold', msg, v.id)
        await insertInApp(adminIds, 'vehicle_sold', msg, `/admin/verkopen`, v.id)
      }
    }

    // 12. Aanbetaling ontvangen
    {
      const recentCutoff = new Date(now.getTime() - 15 * 60000).toISOString()
      const { data: recentAanbetalingen } = await supabase
        .from('aanbetalingen')
        .select('id, aanbetalingsbedrag, voertuig_merk, voertuig_model, voertuig_kenteken, vehicle_id')
        .gte('created_at', new Date(now.getTime() - 24 * 3600000).toISOString())

      for (const a of recentAanbetalingen || []) {
        const key = `aanbetaling:${a.id}`
        if (await alreadySent(key)) continue

        const msg = `Aanbetaling ontvangen: €${a.aanbetalingsbedrag?.toLocaleString('nl-NL') || '0'} voor ${a.voertuig_merk} ${a.voertuig_model} (${a.voertuig_kenteken || '?'})`
        q(msg, '💳', `/admin/verkopen`)
        await markSent(key, 'aanbetaling', msg, a.vehicle_id, a.id)
        await insertInApp(adminIds, 'aanbetaling', msg, `/admin/verkopen`, a.vehicle_id)
      }
    }

    // 13. Verkoop afgerond maar factuur niet aangemaakt na 24h
    {
      const cutoff24h = new Date(now.getTime() - 24 * 3600000).toISOString()
      const { data: salesNoInvoice } = await supabase
        .from('vehicle_sales')
        .select('id, vehicle_id, customer_id, vehicles(merk, model, kenteken), customers(voornaam, achternaam)')
        .eq('status', 'afgerond')
        .is('moneybird_factuur_id', null)
        .lte('created_at', cutoff24h)

      for (const s of salesNoInvoice || []) {
        const key = `sale_no_invoice:${s.id}`
        if (await alreadySent(key)) continue

        const veh = (s as any).vehicles
        const cust = (s as any).customers
        const klant = cust ? `${cust.voornaam} ${cust.achternaam}` : 'klant'
        const msg = `Factuur voor ${veh?.merk || '?'} ${veh?.model || '?'} aan ${klant} is nog niet aangemaakt.`
        q(msg, '🧾', `/admin/verkopen`)
        await markSent(key, 'sale_no_invoice', msg, s.vehicle_id, s.id)
        await insertInApp(adminIds, 'sale_no_invoice', msg, `/admin/verkopen`, s.vehicle_id)
      }
    }

    // 14. Verkoop afgerond maar koopovereenkomst ontbreekt
    {
      const { data: salesComplete } = await supabase
        .from('vehicle_sales')
        .select('id, vehicle_id, vehicles(merk, model, kenteken)')
        .eq('status', 'afgerond')

      for (const s of salesComplete || []) {
        const key = `sale_no_koopovereenkomst:${s.id}`
        if (await alreadySent(key)) continue

        const { count } = await supabase
          .from('document_checklist_items')
          .select('id', { count: 'exact', head: true })
          .eq('vehicle_id', s.vehicle_id)
          .eq('naam', 'Koopovereenkomst')
          .eq('voltooid', true)

        if ((count || 0) > 0) continue

        const veh = (s as any).vehicles
        const msg = `Koopovereenkomst ontbreekt in dossier voor ${veh?.merk || '?'} ${veh?.model || '?'} (${veh?.kenteken || '?'})`
        q(msg, '📝', `/admin/voertuigen/${s.vehicle_id}`)
        await markSent(key, 'sale_no_koopovereenkomst', msg, s.vehicle_id, s.id)
        await insertInApp(adminIds, 'sale_no_koopovereenkomst', msg, `/admin/voertuigen/${s.vehicle_id}`, s.vehicle_id)
      }
    }

    // ════════════════════════════════════════════
    // PLANNING
    // ════════════════════════════════════════════

    // 15. Afspraak over 60 minuten
    {
      const in60min = new Date(now.getTime() + 60 * 60000).toISOString()
      const in55min = new Date(now.getTime() + 55 * 60000).toISOString()
      const { data: soonAppts } = await supabase
        .from('appointments')
        .select('id, type, datum_tijd, vehicle_id, customer_id, onderwerp, customers(voornaam, achternaam), vehicles(merk, model)')
        .eq('status', 'gepland')
        .gte('datum_tijd', in55min)
        .lte('datum_tijd', in60min)

      for (const a of soonAppts || []) {
        const key = `appointment_60min:${a.id}`
        if (await alreadySent(key)) continue

        const cust = (a as any).customers
        const veh = (a as any).vehicles
        const klant = cust ? `${cust.voornaam} ${cust.achternaam}` : 'Klant'
        const voertuig = veh ? ` voor ${veh.merk} ${veh.model}` : ''
        const msg = `Afspraak met ${klant}${voertuig} begint over 60 minuten${a.onderwerp ? ` — ${a.onderwerp}` : ''}`
        q(msg, '📅', `/admin/planning`)
        await markSent(key, 'appointment_60min', msg, a.vehicle_id, a.id)
        await insertInApp(adminIds, 'appointment_60min', msg, `/admin/planning`, a.vehicle_id, { appointment_id: a.id })
      }
    }

    // 16. Afspraak ingepland maar voertuig heeft verkeerde status
    {
      const { data: upcomingAppts } = await supabase
        .from('appointments')
        .select('id, vehicle_id, customer_id, datum_tijd, vehicles(merk, model, kenteken, status)')
        .eq('status', 'gepland')
        .in('type', ['bezichtiging', 'proefrit'])
        .gte('datum_tijd', now.toISOString())

      for (const a of upcomingAppts || []) {
        const veh = (a as any).vehicles
        if (!veh || !['inkoop', 'in_behandeling'].includes(veh.status)) continue

        const key = `appointment_wrong_status:${a.id}`
        if (await alreadySent(key)) continue

        const msg = `${veh.merk} ${veh.model} (${veh.kenteken || '?'}) staat nog niet als Te koop. Controleer de status voor de bezichtiging.`
        q(msg, '⚠️', `/admin/voertuigen/${a.vehicle_id}`)
        await markSent(key, 'appointment_wrong_status', msg, a.vehicle_id, a.id)
        await insertInApp(adminIds, 'appointment_wrong_status', msg, `/admin/voertuigen/${a.vehicle_id}`, a.vehicle_id, { appointment_id: a.id })
      }
    }

    // ════════════════════════════════════════════
    // TAKEN
    // ════════════════════════════════════════════

    // 17. Overdue tasks
    {
      const { data: dueTasks } = await supabase
        .from('vehicle_tasks')
        .select('id, omschrijving, deadline, vehicle_id, vehicles!inner(merk, model)')
        .eq('voltooid', false)
        .not('deadline', 'is', null)
        .lte('deadline', today)

      for (const t of dueTasks || []) {
        const v = (t as any).vehicles
        const isOverdue = t.deadline! < today
        const type = isOverdue ? 'task_overdue' : 'task_due_today'
        const key = `${type}:${t.id}`
        if (await alreadySent(key)) continue

        const msg = isOverdue
          ? `Taak '${t.omschrijving}' op ${v.merk} ${v.model} is over deadline`
          : `Taak '${t.omschrijving}' op ${v.merk} ${v.model} moet vandaag af`
        q(msg, isOverdue ? '🔥' : '📌', `/admin/voertuigen/${t.vehicle_id}`)
        await markSent(key, type, msg, t.vehicle_id, t.id)
        await insertInApp(adminIds, type, msg, `/admin/voertuigen/${t.vehicle_id}`, t.vehicle_id)
      }
    }

    // ─── Send all queued Slack messages ───
    await sendSlackBatch()

    return new Response(JSON.stringify({
      success: true,
      notifications_sent: slackMessages.length,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Error generating notifications:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
