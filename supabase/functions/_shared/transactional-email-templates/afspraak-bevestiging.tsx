import * as React from 'npm:react@18.3.1'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, InfoCard, DetailRow, CtaButton, ButtonRow, styles } from './_layout.tsx'
import { Text } from 'npm:@react-email/components@0.0.22'

const SITE_NAME = "Platin Automotive"
const ADRES = "Cilinderweg 99, 2371DZ Roelofarendsveen"
const TEL = "071-781 25 25"
const EMAIL = "info@platinautomotive.nl"

interface Props {
  appointmentId?: string
  voornaam?: string
  naam?: string
  type?: string
  datum?: string
  tijd?: string
  eindtijd?: string
  duurMinuten?: number
  voertuig?: string
  kenteken?: string
  omschrijving?: string
  locatie?: string
  googleCalendarUrl?: string
  icsUrl?: string
  onderwerpRegel?: string
  aanhef?: string
  introTekst?: string
  slotTekst?: string
  footerTekst?: string
  isHerinnering?: boolean
}

const renderTemplate = (tpl: string, vars: Record<string, string>) =>
  (tpl || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? '')

const AfspraakBevestiging = (p: Props) => {
  const voornaam = p.voornaam || p.naam?.split(' ')[0] || 'klant'
  const type = p.type || 'Afspraak'
  const datum = p.datum || ''
  const tijd = p.tijd || ''
  const eindtijd = p.eindtijd || ''
  const locatie = p.locatie || ADRES
  const omschrijving = p.omschrijving || ''

  const vars = {
    voornaam, type, datum, tijd, eindtijd,
    kenteken: p.kenteken || '',
    voertuig: p.voertuig || '',
    locatie,
  }

  const aanhef = renderTemplate(p.aanhef || `Beste {{voornaam}},`, vars)
  const intro = renderTemplate(
    p.introTekst || (p.isHerinnering
      ? `We willen u herinneren aan uw afspraak morgen bij ${SITE_NAME}.`
      : `Bedankt voor uw afspraak. Hieronder vindt u de details:`),
    vars
  )
  const slot = renderTemplate(
    p.slotTekst || `Heeft u vragen? Bel ons op ${TEL} of mail naar ${EMAIL}.`,
    vars
  )

  const titel = p.isHerinnering ? 'Herinnering: uw afspraak morgen' : 'Afspraakbevestiging'
  const eyebrow = p.isHerinnering ? 'Herinnering' : 'Bevestiging'

  return (
    <EmailLayout preview={`${titel} bij ${SITE_NAME}`} eyebrow={eyebrow} title={titel}>
      <Text style={styles.greeting}>{aanhef}</Text>
      <Text style={styles.text}>{intro}</Text>

      <InfoCard>
        <DetailRow label="Type" value={type} />
        <DetailRow label="Datum" value={datum || '-'} />
        <DetailRow label="Tijd" value={`${tijd}${eindtijd ? ` – ${eindtijd}` : ''}`} />
        <DetailRow label="Locatie" value={locatie} />
        {p.voertuig && <DetailRow label="Voertuig" value={p.voertuig} />}
        {omschrijving && <DetailRow label="Omschrijving" value={omschrijving} />}
      </InfoCard>

      {(p.googleCalendarUrl || p.icsUrl) && (
        <ButtonRow>
          {p.googleCalendarUrl && (
            <span style={{ marginRight: '8px', display: 'inline-block' }}>
              <CtaButton href={p.googleCalendarUrl} label="Google Calendar" variant="primary" />
            </span>
          )}
          {p.icsUrl && (
            <CtaButton href={p.icsUrl} label="Apple / Outlook" variant="secondary" />
          )}
        </ButtonRow>
      )}

      <Text style={styles.text}>{slot}</Text>
    </EmailLayout>
  )
}

export const template = {
  component: AfspraakBevestiging,
  subject: (data: Record<string, any>) => {
    if (data?.onderwerpRegel) {
      return renderTemplate(data.onderwerpRegel, {
        voornaam: data.voornaam || '',
        type: data.type || 'Afspraak',
        datum: data.datum || '',
        tijd: data.tijd || '',
        eindtijd: data.eindtijd || '',
        kenteken: data.kenteken || '',
        voertuig: data.voertuig || '',
        locatie: data.locatie || '',
      })
    }
    if (data?.isHerinnering) return `Herinnering: uw afspraak morgen bij ${SITE_NAME}`
    const t = data?.type || 'afspraak'
    const d = data?.datum || ''
    const tijd = data?.tijd || ''
    return `Afspraakbevestiging — ${t}${d ? ` op ${d}` : ''}${tijd ? ` om ${tijd}` : ''}`
  },
  displayName: 'Afspraak bevestiging / herinnering',
  previewData: {
    voornaam: 'Jan',
    type: 'Proefrit',
    datum: 'maandag 5 mei 2026',
    tijd: '10:00',
    eindtijd: '11:00',
    voertuig: 'BMW 3 Serie (12-AB-34)',
    omschrijving: 'Proefrit van een uur',
    googleCalendarUrl: 'https://calendar.google.com/calendar/render?action=TEMPLATE',
    icsUrl: 'https://example.com/ics',
  },
} satisfies TemplateEntry
