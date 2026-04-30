import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Button, Row, Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Platin Automotive"
const ADRES = "Cilinderweg 99, 2371DZ Roelofarendsveen"
const TEL = "06-12693825"
const EMAIL = "info@platinautomotive.nl"

interface Props {
  // Identificatie
  appointmentId?: string
  // Persoonlijk
  voornaam?: string
  naam?: string // backwards compat
  // Detail velden
  type?: string
  datum?: string // datum voluit, bv "maandag 5 mei 2026"
  tijd?: string // begintijd "10:00"
  eindtijd?: string // eindtijd "11:00"
  duurMinuten?: number
  voertuig?: string // "BMW 3 Serie (12-AB-34)"
  kenteken?: string
  omschrijving?: string
  locatie?: string
  // Calendar links (worden door Edge Function geprepareerd)
  googleCalendarUrl?: string
  icsUrl?: string
  // Custom template overrides
  onderwerpRegel?: string
  aanhef?: string
  introTekst?: string
  slotTekst?: string
  footerTekst?: string
  // Mode
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
    voornaam,
    type,
    datum,
    tijd,
    eindtijd,
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
  const footer = renderTemplate(
    p.footerTekst || `${SITE_NAME} · Cilinderweg 99 · 2371DZ Roelofarendsveen`,
    vars
  )

  const titel = p.isHerinnering ? 'Herinnering: uw afspraak morgen' : 'Afspraakbevestiging'

  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>{titel} bij {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>{SITE_NAME}</Heading>
          <Hr style={brandHr} />

          <Heading style={h1}>{titel}</Heading>
          <Text style={text}>{aanhef}</Text>
          <Text style={text}>{intro}</Text>

          <Section style={detailsBox}>
            <Row>
              <Column style={labelCol}><Text style={detailLabel}>Type</Text></Column>
              <Column><Text style={detailValue}>{type}</Text></Column>
            </Row>
            <Row>
              <Column style={labelCol}><Text style={detailLabel}>Datum</Text></Column>
              <Column><Text style={detailValue}>{datum || '-'}</Text></Column>
            </Row>
            <Row>
              <Column style={labelCol}><Text style={detailLabel}>Tijd</Text></Column>
              <Column><Text style={detailValue}>{tijd}{eindtijd ? ` – ${eindtijd}` : ''}</Text></Column>
            </Row>
            <Row>
              <Column style={labelCol}><Text style={detailLabel}>Locatie</Text></Column>
              <Column><Text style={detailValue}>{locatie}</Text></Column>
            </Row>
            {p.voertuig && (
              <Row>
                <Column style={labelCol}><Text style={detailLabel}>Voertuig</Text></Column>
                <Column><Text style={detailValue}>{p.voertuig}</Text></Column>
              </Row>
            )}
            {omschrijving && (
              <Row>
                <Column style={labelCol}><Text style={detailLabel}>Omschrijving</Text></Column>
                <Column><Text style={detailValue}>{omschrijving}</Text></Column>
              </Row>
            )}
          </Section>

          {(p.googleCalendarUrl || p.icsUrl) && (
            <Section style={{ margin: '24px 0' }}>
              <Row>
                {p.googleCalendarUrl && (
                  <Column style={{ paddingRight: '6px' }}>
                    <Button href={p.googleCalendarUrl} style={btnPrimary}>
                      Toevoegen aan Google Calendar
                    </Button>
                  </Column>
                )}
                {p.icsUrl && (
                  <Column style={{ paddingLeft: '6px' }}>
                    <Button href={p.icsUrl} style={btnSecondary}>
                      Toevoegen aan Apple / Outlook
                    </Button>
                  </Column>
                )}
              </Row>
            </Section>
          )}

          <Text style={text}>{slot}</Text>
          <Hr style={hr} />
          <Text style={footerStyle}>{footer}</Text>
        </Container>
      </Body>
    </Html>
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

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '600px' }
const brand = { fontSize: '14px', fontWeight: '700' as const, color: '#1e1e1a', margin: '0 0 8px', letterSpacing: '0.05em', textTransform: 'uppercase' as const }
const brandHr = { borderColor: '#1e1e1a', margin: '0 0 24px' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#0a0a0a', margin: '0 0 18px' }
const text = { fontSize: '14px', color: '#444', lineHeight: '1.6', margin: '0 0 16px' }
const detailsBox = { backgroundColor: '#f6f6f4', borderRadius: '6px', padding: '18px 20px', margin: '20px 0' }
const labelCol = { width: '120px', verticalAlign: 'top' as const }
const detailLabel = { fontSize: '11px', color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '6px 0', fontWeight: '600' as const }
const detailValue = { fontSize: '14px', color: '#1a1a1a', margin: '6px 0', lineHeight: '1.5' }
const hr = { borderColor: '#e5e5e5', margin: '28px 0 16px' }
const footerStyle = { fontSize: '11px', color: '#999', margin: '0', textAlign: 'center' as const }
const btnPrimary = { backgroundColor: '#1e1e1a', color: '#ffffff', padding: '12px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' as const, textDecoration: 'none', textAlign: 'center' as const, display: 'block' }
const btnSecondary = { backgroundColor: '#ffffff', color: '#1e1e1a', padding: '11px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' as const, textDecoration: 'none', textAlign: 'center' as const, display: 'block', border: '1px solid #1e1e1a' }
