import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  isAanvraag?: boolean
  type?: string
  naam?: string
  email?: string
  telefoon?: string
  datum?: string
  tijdstip?: string
  voertuig?: string
  kenteken?: string
  omschrijving?: string
  voorkeursdatum?: string
  opmerking?: string
}

const AdminNotificatie = ({
  isAanvraag, type, naam, email, telefoon, datum, tijdstip,
  voertuig, kenteken, omschrijving, voorkeursdatum, opmerking,
}: Props) => {
  const title = isAanvraag
    ? `Nieuwe aanvraag via website — ${type || ''}`
    : `Nieuwe afspraak via website`

  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Type</Text>
            <Text style={detailValue}>{type || '-'}</Text>

            <Text style={detailLabel}>Naam</Text>
            <Text style={detailValue}>{naam || '-'}</Text>

            <Text style={detailLabel}>E-mail</Text>
            <Text style={detailValue}>{email || '-'}</Text>

            <Text style={detailLabel}>Telefoon</Text>
            <Text style={detailValue}>{telefoon || '-'}</Text>

            {!isAanvraag && (
              <>
                <Hr style={hr} />
                <Text style={detailLabel}>Datum</Text>
                <Text style={detailValue}>{datum || '-'}</Text>
                <Text style={detailLabel}>Tijdstip</Text>
                <Text style={detailValue}>{tijdstip || '-'}</Text>
                {voertuig && (
                  <>
                    <Text style={detailLabel}>Voertuig</Text>
                    <Text style={detailValue}>{voertuig}</Text>
                  </>
                )}
                {opmerking && (
                  <>
                    <Text style={detailLabel}>Opmerking</Text>
                    <Text style={detailValue}>{opmerking}</Text>
                  </>
                )}
              </>
            )}

            {isAanvraag && (
              <>
                <Hr style={hr} />
                {kenteken && (
                  <>
                    <Text style={detailLabel}>Kenteken</Text>
                    <Text style={detailValue}>{kenteken}</Text>
                  </>
                )}
                {voorkeursdatum && (
                  <>
                    <Text style={detailLabel}>Voorkeursdatum</Text>
                    <Text style={detailValue}>{voorkeursdatum}</Text>
                  </>
                )}
                {omschrijving && (
                  <>
                    <Text style={detailLabel}>Omschrijving</Text>
                    <Text style={detailValue}>{omschrijving}</Text>
                  </>
                )}
              </>
            )}
          </Section>

          <Text style={footer}>Bekijk en beheer in het admin-paneel onder Planning.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AdminNotificatie,
  subject: (data: Record<string, any>) =>
    data.isAanvraag
      ? `Nieuwe aanvraag via website — ${data.type || ''}`
      : `Nieuwe afspraak via website`,
  to: 'info@platinautomotive.nl',
  displayName: 'Afspraak — admin notificatie',
  previewData: {
    isAanvraag: false,
    type: 'Proefrit',
    naam: 'Jan de Vries',
    email: 'jan@voorbeeld.nl',
    telefoon: '06-12345678',
    datum: 'maandag 1 mei 2026',
    tijdstip: '10:00',
    voertuig: 'BMW 3 Serie (12-AB-34)',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '20px', fontWeight: '700' as const, color: '#0a0a0a', margin: '0 0 16px' }
const detailsBox = { backgroundColor: '#f8f8f8', borderRadius: '4px', padding: '16px 20px', margin: '0 0 16px' }
const detailLabel = { fontSize: '10px', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '8px 0 2px', fontWeight: '600' as const }
const detailValue = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.5' }
const hr = { borderColor: '#e5e5e5', margin: '12px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
