import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Platin Automotive"

interface Props {
  type?: string
  naam?: string
  email?: string
  telefoon?: string
  bericht?: string
  merk?: string
  model?: string
  bouwjaar?: string
  kenteken?: string
}

const NieuweAanmeldingEmail = ({ type, naam, email, telefoon, bericht, merk, model, bouwjaar, kenteken }: Props) => {
  const isConsignatie = type === 'consignatie'
  const title = isConsignatie ? 'Nieuwe consignatie-aanmelding' : 'Nieuw contactformulier'

  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>{title} van {naam || 'onbekend'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          <Text style={text}>Er is een nieuwe aanmelding binnengekomen via de website.</Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Naam</Text>
            <Text style={detailValue}>{naam || '-'}</Text>

            <Text style={detailLabel}>E-mail</Text>
            <Text style={detailValue}>{email || '-'}</Text>

            {telefoon && (
              <>
                <Text style={detailLabel}>Telefoon</Text>
                <Text style={detailValue}>{telefoon}</Text>
              </>
            )}

            {isConsignatie && merk && (
              <>
                <Hr style={hr} />
                <Text style={detailLabel}>Voertuig</Text>
                <Text style={detailValue}>
                  {merk} {model} {bouwjaar ? `(${bouwjaar})` : ''} {kenteken ? `- ${kenteken}` : ''}
                </Text>
              </>
            )}

            {bericht && (
              <>
                <Hr style={hr} />
                <Text style={detailLabel}>Bericht</Text>
                <Text style={detailValue}>{bericht}</Text>
              </>
            )}
          </Section>

          <Text style={footer}>
            Bekijk alle aanmeldingen in het admin-paneel onder "Aanmeldingen".
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: NieuweAanmeldingEmail,
  subject: (data: Record<string, any>) =>
    data.type === 'consignatie'
      ? `Nieuwe consignatie-aanmelding: ${data.merk || ''} ${data.model || ''}`
      : `Nieuw contactformulier: ${data.naam || 'onbekend'}`,
  displayName: 'Nieuwe aanmelding notificatie',
  to: 'info@platinautomotive.nl',
  previewData: {
    type: 'contact',
    naam: 'Jan de Vries',
    email: 'jan@voorbeeld.nl',
    telefoon: '06-12345678',
    bericht: 'Ik ben geïnteresseerd in de BMW 3 Serie.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '20px', fontWeight: '700' as const, color: '#0a0a0a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = { backgroundColor: '#f8f8f8', borderRadius: '4px', padding: '16px 20px', margin: '0 0 20px' }
const detailLabel = { fontSize: '10px', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '8px 0 2px', fontWeight: '600' as const }
const detailValue = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.5' }
const hr = { borderColor: '#e5e5e5', margin: '12px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
