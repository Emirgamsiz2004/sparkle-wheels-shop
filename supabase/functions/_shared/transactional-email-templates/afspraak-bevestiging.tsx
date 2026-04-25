import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Platin Automotive"

interface Props {
  naam?: string
  type?: string
  datum?: string
  tijdstip?: string
  voertuig?: string
  isHerinnering?: boolean
}

const AfspraakBevestiging = ({ naam, type, datum, tijdstip, voertuig, isHerinnering }: Props) => {
  const titel = isHerinnering
    ? 'Herinnering: uw afspraak morgen'
    : 'Uw afspraak is bevestigd'
  const intro = isHerinnering
    ? `Beste ${naam || 'klant'}, we willen u herinneren aan uw afspraak morgen bij ${SITE_NAME}.`
    : `Beste ${naam || 'klant'}, bedankt voor uw afspraak bij ${SITE_NAME}. Hieronder vindt u de details.`

  return (
    <Html lang="nl" dir="ltr">
      <Head />
      <Preview>{titel} bij {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{titel}</Heading>
          <Text style={text}>{intro}</Text>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Type</Text>
            <Text style={detailValue}>{type || '-'}</Text>

            <Text style={detailLabel}>Datum</Text>
            <Text style={detailValue}>{datum || '-'}</Text>

            <Text style={detailLabel}>Tijdstip</Text>
            <Text style={detailValue}>{tijdstip || '-'}</Text>

            {voertuig && (
              <>
                <Hr style={hr} />
                <Text style={detailLabel}>Voertuig</Text>
                <Text style={detailValue}>{voertuig}</Text>
              </>
            )}
          </Section>

          <Section style={detailsBox}>
            <Text style={detailLabel}>Adres</Text>
            <Text style={detailValue}>Cilinderweg 99<br />2371 DZ Roelofarendsveen</Text>
            <Text style={detailLabel}>Telefoon</Text>
            <Text style={detailValue}>06-12693825</Text>
          </Section>

          <Text style={text}>Tot dan!</Text>
          <Text style={footer}>Met vriendelijke groet,<br />Het team van {SITE_NAME}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AfspraakBevestiging,
  subject: (data: Record<string, any>) =>
    data.isHerinnering
      ? `Herinnering: uw afspraak morgen bij ${SITE_NAME}`
      : `Bevestiging afspraak ${SITE_NAME}`,
  displayName: 'Afspraak bevestiging / herinnering',
  previewData: {
    naam: 'Jan de Vries',
    type: 'Proefrit',
    datum: 'maandag 1 mei 2026',
    tijdstip: '10:00',
    voertuig: 'BMW 3 Serie (12-AB-34)',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '20px', fontWeight: '700' as const, color: '#0a0a0a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#555', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = { backgroundColor: '#f8f8f8', borderRadius: '4px', padding: '16px 20px', margin: '0 0 16px' }
const detailLabel = { fontSize: '10px', color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '8px 0 2px', fontWeight: '600' as const }
const detailValue = { fontSize: '14px', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.5' }
const hr = { borderColor: '#e5e5e5', margin: '12px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
