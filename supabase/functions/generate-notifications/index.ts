const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, serviceKey)

const APP_URL = 'https://sparkle-wheels-shop.lovable.app'

interface NotificationPayload {
  user_id: string
  type: string
  title: string
  link: string
  vehicle_id?: string
  customer_id?: string
  task_id?: string
  appointment_id?: string
  metadata?: Record<string, unknown>
}

async function getAdminUserIds(): Promise<string[]> {
  const { data } = await supabase.from('user_roles').select('user_id').eq('role', 'admin')
  return (data || []).map((r: any) => r.user_id)
}

async function getPreferences(userId: string): Promise<Record<string, { in_app: boolean; email: boolean }>> {
  const { data } = await supabase.from('notification_preferences').select('*').eq('user_id', userId)
  const prefs: Record<string, { in_app: boolean; email: boolean }> = {}
  for (const row of data || []) {
    prefs[row.notification_type] = { in_app: row.in_app_enabled, email: row.email_enabled }
  }
  return prefs
}

function isEnabled(prefs: Record<string, { in_app: boolean; email: boolean }>, type: string, channel: 'in_app' | 'email'): boolean {
  if (!prefs[type]) return true // default enabled
  return channel === 'in_app' ? prefs[type].in_app : prefs[type].email
}

async function existingNotification(userId: string, type: string, vehicleId?: string, taskId?: string, appointmentId?: string): Promise<boolean> {
  let query = supabase.from('notifications').select('id', { count: 'exact', head: true })
    .eq('user_id', userId).eq('type', type)
  if (vehicleId) query = query.eq('vehicle_id', vehicleId)
  if (taskId) query = query.eq('task_id', taskId)
  if (appointmentId) query = query.eq('appointment_id', appointmentId)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  query = query.gte('created_at', cutoff)
  const { count } = await query
  return (count || 0) > 0
}

async function insertNotification(n: NotificationPayload) {
  await supabase.from('notifications').insert(n)
}

// Slack notification helper — collects messages to send in batch
const slackMessages: { text: string; emoji: string; link?: string }[] = []

function queueSlack(text: string, emoji: string, link?: string) {
  slackMessages.push({ text, emoji, link })
}

async function sendSlackBatch() {
  if (slackMessages.length === 0) return
  
  // Get Slack channel from settings, default to #meldingen
  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'slack_notification_channel')
    .maybeSingle()
  const channel = setting?.value || '#meldingen'

  // Build a single rich message with all notifications
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const adminIds = await getAdminUserIds()
    if (adminIds.length === 0) {
      return new Response(JSON.stringify({ message: 'No admin users found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const in30min = new Date(now.getTime() + 30 * 60 * 1000).toISOString()

    // Email collections for bundled emails
    const apkWarnings: { merk: string; model: string; kenteken: string; datum: string }[] = []
    const overdueTasksList: { omschrijving: string; merk: string; model: string; deadline: string }[] = []

    for (const userId of adminIds) {
      const prefs = await getPreferences(userId)

      // 1. APK warnings
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
        const title = isExpired
          ? `APK van ${v.merk} ${v.model} is verlopen`
          : `APK van ${v.merk} ${v.model} verloopt op ${new Date(v.apk_vervaldatum).toLocaleDateString('nl-NL')}`

        if (isEnabled(prefs, type, 'in_app') && !(await existingNotification(userId, type, v.id))) {
          await insertNotification({ user_id: userId, type, title, link: `/admin/voertuigen/${v.id}`, vehicle_id: v.id })
          queueSlack(title, isExpired ? '🚨' : '⚠️', `/admin/voertuigen/${v.id}`)
        }
        if (isEnabled(prefs, type, 'email')) {
          apkWarnings.push({ merk: v.merk, model: v.model, kenteken: v.kenteken || '', datum: v.apk_vervaldatum })
        }
      }

      // 2. Vehicles in stock > 60/90 days
      for (const days of [60, 90]) {
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
        const type = days === 60 ? 'stock_60days' : 'stock_90days'
        const { data: longStock } = await supabase
          .from('vehicles')
          .select('id, merk, model, created_at')
          .in('status', ['te_koop', 'consignatie'])
          .lte('created_at', cutoffDate)

        for (const v of longStock || []) {
          const title = days === 90
            ? `${v.merk} ${v.model} staat al 90 dagen te koop — actie vereist`
            : `${v.merk} ${v.model} staat al 60 dagen te koop`
          if (isEnabled(prefs, type, 'in_app') && !(await existingNotification(userId, type, v.id))) {
            await insertNotification({ user_id: userId, type, title, link: `/admin/voertuigen/${v.id}`, vehicle_id: v.id })
            queueSlack(title, days === 90 ? '🔴' : '🟡', `/admin/voertuigen/${v.id}`)
          }
          if (days === 90 && isEnabled(prefs, type, 'email') && !(await existingNotification(userId, `${type}_email`, v.id))) {
            await supabase.functions.invoke('send-transactional-email', {
              body: {
                templateName: 'vehicle-long-stock',
                recipientEmail: 'info@platinautomotive.nl',
                idempotencyKey: `stock90-${v.id}-${today}`,
                templateData: { merk: v.merk, model: v.model, dagen: 90, link: `${APP_URL}/admin/voertuigen/${v.id}` },
              },
            })
          }
        }
      }

      // 3. Proefrit form completed
      const { data: completedForms } = await supabase
        .from('test_drives')
        .select('id, voertuig_merk, voertuig_model, customer_id, formulier_ingevuld_op')
        .not('formulier_ingevuld_op', 'is', null)
        .gte('formulier_ingevuld_op', new Date(now.getTime() - 60 * 60 * 1000).toISOString())

      for (const td of completedForms || []) {
        let klantNaam = 'Klant'
        if (td.customer_id) {
          const { data: cust } = await supabase.from('test_drive_customers').select('voornaam, achternaam').eq('id', td.customer_id).maybeSingle()
          if (cust) klantNaam = `${cust.voornaam} ${cust.achternaam}`
        }
        const type = 'proefrit_form_completed'
        const title = `${klantNaam} heeft het proefrit formulier ingevuld voor ${td.voertuig_merk} ${td.voertuig_model}`
        if (isEnabled(prefs, type, 'in_app') && !(await existingNotification(userId, type, undefined, undefined))) {
          await insertNotification({ user_id: userId, type, title, link: `/admin/proefriten`, metadata: { test_drive_id: td.id } })
          queueSlack(title, '✅', `/admin/proefriten`)
        }
        if (isEnabled(prefs, type, 'email')) {
          await supabase.functions.invoke('send-transactional-email', {
            body: {
              templateName: 'proefrit-form-completed',
              recipientEmail: 'info@platinautomotive.nl',
              idempotencyKey: `proefrit-form-${td.id}`,
              templateData: { klantNaam, voertuig: `${td.voertuig_merk} ${td.voertuig_model}`, link: `${APP_URL}/admin/proefriten` },
            },
          })
        }
      }

      // 4. Proefrit started but no form after 2h
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      const { data: pendingForms } = await supabase
        .from('test_drives')
        .select('id, voertuig_merk, voertuig_model, vehicle_id')
        .eq('status', 'actief')
        .is('formulier_ingevuld_op', null)
        .lte('start_tijd', twoHoursAgo)

      for (const td of pendingForms || []) {
        const type = 'proefrit_form_pending'
        const title = `Proefrit van ${td.voertuig_merk} ${td.voertuig_model} wacht nog op formulier`
        if (isEnabled(prefs, type, 'in_app') && !(await existingNotification(userId, type, td.vehicle_id))) {
          await insertNotification({ user_id: userId, type, title, link: `/admin/proefriten`, vehicle_id: td.vehicle_id })
          queueSlack(title, '📋', `/admin/proefriten`)
        }
      }

      // 5. Task deadlines
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
        const title = isOverdue
          ? `Taak '${t.omschrijving}' op ${v.merk} ${v.model} is over deadline`
          : `Taak '${t.omschrijving}' op ${v.merk} ${v.model} moet vandaag af`
        if (isEnabled(prefs, type, 'in_app') && !(await existingNotification(userId, type, undefined, t.id))) {
          await insertNotification({ user_id: userId, type, title, link: `/admin/voertuigen/${t.vehicle_id}`, vehicle_id: t.vehicle_id, task_id: t.id })
          queueSlack(title, isOverdue ? '🔥' : '📌', `/admin/voertuigen/${t.vehicle_id}`)
        }
        if (isOverdue && isEnabled(prefs, type, 'email')) {
          overdueTasksList.push({ omschrijving: t.omschrijving, merk: v.merk, model: v.model, deadline: t.deadline! })
        }
      }

      // 6. Appointments in 30 min
      const { data: soonAppts } = await supabase
        .from('appointments')
        .select('id, type, datum_tijd, vehicle_id, customer_id, customers(voornaam, achternaam), vehicles(merk, model)')
        .eq('status', 'gepland')
        .gte('datum_tijd', now.toISOString())
        .lte('datum_tijd', in30min)

      for (const a of soonAppts || []) {
        const type = 'appointment_soon'
        const cust = (a as any).customers
        const veh = (a as any).vehicles
        const klantNaam = cust ? `${cust.voornaam} ${cust.achternaam}` : 'Klant'
        const voertuig = veh ? `${veh.merk} ${veh.model}` : ''
        const title = `Afspraak met ${klantNaam}${voertuig ? ` voor ${voertuig}` : ''} begint over 30 minuten`
        if (isEnabled(prefs, type, 'in_app') && !(await existingNotification(userId, type, undefined, undefined, a.id))) {
          await insertNotification({ user_id: userId, type, title, link: `/admin/planning`, vehicle_id: a.vehicle_id, customer_id: a.customer_id, appointment_id: a.id })
          queueSlack(title, '📅', `/admin/planning`)
        }
      }

      // Send bundled APK email
      if (apkWarnings.length > 0 && isEnabled(prefs, 'apk_warning', 'email')) {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'apk-overview',
            recipientEmail: 'info@platinautomotive.nl',
            idempotencyKey: `apk-overview-${today}`,
            templateData: { vehicles: apkWarnings, link: `${APP_URL}/admin/voertuigen` },
          },
        })
      }

      // Send bundled overdue tasks email
      if (overdueTasksList.length > 0 && isEnabled(prefs, 'task_overdue', 'email')) {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'tasks-overdue-overview',
            recipientEmail: 'info@platinautomotive.nl',
            idempotencyKey: `tasks-overdue-${today}`,
            templateData: { tasks: overdueTasksList, link: `${APP_URL}/admin/voertuigen` },
          },
        })
      }
    }

    // Send all queued Slack notifications as one bundled message
    await sendSlackBatch()

    return new Response(JSON.stringify({ success: true, slack_notifications: slackMessages.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('Error generating notifications:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
